import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { query, withTransaction } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generateQueueNumber } from '../utils/helpers';
import { io } from '../server';

const router = Router();

// Create appointment (patient)
router.post('/',
  authenticate,
  authorize('patient'),
  [
    body('doctor_id').isUUID().withMessage('Valid doctor ID is required'),
    body('appointment_date').isDate().withMessage('Valid date is required'),
    body('appointment_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
    body('type').optional().isIn(['in_person', 'video']).withMessage('Type must be in_person or video'),
    body('symptoms').optional().trim()
  ],
  asyncHandler(async (req, res) => {
    const userId = (req as any).user?.id;
    const { doctor_id, appointment_date, appointment_time, type = 'in_person', symptoms, notes } = req.body;
    
    // Get patient ID
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    if (patientResult.rows.length === 0) {
      throw new AppError('Patient profile not found', 404);
    }
    const patientId = patientResult.rows[0].id;
    
    // Get doctor details
    const doctorResult = await query(
      'SELECT * FROM doctors WHERE id = $1 AND is_available = true',
      [doctor_id]
    );
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found or unavailable', 404);
    }
    const doctor = doctorResult.rows[0];
    
    // Check if slot is already booked
    const existingAppointment = await query(
      `SELECT * FROM appointments 
       WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 
       AND status IN ('pending', 'confirmed', 'in_progress')`,
      [doctor_id, appointment_date, appointment_time]
    );
    
    if (existingAppointment.rows.length > 0) {
      throw new AppError('This time slot is already booked', 409);
    }
    
    // Calculate end time
    const [hours, minutes] = appointment_time.split(':').map(Number);
    const startDate = new Date(2000, 0, 1, hours, minutes);
    const endDate = new Date(startDate.getTime() + (doctor.slot_duration || 30) * 60000);
    const end_time = endDate.toTimeString().substring(0, 5);
    
    // Generate queue number
    const queueResult = await query(
      'SELECT COALESCE(MAX(queue_number), 0) + 1 as next_queue FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status IN (\'pending\', \'confirmed\', \'in_progress\')',
      [doctor_id, appointment_date]
    );
    const queue_number = queueResult.rows[0].next_queue;
    
    // Create appointment
    const appointmentResult = await query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, end_time, 
       type, symptoms, notes, queue_number, payment_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [patientId, doctor_id, appointment_date, appointment_time, end_time, type, symptoms, notes, queue_number, doctor.consultation_fee]
    );
    
    const appointment = appointmentResult.rows[0];
    
    // Notify doctor via socket
    io.to(`user-${doctor.user_id}`).emit('new-appointment', appointment);
    io.to(`doctor-queue-${doctor_id}`).emit('queue-updated', { doctor_id, action: 'new' });
    
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  })
);

