import { Request, Response } from 'express';
import { query } from '../config/database';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import { io } from '../server';

// Get all doctors with their queue status
export const getDoctorsQueue = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await query(`
      SELECT 
        d.id,
        u.first_name || ' ' || u.last_name as name,
        d.specialization,
        d.is_available as status,
        d.consultation_fee,
        'Room ' || floor(random() * 5 + 1)::int as room,
        COUNT(CASE WHEN a.status = 'in_progress' THEN 1 END) as current_patients,
        COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as waiting_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments a ON d.id = a.doctor_id 
        AND a.appointment_date = CURRENT_DATE
        AND a.status IN ('confirmed', 'in_progress')
      WHERE u.is_active = true
      GROUP BY d.id, u.first_name, u.last_name, d.specialization, d.is_available, d.consultation_fee
      ORDER BY u.first_name
    `);

    const doctors = result.rows.map(doc => ({
      ...doc,
      status: doc.current_patients > 0 ? 'busy' : doc.status ? 'available' : 'off_duty'
    }));

    res.json({
      success: true,
      data: doctors
    });
  }
);

// Get queue for a specific doctor
export const getDoctorQueue = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { doctorId } = req.params;

    const result = await query(`
      SELECT 
        a.id,
        a.queue_number as token,
        p.id as patient_id,
        u.first_name || ' ' || u.last_name as patient_name,
        u.phone as patient_phone,
        a.appointment_time as check_in_time,
        a.status,
        CASE 
          WHEN a.symptoms ILIKE '%emergency%' OR a.symptoms ILIKE '%critical%' THEN 'emergency'
          WHEN a.queue_number <= 2 THEN 'priority'
          ELSE 'regular'
        END as type,
        a.payment_status as fee_paid,
        COALESCE(a.payment_amount, d.consultation_fee) as fee_amount
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.doctor_id = $1 
        AND a.appointment_date = CURRENT_DATE
        AND a.status IN ('confirmed', 'in_progress', 'completed')
      ORDER BY 
        CASE 
          WHEN a.symptoms ILIKE '%emergency%' OR a.symptoms ILIKE '%critical%' THEN 0
          WHEN a.queue_number <= 2 THEN 1
          ELSE 2
        END,
        a.queue_number
    `, [doctorId]);

    res.json({
      success: true,
      data: result.rows
    });
  }
);

// Get all queues for today
export const getAllQueues = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await query(`
      SELECT 
        a.id,
        a.queue_number as token,
        p.id as patient_id,
        u.first_name || ' ' || u.last_name as patient_name,
        u.phone as patient_phone,
        a.doctor_id,
        a.appointment_time as check_in_time,
        a.status,
        CASE 
          WHEN a.symptoms ILIKE '%emergency%' OR a.symptoms ILIKE '%critical%' THEN 'emergency'
          WHEN a.queue_number <= 2 THEN 'priority'
          ELSE 'regular'
        END as type,
        a.payment_status as fee_paid,
        COALESCE(a.payment_amount, d.consultation_fee) as fee_amount
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date = CURRENT_DATE
        AND a.status IN ('confirmed', 'in_progress', 'completed')
      ORDER BY a.doctor_id, a.queue_number
    `);

    res.json({
      success: true,
      data: result.rows
    });
  }
);

// Add patient to queue (walk-in)
export const addToQueue = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { patient_id, doctor_id, type = 'regular', symptoms = '' } = req.body;

    if (!patient_id || !doctor_id) {
      throw new AppError('Patient ID and Doctor ID are required', 400);
    }

    // Get next queue number for this doctor today
    const queueResult = await query(`
      SELECT COALESCE(MAX(queue_number), 0) + 1 as next_number
      FROM appointments
      WHERE doctor_id = $1 
        AND appointment_date = CURRENT_DATE
        AND status IN ('confirmed', 'in_progress')
    `, [doctor_id]);

    const queueNumber = queueResult.rows[0].next_number;

    // Create appointment
    const result = await query(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, 
        status, type, symptoms, queue_number, payment_status
      ) VALUES ($1, $2, CURRENT_DATE, CURRENT_TIME, 'confirmed', 'in_person', $3, $4, 'pending')
      RETURNING *
    `, [patient_id, doctor_id, symptoms, queueNumber]);

    // Emit socket event for real-time updates
    io.emit('queue-updated', { 
      doctorId: doctor_id, 
      action: 'added',
      appointment: result.rows[0]
    });
    
    // Also emit to the specific doctor's queue room
    io.to(`doctor-queue-${doctor_id}`).emit('doctor-queue-updated', {
      action: 'added',
      appointment: result.rows[0]
    });

    res.status(201).json({
      success: true,
      message: 'Patient added to queue',
      data: {
        ...result.rows[0],
        token: String(queueNumber).padStart(3, '0')
      }
    });
  }
);

// Update appointment status
export const updateQueueStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const result = await query(`
      UPDATE appointments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, appointmentId]);

    if (result.rows.length === 0) {
      throw new AppError('Appointment not found', 404);
    }

    const appointment = result.rows[0];

    // Emit socket event for real-time updates
    io.emit('queue-updated', { 
      doctorId: appointment.doctor_id, 
      action: 'status-changed',
      appointment: appointment
    });

    io.to(`doctor-queue-${appointment.doctor_id}`).emit('doctor-queue-updated', {
      action: 'status-changed',
      appointment: appointment
    });

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: appointment
    });
  }
);

