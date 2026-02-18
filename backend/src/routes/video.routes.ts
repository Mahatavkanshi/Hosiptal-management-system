import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generateRandomString } from '../utils/helpers';

const router = Router();

// Create video call room
router.post('/create-room',
  authenticate,
  authorize('doctor', 'patient'),
  asyncHandler(async (req, res) => {
    const { appointment_id } = req.body;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    // Get appointment details
    let sql = `
      SELECT a.*, d.user_id as doctor_user_id, p.user_id as patient_user_id
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1 AND a.type = 'video' AND a.status IN ('confirmed', 'in_progress')
    `;
    const params: any[] = [appointment_id];
    
    if (userRole === 'doctor') {
      sql += ` AND d.user_id = $2`;
      params.push(userId);
    } else if (userRole === 'patient') {
      sql += ` AND p.user_id = $2`;
      params.push(userId);
    }
    
    const appointmentResult = await query(sql, params);
    
    if (appointmentResult.rows.length === 0) {
      throw new AppError('Appointment not found or not eligible for video call', 404);
    }
    
    const appointment = appointmentResult.rows[0];
    
    // Generate room ID if not exists
    let roomId = appointment.video_call_room_id;
    if (!roomId) {
      roomId = `room-${appointment_id}-${generateRandomString(8)}`;
      
      await query(
        'UPDATE appointments SET video_call_room_id = $1, video_call_started_at = CURRENT_TIMESTAMP, status = \'in_progress\', updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [roomId, appointment_id]
      );
    }
    
    res.json({
      success: true,
      data: {
        room_id: roomId,
        appointment_id,
        is_initiator: userRole === 'doctor'
      }
    });
  })
);

// Get room token
router.get('/room/:roomId/token',
  authenticate,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const userId = (req as any).user?.id;
    
    // Verify user is part of this appointment
    const appointmentResult = await query(`
      SELECT a.* 
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      WHERE a.video_call_room_id = $1 AND (d.user_id = $2 OR p.user_id = $2)
    `, [roomId, userId]);
    
    if (appointmentResult.rows.length === 0) {
      throw new AppError('Room not found or access denied', 404);
    }
    
    // Generate token (in production, use a proper token service like Twilio)
    const token = generateRandomString(32);
    
    res.json({
      success: true,
      data: {
        token,
        room_id: roomId,
        ice_servers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });
  })
);

// End video call
router.post('/end-call',
  authenticate,
  authorize('doctor', 'patient'),
  asyncHandler(async (req, res) => {
    const { appointment_id } = req.body;
    const userId = (req as any).user?.id;
    
    // Verify user is part of this appointment
    const appointmentResult = await query(`
      SELECT a.* 
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN patients p ON a.patient_id = p.id
      WHERE a.id = $1 AND (d.user_id = $2 OR p.user_id = $2)
    `, [appointment_id, userId]);
    
    if (appointmentResult.rows.length === 0) {
      throw new AppError('Appointment not found', 404);
    }
    
    await query(
      `UPDATE appointments 
       SET video_call_ended_at = CURRENT_TIMESTAMP, 
           status = 'completed',
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [appointment_id]
    );
    
    res.json({
      success: true,
      message: 'Video call ended'
    });
  })
);

export default router;
