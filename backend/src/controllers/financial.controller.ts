import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Get dashboard summary for admin
export const getDashboardSummary = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // Get today's stats
    const todayRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM invoices 
       WHERE invoice_date = $1 AND status IN ('paid', 'partial')`,
      [today]
    );

    const todayAppointments = await query(
      `SELECT COUNT(*) as count FROM appointments WHERE appointment_date = $1`,
      [today]
    );

    const todayPatients = await query(
      `SELECT COUNT(*) as count FROM patients 
       WHERE created_at >= $1 AND created_at < $2`,
      [`${today} 00:00:00`, `${today} 23:59:59`]
    );

    // Get bed occupancy
    const totalBeds = await query('SELECT COUNT(*) as count FROM beds');
    const occupiedBeds = await query("SELECT COUNT(*) as count FROM beds WHERE status = 'occupied'");
    const occupancyRate = Math.round((occupiedBeds.rows[0].count / totalBeds.rows[0].count) * 100);

    // Get monthly revenue
    const monthlyRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM invoices 
       WHERE invoice_date >= $1 AND status IN ('paid', 'partial')`,
      [firstDayOfMonth]
    );

    // Get pending payments
    const pendingPayments = await query(
      `SELECT COALESCE(SUM(balance_amount), 0) as amount FROM invoices 
       WHERE status IN ('sent', 'partial', 'overdue')`
    );

    // Get user counts by role
    const userStats = await query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );

    res.json({
      success: true,
      data: {
        today: {
          revenue: parseFloat(todayRevenue.rows[0].revenue) || 0,
          appointments: parseInt(todayAppointments.rows[0].count) || 0,
          newPatients: parseInt(todayPatients.rows[0].count) || 0
        },
        beds: {
          total: parseInt(totalBeds.rows[0].count) || 0,
          occupied: parseInt(occupiedBeds.rows[0].count) || 0,
          occupancyRate
        },
        monthlyRevenue: parseFloat(monthlyRevenue.rows[0].revenue) || 0,
        pendingPayments: parseFloat(pendingPayments.rows[0].amount) || 0,
        userStats: userStats.rows
      }
    });
  }
);

// Get revenue analytics
export const getRevenueAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { range = 'year' } = req.query;
    
    let dateFilter = '';
    const now = new Date();
    
    switch (range) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND invoice_date >= '${weekAgo.toISOString().split('T')[0]}'`;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND invoice_date >= '${monthAgo.toISOString().split('T')[0]}'`;
        break;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = `AND invoice_date >= '${quarterAgo.toISOString().split('T')[0]}'`;
        break;
      default: // year
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = `AND invoice_date >= '${yearAgo.toISOString().split('T')[0]}'`;
    }

    // Revenue by month
    const revenueByMonth = await query(
      `SELECT 
        TO_CHAR(invoice_date, 'YYYY-MM') as month,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as invoice_count
       FROM invoices 
       WHERE status IN ('paid', 'partial') ${dateFilter}
       GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
       ORDER BY month`
    );

    // Revenue by payment method
    const revenueByMethod = await query(
      `SELECT 
        payment_method,
        COALESCE(SUM(total_amount), 0) as amount,
        COUNT(*) as count
       FROM invoices 
       WHERE status IN ('paid', 'partial') ${dateFilter}
       GROUP BY payment_method`
    );

    // Department-wise revenue (based on invoice items)
    const departmentRevenue = await query(
      `SELECT 
        item_type as department,
        COALESCE(SUM(total_price), 0) as revenue
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE i.status IN ('paid', 'partial') ${dateFilter}
       GROUP BY item_type`
    );

    res.json({
      success: true,
      data: {
        revenueByMonth: revenueByMonth.rows,
        revenueByMethod: revenueByMethod.rows,
        departmentRevenue: departmentRevenue.rows
      }
    });
  }
);

