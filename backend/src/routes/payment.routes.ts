import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Initialize Razorpay (mock for now - you need to add actual Razorpay integration)
const razorpay = {
  orders: {
    create: async (options: any) => ({
      id: `order_${Date.now()}`,
      amount: options.amount,
      currency: options.currency
    })
  }
};

// Create payment order
router.post('/create-order',
  authenticate,
  authorize('patient', 'admin', 'receptionist'),
  [
    body('amount').isDecimal().withMessage('Valid amount is required').custom(value => parseFloat(value) >= 0).withMessage('Amount must be non-negative'),
    body('payment_type').isIn(['consultation', 'bed', 'medicine', 'lab_test', 'registration']).withMessage('Invalid payment type')
  ],
  asyncHandler(async (req, res) => {
    const { amount, payment_type, appointment_id, description } = req.body;
    const userId = (req as any).user?.id;
    
    // Get patient ID
    let patientId: string;
    if (payment_type === 'consultation' && appointment_id) {
      const appointmentResult = await query(
        'SELECT patient_id FROM appointments WHERE id = $1',
        [appointment_id]
      );
      if (appointmentResult.rows.length === 0) {
        throw new AppError('Appointment not found', 404);
      }
      patientId = appointmentResult.rows[0].patient_id;
    } else {
      const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [userId]);
      if (patientResult.rows.length === 0) {
        throw new AppError('Patient profile not found', 404);
      }
      patientId = patientResult.rows[0].id;
    }
    
    // Calculate totals
    const discount_amount = 0;
    const tax_amount = amount * 0.18; // 18% GST
    const total_amount = parseFloat(amount) + tax_amount - discount_amount;
    
    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(total_amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };
    
    const order = await razorpay.orders.create(orderOptions);
    
    // Save payment record
    const paymentResult = await query(
      `INSERT INTO payments (appointment_id, patient_id, amount, discount_amount, tax_amount, 
       total_amount, razorpay_order_id, payment_type, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [appointment_id || null, patientId, amount, discount_amount, tax_amount, 
       total_amount, order.id, payment_type, description]
    );
    
    res.json({
      success: true,
      data: {
        payment: paymentResult.rows[0],
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      }
    });
  })
);

// Verify payment
router.post('/verify',
  authenticate,
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature (you need to implement actual verification with Razorpay secret)
    // For now, we'll accept the payment
    
    // Update payment status
    const paymentResult = await query(
      `UPDATE payments 
       SET status = 'success',
           razorpay_payment_id = $1,
           razorpay_signature = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE razorpay_order_id = $3
       RETURNING *`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );
    
    if (paymentResult.rows.length === 0) {
      throw new AppError('Payment record not found', 404);
    }
    
    const payment = paymentResult.rows[0];
    
    // If this is for an appointment, update appointment payment status
    if (payment.appointment_id) {
      await query(
        'UPDATE appointments SET payment_status = \'paid\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [payment.appointment_id]
      );
    }
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: payment
    });
  })
);

// Get payment history
router.get('/history',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { page = 1, limit = 20 } = req.query;
    
    let sql = `
      SELECT p.*, 
             a.appointment_date, a.appointment_time,
             pat_u.first_name as patient_first_name, pat_u.last_name as patient_last_name
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      JOIN patients pat ON p.patient_id = pat.id
      JOIN users pat_u ON pat.user_id = pat_u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    // If patient, show only their payments
    if (userRole === 'patient') {
      sql += ` AND pat.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    sql += ` ORDER BY p.created_at DESC`;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Get payment by ID
router.get('/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    let sql = `
      SELECT p.*,
             a.appointment_date, a.appointment_time,
             pat_u.first_name as patient_first_name, pat_u.last_name as patient_last_name,
             pat_u.phone as patient_phone
      FROM payments p
      LEFT JOIN appointments a ON p.appointment_id = a.id
      JOIN patients pat ON p.patient_id = pat.id
      JOIN users pat_u ON pat.user_id = pat_u.id
      WHERE p.id = $1
    `;
    const params: any[] = [id];
    
    if (userRole === 'patient') {
      sql += ` AND pat.user_id = $2`;
      params.push(userId);
    }
    
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      throw new AppError('Payment not found', 404);
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

// Get payment statistics (admin)
router.get('/stats/overview',
  authenticate,
  authorize('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { start_date, end_date } = req.query;
    
    let dateFilter = '';
    const params: any[] = [];
    
    if (start_date && end_date) {
      dateFilter = 'WHERE p.created_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    }
    
    const result = await query(`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE status = 'success') as successful_transactions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
        SUM(total_amount) FILTER (WHERE status = 'success') as total_revenue,
        SUM(total_amount) FILTER (WHERE status = 'success' AND payment_type = 'consultation') as consultation_revenue,
        SUM(total_amount) FILTER (WHERE status = 'success' AND payment_type = 'bed') as bed_revenue,
        SUM(total_amount) FILTER (WHERE status = 'success' AND payment_type = 'medicine') as medicine_revenue
      FROM payments p
      ${dateFilter}
    `, params);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

export default router;
