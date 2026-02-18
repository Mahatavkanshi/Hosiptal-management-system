import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Helper function to convert UTC to IST
const convertToIST = (utcDate: Date | string): string => {
  const date = new Date(utcDate);
  // Add 5 hours 30 minutes for IST
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Format as DD/MM/YYYY, HH:MM:SS am/pm
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const year = istTime.getUTCFullYear();
  
  let hours = istTime.getUTCHours();
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');
  
  return `${day}/${month}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
};

// Get doctor dashboard statistics
router.get('/dashboard-stats',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    
    // Get statistics
    const [
      totalAppointments,
      todayAppointments,
      activePatients,
      pendingAppointments,
      bedStats
    ] = await Promise.all([
      // Total appointments for this doctor
      query('SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1', [doctorId]),
      
      // Today's appointments
      query(`
        SELECT COUNT(*) as count,
               COUNT(*) FILTER (WHERE status = 'completed') as completed,
               COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
               COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed')) as upcoming
        FROM appointments
        WHERE doctor_id = $1 AND appointment_date = $2
      `, [doctorId, today]),
      
      // Active patients (patients with appointments in last 30 days)
      query(`
        SELECT COUNT(DISTINCT patient_id) as count 
        FROM appointments 
        WHERE doctor_id = $1 
        AND appointment_date >= CURRENT_DATE - INTERVAL '30 days'
        AND status IN ('completed', 'in_progress', 'confirmed')
      `, [doctorId]),
      
      // Pending appointments
      query(`
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE doctor_id = $1 
        AND status IN ('pending', 'confirmed') 
        AND appointment_date >= CURRENT_DATE
      `, [doctorId]),
      
      // Bed statistics
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'available') as available,
          COUNT(*) FILTER (WHERE status = 'occupied') as occupied
        FROM beds
      `)
    ]);
    
    res.json({
      success: true,
      data: {
        total_appointments: parseInt(totalAppointments.rows[0].count),
        today_appointments: {
          total: parseInt(todayAppointments.rows[0].count),
          completed: parseInt(todayAppointments.rows[0].completed),
          in_progress: parseInt(todayAppointments.rows[0].in_progress),
          upcoming: parseInt(todayAppointments.rows[0].upcoming)
        },
        active_patients: parseInt(activePatients.rows[0].count),
        pending_appointments: parseInt(pendingAppointments.rows[0].count),
        beds: {
          total: parseInt(bedStats.rows[0].total),
          available: parseInt(bedStats.rows[0].available),
          occupied: parseInt(bedStats.rows[0].occupied)
        }
      }
    });
  })
);

// Get doctor's patients with details
router.get('/my-patients',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const { search, page = 1, limit = 20 } = req.query;
    
    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    
    let sql = `
      SELECT DISTINCT 
        p.id,
        p.date_of_birth,
        p.blood_group,
        p.gender,
        p.address,
        p.city,
        p.state,
        p.allergies,
        p.chronic_conditions,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) as age,
        b.bed_number,
        b.room_number,
        b.ward_type,
        CASE WHEN b.id IS NOT NULL THEN true ELSE false END as has_bed
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN appointments a ON p.id = a.patient_id AND a.doctor_id = $1
      LEFT JOIN beds b ON p.id = b.patient_id AND b.status = 'occupied'
      WHERE a.doctor_id = $1
    `;
    
    const params: any[] = [doctorId];
    let paramIndex = 2;
    
    if (search) {
      sql += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` ORDER BY u.first_name ASC`;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total 
       FROM patients p 
       JOIN appointments a ON p.id = a.patient_id 
       WHERE a.doctor_id = $1`,
      [doctorId]
    );
    
    res.json({
      success: true,
      data: {
        patients: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page as string),
          limit: parseInt(limit as string)
        }
      }
    });
  })
);

// Get today's appointments for doctor
router.get('/today-appointments',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    
    const result = await query(`
      SELECT 
        a.*,
        p.date_of_birth,
        p.address,
        p.city,
        p.state,
        u.first_name as patient_first_name,
        u.last_name as patient_last_name,
        u.phone as patient_phone,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) as patient_age
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = $1 
      AND a.appointment_date = $2
      ORDER BY a.appointment_time ASC
    `, [doctorId, today]);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Get recent activity for doctor
router.get('/activity',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const { limit = 10 } = req.query;
    
    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    
    // Combine appointments and medical records as activity
    const result = await query(`
      (SELECT 
        'appointment' as type,
        a.id,
        a.appointment_date as date,
        a.appointment_time as time,
        a.status,
        u.first_name || ' ' || u.last_name as patient_name,
        'Appointment ' || a.status as description,
        a.created_at
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = $1)
      
      UNION ALL
      
      (SELECT 
        'medical_record' as type,
        mr.id,
        mr.visit_date as date,
        NULL as time,
        'completed' as status,
        u.first_name || ' ' || u.last_name as patient_name,
        'Medical record created' as description,
        mr.created_at
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE mr.doctor_id = $1)
      
      ORDER BY created_at DESC
      LIMIT $2
    `, [doctorId, limit]);
    
    // Convert created_at to IST for each activity
    const activitiesWithIST = result.rows.map(activity => ({
      ...activity,
      created_at: convertToIST(activity.created_at)
    }));
    
    res.json({
      success: true,
      data: activitiesWithIST
    });
  })
);

// Get medicines that need restocking (low stock)
router.get('/medicine-alerts',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT 
        id,
        name,
        generic_name,
        stock_quantity,
        reorder_level,
        (reorder_level - stock_quantity) as shortage
      FROM medicines
      WHERE stock_quantity <= reorder_level
      ORDER BY (reorder_level - stock_quantity) DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

export default router;