// Get all appointments (admin, receptionist)
router.get('/',
  authenticate,
  authorize('admin', 'receptionist', 'doctor', 'nurse'),
  asyncHandler(async (req, res) => {
    const { status, doctor_id, date, page = 1, limit = 20 } = req.query;
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    
    let sql = `
      SELECT a.*, 
             p.date_of_birth, p.blood_group, p.gender,
             d.specialization, d.consultation_fee,
             doc_u.first_name as doctor_first_name, doc_u.last_name as doctor_last_name,
             pat_u.first_name as patient_first_name, pat_u.last_name as patient_last_name,
             pat_u.phone as patient_phone
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc_u ON d.user_id = doc_u.id
      JOIN users pat_u ON p.user_id = pat_u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    // If doctor, only show their appointments
    if (userRole === 'doctor') {
      sql += ` AND d.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (doctor_id) {
      sql += ` AND a.doctor_id = $${paramIndex}`;
      params.push(doctor_id);
      paramIndex++;
    }
    
    if (date) {
      sql += ` AND a.appointment_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    
    sql += ` ORDER BY a.appointment_date DESC, a.appointment_time ASC`;
    
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

// Get appointment by ID
router.get('/:id',
  authenticate,
  param('id').isUUID(),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    let sql = `
      SELECT a.*,
             p.date_of_birth, p.blood_group, p.gender, p.allergies, p.chronic_conditions,
             d.specialization, d.consultation_fee, d.user_id as doctor_user_id,
             doc_u.first_name as doctor_first_name, doc_u.last_name as doctor_last_name, doc_u.phone as doctor_phone,
             pat_u.first_name as patient_first_name, pat_u.last_name as patient_last_name, pat_u.phone as patient_phone,
             pat_u.id as patient_user_id
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users doc_u ON d.user_id = doc_u.id
      JOIN users pat_u ON p.user_id = pat_u.id
      WHERE a.id = $1
    `;
    const params: any[] = [id];
    
    // If patient, only show their own appointments
    if (userRole === 'patient') {
      sql += ` AND pat_u.id = $2`;
      params.push(userId);
    }
    // If doctor, only show their own appointments
    else if (userRole === 'doctor') {
      sql += ` AND d.user_id = $2`;
      params.push(userId);
    }
    
    const result = await query(sql, params);
    
    if (result.rows.length === 0) {
      throw new AppError('Appointment not found', 404);
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

// Update appointment status
router.put('/:id/status',
  authenticate,
  authorize('doctor', 'admin', 'receptionist'),
  [
    param('id').isUUID(),
    body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'in_progress']).withMessage('Invalid status')
  ],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, cancellation_reason } = req.body;
    const userId = (req as any).user?.id;
    
    // Get current appointment
    const appointmentResult = await query(
      `SELECT a.*, d.user_id as doctor_user_id, p.user_id as patient_user_id
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       WHERE a.id = $1`,
      [id]
    );
    
    if (appointmentResult.rows.length === 0) {
      throw new AppError('Appointment not found', 404);
    }
    
    const appointment = appointmentResult.rows[0];
    
    // Update status
    await query(
      `UPDATE appointments 
       SET status = $1, 
           cancellation_reason = COALESCE($2, cancellation_reason),
           cancelled_by = CASE WHEN $1 = 'cancelled' THEN $3 ELSE cancelled_by END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, cancellation_reason, userId, id]
    );
    
    // Notify patient and doctor
    io.to(`user-${appointment.patient_user_id}`).emit('appointment-updated', { appointment_id: id, status });
    io.to(`user-${appointment.doctor_user_id}`).emit('appointment-updated', { appointment_id: id, status });
    io.to(`doctor-queue-${appointment.doctor_id}`).emit('queue-updated', { doctor_id: appointment.doctor_id, action: 'status_change' });
    
    res.json({
      success: true,
      message: 'Appointment status updated successfully'
    });
  })
);

// Cancel appointment (patient)
router.post('/:id/cancel',
  authenticate,
  authorize('patient'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;
    
    // Verify appointment belongs to patient
    const appointmentResult = await query(
      `SELECT a.*, p.user_id as patient_user_id, d.user_id as doctor_user_id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1 AND p.user_id = $2`,
      [id, userId]
    );
    
    if (appointmentResult.rows.length === 0) {
      throw new AppError('Appointment not found', 404);
    }
    
    const appointment = appointmentResult.rows[0];
    
    if (appointment.status === 'cancelled') {
      throw new AppError('Appointment is already cancelled', 400);
    }
    
    if (appointment.status === 'completed') {
      throw new AppError('Cannot cancel completed appointment', 400);
    }
    
    await query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           cancellation_reason = $1,
           cancelled_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [reason, userId, id]
    );
    
    // Notify doctor
    io.to(`user-${appointment.doctor_user_id}`).emit('appointment-cancelled', { appointment_id: id });
    io.to(`doctor-queue-${appointment.doctor_id}`).emit('queue-updated', { doctor_id: appointment.doctor_id, action: 'cancelled' });
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  })
);

export default router;
