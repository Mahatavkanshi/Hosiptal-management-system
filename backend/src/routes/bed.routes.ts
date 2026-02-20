import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { io } from '../server';

const router = Router();

// Get all beds (admin, receptionist, nurse)
router.get('/',
  authenticate,
  authorize('admin', 'receptionist', 'nurse', 'doctor'),
  asyncHandler(async (req, res) => {
    const { status, ward_type, floor_number, page = 1, limit = 50 } = req.query;
    
    let sql = `
      SELECT b.*,
             p.date_of_birth, p.blood_group,
             u.first_name as patient_first_name, u.last_name as patient_last_name
      FROM beds b
      LEFT JOIN patients p ON b.patient_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (ward_type) {
      sql += ` AND b.ward_type = $${paramIndex}`;
      params.push(ward_type);
      paramIndex++;
    }
    
    if (floor_number) {
      sql += ` AND b.floor_number = $${paramIndex}`;
      params.push(floor_number);
      paramIndex++;
    }
    
    sql += ` ORDER BY b.floor_number, b.room_number, b.bed_number`;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Get bed statistics
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'available') as available,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
        COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
        COUNT(*) FILTER (WHERE ward_type = 'icu') as icu_total,
        COUNT(*) FILTER (WHERE ward_type = 'icu' AND status = 'occupied') as icu_occupied
      FROM beds
    `);
    
    res.json({
      success: true,
      data: {
        beds: result.rows,
        statistics: statsResult.rows[0]
      }
    });
  })
);

// Get bed availability summary
router.get('/availability',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT 
        ward_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'available') as available,
        COUNT(*) FILTER (WHERE status = 'occupied') as occupied
      FROM beds
      GROUP BY ward_type
      ORDER BY ward_type
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Allocate bed to patient (admin, receptionist, nurse, doctor)
router.post('/allocate',
  authenticate,
  authorize('admin', 'receptionist', 'nurse', 'doctor'),
  [
    body('bed_id').notEmpty().withMessage('Valid bed ID is required'),
    body('patient_id').notEmpty().withMessage('Valid patient ID is required')
  ],
  asyncHandler(async (req, res) => {
    const { bed_id, patient_id, notes } = req.body;
    
    // Check if this is demo data
    const isDemoBed = bed_id.startsWith('demo-');
    const isDemoPatient = patient_id.startsWith('demo-');
    
    if (isDemoBed || isDemoPatient) {
      // Handle demo data allocation
      const demoBed = {
        id: bed_id,
        ward_type: 'General',
        bed_number: bed_id.replace('demo-bed-', 'Demo-'),
        room_number: '101',
        floor_number: 1
      };
      
      // Emit real-time update for demo
      io.emit('bed-updated', { bed_id, status: 'occupied', patient_id });
      
      res.json({
        success: true,
        message: 'Bed allocated successfully (Demo Mode)',
        data: demoBed
      });
      return;
    }
    
    // Check if bed is available
    const bedResult = await query(
      'SELECT * FROM beds WHERE id = $1 AND status = \'available\'',
      [bed_id]
    );
    
    if (bedResult.rows.length === 0) {
      throw new AppError('Bed not available', 400);
    }
    
    // Check if patient exists
    const patientResult = await query(
      'SELECT id FROM patients WHERE id = $1',
      [patient_id]
    );
    
    if (patientResult.rows.length === 0) {
      throw new AppError('Patient not found', 404);
    }
    
    // Check if patient already has a bed
    const existingBed = await query(
      'SELECT id FROM beds WHERE patient_id = $1 AND status = \'occupied\'',
      [patient_id]
    );
    
    if (existingBed.rows.length > 0) {
      throw new AppError('Patient already has an allocated bed', 400);
    }
    
    // Allocate bed
    await query(
      `UPDATE beds 
       SET status = 'occupied',
           patient_id = $1,
           assigned_date = CURRENT_DATE,
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [patient_id, notes, bed_id]
    );
    
    const bed = bedResult.rows[0];
    
    // Emit real-time update
    io.emit('bed-updated', { bed_id, status: 'occupied', patient_id });
    
    res.json({
      success: true,
      message: 'Bed allocated successfully',
      data: {
        bed_id,
        ward_type: bed.ward_type,
        bed_number: bed.bed_number,
        room_number: bed.room_number,
        floor_number: bed.floor_number
      }
    });
  })
);

// Discharge patient from bed
router.post('/:id/discharge',
  authenticate,
  authorize('admin', 'receptionist', 'nurse', 'doctor'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { discharge_notes } = req.body;
    
    // Check if this is demo data
    if (id.startsWith('demo-')) {
      io.emit('bed-updated', { bed_id: id, status: 'cleaning' });
      
      res.json({
        success: true,
        message: 'Patient discharged successfully (Demo Mode)',
        data: {
          bed_id: id,
          days_stayed: 1,
          total_charge: 1000,
          discharge_date: new Date().toISOString().split('T')[0]
        }
      });
      return;
    }
    
    const bedResult = await query(
      'SELECT * FROM beds WHERE id = $1 AND status = \'occupied\'',
      [id]
    );
    
    if (bedResult.rows.length === 0) {
      throw new AppError('Bed not found or not occupied', 404);
    }
    
    const bed = bedResult.rows[0];
    
    // Calculate stay duration
    const assignedDate = new Date(bed.assigned_date);
    const dischargeDate = new Date();
    const daysStayed = Math.ceil((dischargeDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalCharge = daysStayed * bed.daily_charge;
    
    // Update bed
    await query(
      `UPDATE beds 
       SET status = 'cleaning',
           patient_id = NULL,
           discharge_date = CURRENT_DATE,
           notes = COALESCE($1, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [discharge_notes, id]
    );
    
    io.emit('bed-updated', { bed_id: id, status: 'cleaning' });
    
    res.json({
      success: true,
      message: 'Patient discharged successfully',
      data: {
        bed_id: id,
        days_stayed: daysStayed,
        total_charge: totalCharge,
        discharge_date: dischargeDate.toISOString().split('T')[0]
      }
    });
  })
);

// Create new bed (admin only)
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('bed_number').notEmpty().withMessage('Bed number is required'),
    body('ward_type').isIn(['general', 'semi_private', 'private', 'icu', 'ccu', 'emergency']).withMessage('Invalid ward type'),
    body('floor_number').isInt({ min: 0 }).withMessage('Valid floor number is required'),
    body('room_number').notEmpty().withMessage('Room number is required'),
    body('daily_charge').isDecimal().withMessage('Valid daily charge is required')
  ],
  asyncHandler(async (req, res) => {
    const { bed_number, ward_type, floor_number, room_number, daily_charge, amenities } = req.body;
    
    // Check if bed already exists
    const existingBed = await query(
      'SELECT id FROM beds WHERE floor_number = $1 AND room_number = $2 AND bed_number = $3',
      [floor_number, room_number, bed_number]
    );
    
    if (existingBed.rows.length > 0) {
      throw new AppError('Bed already exists in this room', 409);
    }
    
    const result = await query(
      `INSERT INTO beds (bed_number, ward_type, floor_number, room_number, daily_charge, amenities)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [bed_number, ward_type, floor_number, room_number, daily_charge, JSON.stringify(amenities || [])]
    );
    
    res.status(201).json({
      success: true,
      message: 'Bed created successfully',
      data: result.rows[0]
    });
  })
);

export default router;