// Create invoice
export const createInvoice = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      patient_id,
      appointment_id,
      items,
      discount_percentage = 0,
      tax_percentage = 0,
      notes
    } = req.body;

    const created_by = (req as any).user?.id;

    // Calculate totals
    let subtotal = 0;
    items.forEach((item: any) => {
      subtotal += item.quantity * item.unit_price;
    });

    const discount_amount = (subtotal * discount_percentage) / 100;
    const taxable_amount = subtotal - discount_amount;
    const tax_amount = (taxable_amount * tax_percentage) / 100;
    const total_amount = taxable_amount + tax_amount;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const invoiceResult = await query(
      `INSERT INTO invoices (
        invoice_number, patient_id, appointment_id, subtotal, 
        discount_amount, discount_percentage, tax_amount, tax_percentage,
        total_amount, balance_amount, status, invoice_date, due_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sent', CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', $11, $12)
      RETURNING *`,
      [invoiceNumber, patient_id, appointment_id, subtotal, discount_amount, 
       discount_percentage, tax_amount, tax_percentage, total_amount, total_amount, notes, created_by]
    );

    const invoiceId = invoiceResult.rows[0].id;

    // Create invoice items
    for (const item of items) {
      await query(
        `INSERT INTO invoice_items (invoice_id, item_type, item_name, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [invoiceId, item.item_type, item.item_name, item.description, 
         item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoiceResult.rows[0]
    });
  }
);

// Get all invoices
export const getInvoices = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status, patient_id, page = 1, limit = 20 } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += `WHERE i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (patient_id) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` i.patient_id = $${paramIndex}`;
      params.push(patient_id);
      paramIndex++;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const invoices = await query(
      `SELECT i.*, 
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        u.first_name as creator_first_name, u.last_name as creator_last_name
       FROM invoices i
       LEFT JOIN patients p ON i.patient_id = p.id
       LEFT JOIN users u ON i.created_by = u.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM invoices i ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        invoices: invoices.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit as string))
      }
    });
  }
);

// Process payment for invoice
export const processPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { amount, payment_method, razorpay_payment_id } = req.body;

    const invoice = await query(
      'SELECT * FROM invoices WHERE id = $1',
      [id]
    );

    if (invoice.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const currentInvoice = invoice.rows[0];
    const newPaidAmount = parseFloat(currentInvoice.paid_amount) + parseFloat(amount);
    const newBalance = parseFloat(currentInvoice.total_amount) - newPaidAmount;

    let status = 'partial';
    if (newBalance <= 0) {
      status = 'paid';
    }

    const result = await query(
      `UPDATE invoices 
       SET paid_amount = $1, balance_amount = $2, status = $3, 
           payment_method = $4, razorpay_payment_id = $5, paid_date = CURRENT_DATE
       WHERE id = $6
       RETURNING *`,
      [newPaidAmount, newBalance, status, payment_method, razorpay_payment_id, id]
    );

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: result.rows[0]
    });
  }
);

// Create expense
export const createExpense = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      category,
      amount,
      description,
      vendor_name,
      vendor_contact,
      payment_method,
      expense_date
    } = req.body;

    const created_by = (req as any).user?.id;

    const result = await query(
      `INSERT INTO expenses (category, amount, description, vendor_name, vendor_contact, 
        payment_method, expense_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [category, amount, description, vendor_name, vendor_contact, 
       payment_method, expense_date, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: result.rows[0]
    });
  }
);

// Get expenses
export const getExpenses = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { category, start_date, end_date, page = 1, limit = 20 } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      whereClause += `WHERE category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (start_date && end_date) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` expense_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const expenses = await query(
      `SELECT e.*, u.first_name as creator_first_name, u.last_name as creator_last_name
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       ${whereClause}
       ORDER BY e.expense_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit as string), offset]
    );

    res.json({
      success: true,
      data: expenses.rows
    });
  }
);

// Create vendor payment
export const createVendorPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      vendor_name,
      vendor_contact,
      vendor_email,
      amount,
      description,
      invoice_number,
      invoice_date,
      due_date
    } = req.body;

    const created_by = (req as any).user?.id;

    const result = await query(
      `INSERT INTO vendor_payments (vendor_name, vendor_contact, vendor_email, amount, 
        description, invoice_number, invoice_date, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [vendor_name, vendor_contact, vendor_email, amount, description, 
       invoice_number, invoice_date, due_date, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Vendor payment recorded successfully',
      data: result.rows[0]
    });
  }
);

// Get vendor payments
export const getVendorPayments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status } = req.query;
    
    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }

    const payments = await query(
      `SELECT * FROM vendor_payments ${whereClause} ORDER BY created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: payments.rows
    });
  }
);

// Create insurance claim
export const createInsuranceClaim = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      patient_id,
      claim_number,
      insurance_company,
      policy_number,
      claim_amount,
      submission_date,
      documents
    } = req.body;

    const created_by = (req as any).user?.id;

    const result = await query(
      `INSERT INTO insurance_claims (patient_id, claim_number, insurance_company, 
        policy_number, claim_amount, submission_date, documents, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [patient_id, claim_number, insurance_company, policy_number, 
       claim_amount, submission_date, JSON.stringify(documents), created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Insurance claim created successfully',
      data: result.rows[0]
    });
  }
);

