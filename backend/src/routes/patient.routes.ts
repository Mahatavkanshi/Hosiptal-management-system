import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get patient medical history (patient, doctor, admin)
router.get('/medical-history', authenticate, authorize('patient', 'doctor', 'admin', 'nurse'), asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  
  let patientId: string;
  
  if (userRole === 'patient') {
    // Get patient's own ID
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    if (patientResult.rows.length === 0) {
      throw new AppError('Patient profile not found', 404);
    }
    patientId = patientResult.rows[0].id;
  } else {
    // For doctors/nurses, patient ID must be provided
    patientId = req.query.patient_id as string;
    if (!patientId) {
      throw new AppError('Patient ID is required', 400);
    }
  }
  
  const result = await query(
    `SELECT mr.*, 
            d.specialization as doctor_specialization,
            u.first_name as doctor_first_name,
            u.last_name as doctor_last_name
     FROM medical_records mr
     LEFT JOIN doctors d ON mr.doctor_id = d.id
     LEFT JOIN users u ON d.user_id = u.id
     WHERE mr.patient_id = $1
     ORDER BY mr.visit_date DESC, mr.created_at DESC`,
    [patientId]
  );
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get patient prescriptions
router.get('/prescriptions', authenticate, authorize('patient', 'doctor', 'admin', 'nurse'), asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const userRole = (req as any).user?.role;
  
  let patientId: string;
  
  if (userRole === 'patient') {
    const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [userId]);
    if (patientResult.rows.length === 0) {
      throw new AppError('Patient profile not found', 404);
    }
    patientId = patientResult.rows[0].id;
  } else {
    patientId = req.query.patient_id as string;
    if (!patientId) {
      throw new AppError('Patient ID is required', 400);
    }
  }
  
  const result = await query(
    `SELECT p.*, mr.visit_date, 
            u.first_name as doctor_first_name,
            u.last_name as doctor_last_name
     FROM prescriptions p
     JOIN medical_records mr ON p.medical_record_id = mr.id
     JOIN doctors d ON mr.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE mr.patient_id = $1
     ORDER BY mr.visit_date DESC`,
    [patientId]
  );
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get patient appointments
router.get('/appointments', authenticate, authorize('patient'), asyncHandler(async (req, res) => {
  const userId = (req as any).user?.id;
  const { status, page = 1, limit = 10 } = req.query;
  
  const patientResult = await query('SELECT id FROM patients WHERE user_id = $1', [userId]);
  if (patientResult.rows.length === 0) {
    throw new AppError('Patient profile not found', 404);
  }
  
  const patientId = patientResult.rows[0].id;
  
  let sql = `
    SELECT a.*, 
           d.specialization,
           u.first_name as doctor_first_name,
           u.last_name as doctor_last_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users u ON d.user_id = u.id
    WHERE a.patient_id = $1
  `;
  const params: any[] = [patientId];
  let paramIndex = 2;
  
  if (status) {
    sql += ` AND a.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  sql += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
  
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

export default router;