// Call next patient
export const callNextPatient = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { doctorId } = req.params;

    // Get the next waiting patient
    const nextResult = await query(`
      SELECT id, queue_number
      FROM appointments
      WHERE doctor_id = $1 
        AND appointment_date = CURRENT_DATE
        AND status = 'confirmed'
      ORDER BY 
        CASE 
          WHEN symptoms ILIKE '%emergency%' OR symptoms ILIKE '%critical%' THEN 0
          WHEN queue_number <= 2 THEN 1
          ELSE 2
        END,
        queue_number
      LIMIT 1
    `, [doctorId]);

    if (nextResult.rows.length === 0) {
      throw new AppError('No patients waiting in queue', 404);
    }

    const nextPatient = nextResult.rows[0];

    // Update status to in_progress
    await query(`
      UPDATE appointments 
      SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [nextPatient.id]);

    // Emit socket event for real-time updates
    io.emit('queue-updated', { 
      doctorId: doctorId, 
      action: 'next-called',
      appointment: nextPatient
    });

    io.to(`doctor-queue-${doctorId}`).emit('doctor-queue-updated', {
      action: 'next-called',
      appointment: nextPatient
    });

    res.json({
      success: true,
      message: 'Next patient called',
      data: {
        appointment_id: nextPatient.id,
        token: String(nextPatient.queue_number).padStart(3, '0')
      }
    });
  }
);

// Process payment
export const processPayment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { appointmentId } = req.params;
    const { amount, payment_method } = req.body;

    const result = await query(`
      UPDATE appointments 
      SET payment_status = 'paid', 
          payment_amount = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [amount, appointmentId]);

    if (result.rows.length === 0) {
      throw new AppError('Appointment not found', 404);
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: result.rows[0]
    });
  }
);

// Get today's statistics
export const getTodayStats = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status IN ('confirmed', 'in_progress') THEN 1 END) as waiting,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END), 0) as total_revenue
      FROM appointments
      WHERE appointment_date = CURRENT_DATE
    `);

    const doctorStatsResult = await query(`
      SELECT 
        d.id,
        u.first_name || ' ' || u.last_name as name,
        COUNT(CASE WHEN a.status = 'in_progress' THEN 1 END) as current_patients,
        COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as waiting_count,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments a ON d.id = a.doctor_id 
        AND a.appointment_date = CURRENT_DATE
      WHERE u.is_active = true
      GROUP BY d.id, u.first_name, u.last_name
    `);

    res.json({
      success: true,
      data: {
        overall: statsResult.rows[0],
        by_doctor: doctorStatsResult.rows
      }
    });
  }
);

// Search patients
export const searchPatients = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { query: searchQuery } = req.query;

    if (!searchQuery) {
      res.json({ success: true, data: [] });
      return;
    }

    const result = await query(`
      SELECT 
        p.id,
        u.first_name || ' ' || u.last_name as name,
        u.phone,
        u.email,
        p.date_of_birth,
        COUNT(DISTINCT a.id) as total_visits,
        MAX(a.appointment_date) as last_visit,
        COALESCE(
          SUM(CASE WHEN a.payment_status = 'pending' THEN a.payment_amount ELSE 0 END),
          0
        ) as outstanding_amount
      FROM patients p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN appointments a ON p.id = a.patient_id
      WHERE u.first_name ILIKE $1 
        OR u.last_name ILIKE $1 
        OR u.phone ILIKE $1
        OR u.email ILIKE $1
      GROUP BY p.id, u.first_name, u.last_name, u.phone, u.email, p.date_of_birth
      ORDER BY u.first_name
      LIMIT 10
    `, [`%${searchQuery}%`]);

    res.json({
      success: true,
      data: result.rows
    });
  }
);