// Get insurance claims
export const getInsuranceClaims = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status, patient_id } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += `WHERE status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (patient_id) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` patient_id = $${paramIndex}`;
      params.push(patient_id);
    }

    const claims = await query(
      `SELECT ic.*, p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM insurance_claims ic
       LEFT JOIN patients p ON ic.patient_id = p.id
       ${whereClause}
       ORDER BY ic.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: claims.rows
    });
  }
);

// Create payroll record
export const createPayroll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      user_id,
      month,
      year,
      basic_salary,
      hra = 0,
      da = 0,
      ta = 0,
      medical_allowance = 0,
      other_allowances = 0,
      pf_deduction = 0,
      tds_deduction = 0,
      professional_tax = 0,
      other_deductions = 0,
      working_days,
      present_days,
      leave_days,
      bank_account_number,
      ifsc_code
    } = req.body;

    const created_by = (req as any).user?.id;

    // Calculate totals
    const gross_salary = basic_salary + hra + da + ta + medical_allowance + other_allowances;
    const total_deductions = pf_deduction + tds_deduction + professional_tax + other_deductions;
    const net_salary = gross_salary - total_deductions;

    const result = await query(
      `INSERT INTO payroll_records (
        user_id, month, year, basic_salary, hra, da, ta, medical_allowance, 
        other_allowances, gross_salary, pf_deduction, tds_deduction, 
        professional_tax, other_deductions, total_deductions, net_salary,
        working_days, present_days, leave_days, bank_account_number, ifsc_code, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       RETURNING *`,
      [user_id, month, year, basic_salary, hra, da, ta, medical_allowance,
       other_allowances, gross_salary, pf_deduction, tds_deduction,
       professional_tax, other_deductions, total_deductions, net_salary,
       working_days, present_days, leave_days, bank_account_number, ifsc_code, created_by]
    );

    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: result.rows[0]
    });
  }
);

// Get payroll records
export const getPayroll = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { user_id, month, year } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (user_id) {
      whereClause += `WHERE user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (month && year) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` month = $${paramIndex} AND year = $${paramIndex + 1}`;
      params.push(month, year);
    }

    const payroll = await query(
      `SELECT pr.*, u.first_name, u.last_name, u.email
       FROM payroll_records pr
       JOIN users u ON pr.user_id = u.id
       ${whereClause}
       ORDER BY pr.year DESC, pr.month DESC`,
      params
    );

    res.json({
      success: true,
      data: payroll.rows
    });
  }
);

// Get financial summary for dashboard
export const getFinancialSummary = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

    // Today's revenue
    const todayRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as amount FROM invoices 
       WHERE invoice_date = $1 AND status IN ('paid', 'partial')`,
      [today]
    );

    // Monthly revenue
    const monthlyRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as amount FROM invoices 
       WHERE invoice_date >= $1 AND status IN ('paid', 'partial')`,
      [firstDayOfMonth]
    );

    // Yearly revenue
    const yearlyRevenue = await query(
      `SELECT COALESCE(SUM(total_amount), 0) as amount FROM invoices 
       WHERE invoice_date >= $1 AND status IN ('paid', 'partial')`,
      [firstDayOfYear]
    );

    // Monthly expenses
    const monthlyExpenses = await query(
      `SELECT COALESCE(SUM(amount), 0) as amount FROM expenses 
       WHERE expense_date >= $1 AND status = 'approved'`,
      [firstDayOfMonth]
    );

    // Pending payments
    const pendingPayments = await query(
      `SELECT COALESCE(SUM(balance_amount), 0) as amount FROM invoices 
       WHERE status IN ('sent', 'partial', 'overdue')`
    );

    // Pending insurance claims
    const pendingClaims = await query(
      `SELECT COALESCE(SUM(claim_amount), 0) as amount FROM insurance_claims 
       WHERE status IN ('submitted', 'under_review')`
    );

    // Vendor payments due
    const vendorPaymentsDue = await query(
      `SELECT COALESCE(SUM(amount), 0) as amount FROM vendor_payments 
       WHERE status = 'pending' AND due_date < CURRENT_DATE`
    );

    res.json({
      success: true,
      data: {
        revenue: {
          today: parseFloat(todayRevenue.rows[0].amount) || 0,
          thisMonth: parseFloat(monthlyRevenue.rows[0].amount) || 0,
          thisYear: parseFloat(yearlyRevenue.rows[0].amount) || 0
        },
        expenses: {
          thisMonth: parseFloat(monthlyExpenses.rows[0].amount) || 0
        },
        pending: {
          payments: parseFloat(pendingPayments.rows[0].amount) || 0,
          insuranceClaims: parseFloat(pendingClaims.rows[0].amount) || 0,
          vendorPayments: parseFloat(vendorPaymentsDue.rows[0].amount) || 0
        }
      }
    });
  }
);
