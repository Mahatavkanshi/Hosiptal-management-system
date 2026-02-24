import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Get nurse's shift schedule
export const getMySchedule = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const nurseId = (req as any).user?.id;
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params: any[] = [nurseId];

    if (start_date && end_date) {
      dateFilter = 'AND shift_date BETWEEN $2 AND $3';
      params.push(start_date, end_date);
    }

    const shifts = await query(
      `SELECT * FROM shift_schedules 
       WHERE nurse_id = $1 ${dateFilter}
       ORDER BY shift_date DESC, start_time ASC`,
      params
    );

    res.json({
      success: true,
      data: shifts.rows
    });
  }
);

// Get all nurses' schedules (admin only)
export const getAllSchedules = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { date, department } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (date) {
      whereClause += `WHERE ss.shift_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (department) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ` ss.department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    const schedules = await query(
      `SELECT ss.*, u.first_name, u.last_name
       FROM shift_schedules ss
       JOIN users u ON ss.nurse_id = u.id
       ${whereClause}
       ORDER BY ss.shift_date DESC, ss.start_time ASC`,
      params
    );

    res.json({
      success: true,
      data: schedules.rows
    });
  }
);

// Create shift (admin only)
export const createShift = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { nurse_id, shift_date, shift_type, start_time, end_time, department, floor_number } = req.body;

    const result = await query(
      `INSERT INTO shift_schedules (nurse_id, shift_date, shift_type, start_time, end_time, department, floor_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nurse_id, shift_date, shift_type, start_time, end_time, department, floor_number]
    );

    res.status(201).json({
      success: true,
      message: 'Shift scheduled successfully',
      data: result.rows[0]
    });
  }
);

// Create shift handover
export const createHandover = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id, to_nurse_id, handover_notes, critical_flags, vital_changes, medication_updates } = req.body;
    const from_nurse_id = (req as any).user?.id;

    const result = await query(
      `INSERT INTO shift_handovers (patient_id, from_nurse_id, to_nurse_id, handover_notes, critical_flags, vital_changes, medication_updates)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, from_nurse_id, to_nurse_id, handover_notes, 
       JSON.stringify(critical_flags), JSON.stringify(vital_changes), medication_updates]
    );

    res.status(201).json({
      success: true,
      message: 'Handover notes created successfully',
      data: result.rows[0]
    });
  }
);

// Get handover notes for a patient
export const getHandovers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id } = req.params;

    const handovers = await query(
      `SELECT sh.*, 
        from_nurse.first_name as from_nurse_first_name, from_nurse.last_name as from_nurse_last_name,
        to_nurse.first_name as to_nurse_first_name, to_nurse.last_name as to_nurse_last_name,
        p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM shift_handovers sh
       JOIN users from_nurse ON sh.from_nurse_id = from_nurse.id
       JOIN users to_nurse ON sh.to_nurse_id = to_nurse.id
       JOIN patients p ON sh.patient_id = p.id
       WHERE sh.patient_id = $1
       ORDER BY sh.created_at DESC`,
      [patient_id]
    );

    res.json({
      success: true,
      data: handovers.rows
    });
  }
);

// Acknowledge handover
export const acknowledgeHandover = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const nurseId = (req as any).user?.id;

    const result = await query(
      `UPDATE shift_handovers 
       SET acknowledged = true, acknowledged_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND to_nurse_id = $2
       RETURNING *`,
      [id, nurseId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Handover not found or not authorized', 404);
    }

    res.json({
      success: true,
      message: 'Handover acknowledged',
      data: result.rows[0]
    });
  }
);

// Request shift swap
export const requestShiftSwap = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { original_shift_id, requested_nurse_id, proposed_shift_date, reason } = req.body;
    const requestorId = (req as any).user?.id;

    const result = await query(
      `INSERT INTO shift_swaps (requestor_id, requested_nurse_id, original_shift_id, proposed_shift_date, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [requestorId, requested_nurse_id, original_shift_id, proposed_shift_date, reason]
    );

    res.status(201).json({
      success: true,
      message: 'Shift swap requested successfully',
      data: result.rows[0]
    });
  }
);

// Get shift swap requests
export const getShiftSwaps = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const nurseId = (req as any).user?.id;
    const { status } = req.query;

    // Get requests made by me and requests for me
    const swaps = await query(
      `SELECT ss.*, 
        requestor.first_name as requestor_first_name, requestor.last_name as requestor_last_name,
        requested.first_name as requested_first_name, requested.last_name as requested_last_name,
        orig_shift.shift_date as original_shift_date, orig_shift.shift_type as original_shift_type
       FROM shift_swaps ss
       JOIN users requestor ON ss.requestor_id = requestor.id
       JOIN users requested ON ss.requested_nurse_id = requested.id
       JOIN shift_schedules orig_shift ON ss.original_shift_id = orig_shift.id
       WHERE (ss.requestor_id = $1 OR ss.requested_nurse_id = $1)
       ${status ? 'AND ss.status = $2' : ''}
       ORDER BY ss.created_at DESC`,
      status ? [nurseId, status] : [nurseId]
    );

    res.json({
      success: true,
      data: swaps.rows
    });
  }
);

// Approve/Reject shift swap (admin only)
export const updateShiftSwap = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const adminId = (req as any).user?.id;

    const result = await query(
      `UPDATE shift_swaps 
       SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, adminId, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Shift swap request not found', 404);
    }

    // If approved, update the shift schedule
    if (status === 'approved') {
      const swap = result.rows[0];
      await query(
        `UPDATE shift_schedules 
         SET nurse_id = $1
         WHERE id = $2`,
        [swap.requested_nurse_id, swap.original_shift_id]
      );
    }

    res.json({
      success: true,
      message: `Shift swap ${status}`,
      data: result.rows[0]
    });
  }
);

// Record overtime
export const recordOvertime = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { overtime_date, overtime_hours, reason } = req.body;
    const nurseId = (req as any).user?.id;

    const result = await query(
      `INSERT INTO overtime_records (nurse_id, overtime_date, overtime_hours, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nurseId, overtime_date, overtime_hours, reason]
    );

    res.status(201).json({
      success: true,
      message: 'Overtime recorded successfully',
      data: result.rows[0]
    });
  }
);

// Get overtime records
export const getOvertime = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const nurseId = (req as any).user?.id;
    const { month, year } = req.query;

    let dateFilter = '';
    const params: any[] = [nurseId];

    if (month && year) {
      dateFilter = 'AND EXTRACT(MONTH FROM overtime_date) = $2 AND EXTRACT(YEAR FROM overtime_date) = $3';
      params.push(month, year);
    }

    const overtime = await query(
      `SELECT * FROM overtime_records 
       WHERE nurse_id = $1 ${dateFilter}
       ORDER BY overtime_date DESC`,
      params
    );

    // Calculate total overtime
    const totalResult = await query(
      `SELECT COALESCE(SUM(overtime_hours), 0) as total_hours 
       FROM overtime_records 
       WHERE nurse_id = $1 AND approved = true ${dateFilter}`,
      params
    );

    res.json({
      success: true,
      data: {
        records: overtime.rows,
        totalApprovedHours: parseFloat(totalResult.rows[0].total_hours)
      }
    });
  }
);

// Approve overtime (admin only)
export const approveOvertime = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const adminId = (req as any).user?.id;

    const result = await query(
      `UPDATE overtime_records 
       SET approved = true, approved_by = $1
       WHERE id = $2
       RETURNING *`,
      [adminId, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Overtime record not found', 404);
    }

    res.json({
      success: true,
      message: 'Overtime approved',
      data: result.rows[0]
    });
  }
);
