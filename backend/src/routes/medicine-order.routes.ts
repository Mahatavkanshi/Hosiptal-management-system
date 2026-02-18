import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Helper function to convert UTC to IST (UTC+5:30)
const convertToIST = (utcDate: Date | string): string => {
  // Parse the UTC date string directly
  const utcString = utcDate.toString();
  
  // Extract components from UTC string (format: 2026-02-18T11:27:47.000Z)
  const match = utcString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
    console.error('Failed to parse date:', utcString);
    return utcString;
  }
  
  const [, year, month, day, hours, minutes, seconds] = match;
  
  // Convert hours to number and add 5 hours 30 minutes for IST
  let totalMinutes = (parseInt(hours) * 60) + parseInt(minutes) + (5 * 60) + 30;
  
  // Handle day overflow
  let dayNum = parseInt(day);
  while (totalMinutes >= 24 * 60) {
    totalMinutes -= 24 * 60;
    dayNum++;
  }
  
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  // Convert to 12-hour format
  const ampm = newHours >= 12 ? 'pm' : 'am';
  const displayHours = newHours % 12 || 12;
  
  const result = `${String(dayNum).padStart(2, '0')}/${month}/${year}, ${String(displayHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:${seconds} ${ampm}`;
  
  console.log('UTC:', utcString, '-> IST:', result);
  
  return result;
};

// Get all medicine orders (doctor can see their own, admin/pharmacist sees all)
router.get('/orders',
  authenticate,
  authorize('doctor', 'admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { status, page = 1, limit = 20 } = req.query;
    
    let sql = `
      SELECT 
        mo.*,
        m.name as medicine_name,
        m.generic_name,
        m.stock_quantity,
        u.first_name as doctor_first_name,
        u.last_name as doctor_last_name
      FROM medicine_orders mo
      JOIN medicines m ON mo.medicine_id = m.id
      JOIN users u ON mo.doctor_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    // If doctor, only show their orders
    if (userRole === 'doctor') {
      sql += ` AND mo.doctor_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND mo.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` ORDER BY mo.created_at DESC`;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    console.log('=== MEDICINE ORDERS DEBUG ===');
    console.log('Total orders found:', result.rows.length);
    
    // Convert created_at to IST string for each order
    const ordersWithIST = result.rows.map(order => {
      // Ensure created_at is converted to a plain string
      const istString = convertToIST(order.created_at);
      return {
        ...order,
        created_at: istString // Plain string format: "18/02/2026, 05:27:47 pm"
      };
    });
    
    res.json({
      success: true,
      data: ordersWithIST
    });
  })
);

// Create medicine order request (doctor)
router.post('/orders',
  authenticate,
  authorize('doctor', 'admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const { medicine_id, quantity, priority = 'normal', notes } = req.body;
    
    // Verify medicine exists
    const medicineResult = await query('SELECT * FROM medicines WHERE id = $1', [medicine_id]);
    if (medicineResult.rows.length === 0) {
      throw new AppError('Medicine not found', 404);
    }
    
    const medicine = medicineResult.rows[0];
    
    // Create order
    const result = await query(
      `INSERT INTO medicine_orders (medicine_id, doctor_id, quantity, priority, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [medicine_id, userId, quantity, priority, notes]
    );
    
    res.status(201).json({
      success: true,
      message: 'Medicine order created successfully',
      data: {
        order: result.rows[0],
        medicine_name: medicine.name
      }
    });
  })
);

// Update medicine order status (admin/pharmacist only)
router.put('/orders/:id/status',
  authenticate,
  authorize('admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    
    await query(
      `UPDATE medicine_orders 
       SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, notes, id]
    );
    
    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  })
);

// Cancel own order (doctor)
router.post('/orders/:id/cancel',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    // Verify order belongs to doctor and is still pending
    const orderResult = await query(
      'SELECT * FROM medicine_orders WHERE id = $1 AND doctor_id = $2 AND status = \'pending\'',
      [id, userId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found or cannot be cancelled', 404);
    }
    
    await query(
      "UPDATE medicine_orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  })
);

// Get order statistics
router.get('/orders/stats',
  authenticate,
  authorize('doctor', 'admin', 'pharmacist'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    let sql = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM medicine_orders
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (userRole === 'doctor') {
      sql += ' AND doctor_id = $1';
      params.push(userId);
    }
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

export default router;
