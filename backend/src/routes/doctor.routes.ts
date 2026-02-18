import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get all doctors (public)
router.get('/', asyncHandler(async (req, res) => {
  const { specialization, available, page = 1, limit = 10 } = req.query;
  
  let sql = `
    SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE u.is_active = true
  `;
  const params: any[] = [];
  let paramIndex = 1;
  
  if (specialization) {
    sql += ` AND d.specialization ILIKE $${paramIndex}`;
    params.push(`%${specialization}%`);
    paramIndex++;
  }
  
  if (available === 'true') {
    sql += ` AND d.is_available = true`;
  }
  
  sql += ` ORDER BY d.rating DESC, u.first_name ASC`;
  
  // Add pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get doctor by ID (public)
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query(
    `SELECT d.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     WHERE d.id = $1 AND u.is_active = true`,
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new AppError('Doctor not found', 404);
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Get doctor availability
router.get('/:id/availability', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  
  // Get doctor details
  const doctorResult = await query(
    'SELECT * FROM doctors WHERE id = $1',
    [id]
  );
  
  if (doctorResult.rows.length === 0) {
    throw new AppError('Doctor not found', 404);
  }
  
  const doctor = doctorResult.rows[0];
  
  // Get booked slots for the date
  const bookedResult = await query(
    'SELECT appointment_time FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status IN (\'confirmed\', \'pending\', \'in_progress\')',
    [id, date]
  );
  
  const bookedSlots = bookedResult.rows.map(row => row.appointment_time);
  
  // Generate available slots
  const availableDays = doctor.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayOfWeek = new Date(date as string).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  let availableSlots: string[] = [];
  
  if (availableDays.includes(dayOfWeek)) {
    const start = doctor.available_time_start || '09:00';
    const end = doctor.available_time_end || '17:00';
    const duration = doctor.slot_duration || 30;
    
    // Generate slots
    let current = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    
    while (current < endTime) {
      const timeStr = current.toTimeString().substring(0, 5);
      if (!bookedSlots.includes(timeStr)) {
        availableSlots.push(timeStr);
      }
      current.setMinutes(current.getMinutes() + duration);
    }
  }
  
  res.json({
    success: true,
    data: {
      doctor_id: id,
      date,
      is_available: availableDays.includes(dayOfWeek),
      available_slots: availableSlots,
      booked_slots: bookedSlots
    }
  });
}));

// Update doctor availability (doctor only)
router.put('/:id/availability', authenticate, authorize('doctor', 'admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  
  // Check if doctor is updating their own profile or admin
  if (userRole === 'doctor') {
    const doctorResult = await query('SELECT id FROM doctors WHERE id = $1 AND user_id = $2', [id, userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Unauthorized', 403);
    }
  }
  
  const { available_days, available_time_start, available_time_end, slot_duration, is_available } = req.body;
  
  await query(
    `UPDATE doctors 
     SET available_days = COALESCE($1, available_days),
         available_time_start = COALESCE($2, available_time_start),
         available_time_end = COALESCE($3, available_time_end),
         slot_duration = COALESCE($4, slot_duration),
         is_available = COALESCE($5, is_available),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6`,
    [
      available_days ? JSON.stringify(available_days) : null,
      available_time_start,
      available_time_end,
      slot_duration,
      is_available,
      id
    ]
  );
  
  res.json({
    success: true,
    message: 'Availability updated successfully'
  });
}));

export default router;
