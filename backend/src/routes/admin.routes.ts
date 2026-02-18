import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get dashboard statistics
router.get('/dashboard',
  authenticate,
  authorize('admin', 'super_admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get various statistics
    const [
      patientsCount,
      doctorsCount,
      todayAppointments,
      pendingAppointments,
      bedStats,
      medicineStats,
      revenueResult
    ] = await Promise.all([
      // Total patients
      query('SELECT COUNT(*) as count FROM patients'),
      
      // Total doctors
      query('SELECT COUNT(*) as count FROM doctors WHERE is_available = true'),
      
      // Today's appointments
      query(`
        SELECT COUNT(*) as count,
               COUNT(*) FILTER (WHERE status = 'completed') as completed,
               COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
               COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')) as upcoming
        FROM appointments
        WHERE appointment_date = $1
      `, [today]),
      
      // Pending appointments
      query(`
        SELECT COUNT(*) as count FROM appointments 
        WHERE status = 'pending' AND appointment_date >= CURRENT_DATE
      `),
      
      // Bed statistics
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'available') as available,
          COUNT(*) FILTER (WHERE status = 'occupied') as occupied
        FROM beds
      `),
      
      // Medicine statistics
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE stock_quantity = 0) as out_of_stock,
          COUNT(*) FILTER (WHERE stock_quantity <= reorder_level) as low_stock
        FROM medicines
      `),
      
      // Revenue
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as today_revenue
        FROM payments
        WHERE status = 'success'
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          total_patients: parseInt(patientsCount.rows[0].count),
          total_doctors: parseInt(doctorsCount.rows[0].count),
          pending_appointments: parseInt(pendingAppointments.rows[0].count)
        },
        today_appointments: {
          total: parseInt(todayAppointments.rows[0].count),
          completed: parseInt(todayAppointments.rows[0].completed),
          in_progress: parseInt(todayAppointments.rows[0].in_progress),
          upcoming: parseInt(todayAppointments.rows[0].upcoming)
        },
        beds: {
          total: parseInt(bedStats.rows[0].total),
          available: parseInt(bedStats.rows[0].available),
          occupied: parseInt(bedStats.rows[0].occupied),
          occupancy_rate: Math.round((parseInt(bedStats.rows[0].occupied) / parseInt(bedStats.rows[0].total)) * 100)
        },
        medicines: {
          total: parseInt(medicineStats.rows[0].total),
          out_of_stock: parseInt(medicineStats.rows[0].out_of_stock),
          low_stock: parseInt(medicineStats.rows[0].low_stock)
        },
        revenue: {
          total: parseFloat(revenueResult.rows[0].total_revenue),
          today: parseFloat(revenueResult.rows[0].today_revenue)
        }
      }
    });
  })
);

// Get recent appointments
router.get('/recent-appointments',
  authenticate,
  authorize('admin', 'super_admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    
    const result = await query(`
      SELECT a.*,
             u.first_name as doctor_first_name, u.last_name as doctor_last_name,
             p_u.first_name as patient_first_name, p_u.last_name as patient_last_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      JOIN patients p ON a.patient_id = p.id
      JOIN users p_u ON p.user_id = p_u.id
      ORDER BY a.created_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Get revenue analytics
router.get('/revenue-analytics',
  authenticate,
  authorize('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { period = 'month' } = req.query; // week, month, year
    
    let groupBy: string;
    let dateFilter: string;
    
    switch (period) {
      case 'week':
        groupBy = 'DATE(created_at)';
        dateFilter = 'created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'month':
        groupBy = 'DATE(created_at)';
        dateFilter = 'created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
        break;
      case 'year':
        groupBy = 'DATE_TRUNC(\'month\', created_at)';
        dateFilter = 'created_at >= CURRENT_DATE - INTERVAL \'1 year\'';
        break;
      default:
        groupBy = 'DATE(created_at)';
        dateFilter = 'created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
    }
    
    const result = await query(`
      SELECT 
        ${groupBy} as date,
        COUNT(*) as transactions,
        SUM(total_amount) as revenue
      FROM payments
      WHERE status = 'success' AND ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Get user management data
router.get('/users',
  authenticate,
  authorize('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 20 } = req.query;
    
    let sql = `
      SELECT id, email, role, first_name, last_name, phone, is_active, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (role) {
      sql += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` ORDER BY created_at DESC`;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM users WHERE 1=1 ${role ? 'AND role = $1' : ''}`,
      role ? [role] : []
    );
    
    res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      }
    });
  })
);

// Toggle user status (activate/deactivate)
router.put('/users/:id/status',
  authenticate,
  authorize('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;
    
    // Prevent deactivating own account
    if (id === (req as any).user?.id) {
      throw new AppError('Cannot deactivate your own account', 400);
    }
    
    await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [is_active, id]
    );
    
    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  })
);

// Get audit logs
router.get('/audit-logs',
  authenticate,
  authorize('admin', 'super_admin'),
  asyncHandler(async (req, res) => {
    const { user_id, action, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (user_id) {
      sql += ` AND al.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }
    
    if (action) {
      sql += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }
    
    sql += ` ORDER BY al.created_at DESC`;
    
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

export default router;
