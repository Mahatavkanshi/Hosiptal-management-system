import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Create care plan
export const createCarePlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id, plan_type, diagnosis, goals, interventions, schedule, priority } = req.body;
    const nurseId = (req as any).user?.id;

    const result = await query(
      `INSERT INTO care_plans (patient_id, plan_type, diagnosis, goals, interventions, schedule, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [patient_id, plan_type, diagnosis, goals, interventions, JSON.stringify(schedule), priority, nurseId]
    );

    res.status(201).json({
      success: true,
      message: 'Care plan created successfully',
      data: result.rows[0]
    });
  }
);

// Get care plans for a patient
export const getCarePlans = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id } = req.params;
    const { status } = req.query;

    let whereClause = 'WHERE patient_id = $1';
    const params: any[] = [patient_id];

    if (status) {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    const plans = await query(
      `SELECT cp.*, u.first_name as creator_first_name, u.last_name as creator_last_name
       FROM care_plans cp
       LEFT JOIN users u ON cp.created_by = u.id
       ${whereClause}
       ORDER BY cp.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: plans.rows
    });
  }
);

// Update care plan
export const updateCarePlan = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { plan_type, diagnosis, goals, interventions, schedule, priority, status } = req.body;

    const result = await query(
      `UPDATE care_plans 
       SET plan_type = $1, diagnosis = $2, goals = $3, interventions = $4, 
           schedule = $5, priority = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [plan_type, diagnosis, goals, interventions, JSON.stringify(schedule), priority, status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Care plan not found', 404);
    }

    res.json({
      success: true,
      message: 'Care plan updated successfully',
      data: result.rows[0]
    });
  }
);

// Add nursing note
export const createNursingNote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id, note_type, content, attachments, is_critical } = req.body;
    const nurseId = (req as any).user?.id;

    const result = await query(
      `INSERT INTO nursing_notes (patient_id, nurse_id, note_type, content, attachments, is_critical)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patient_id, nurseId, note_type, content, JSON.stringify(attachments), is_critical]
    );

    res.status(201).json({
      success: true,
      message: 'Nursing note added successfully',
      data: result.rows[0]
    });
  }
);

// Get nursing notes for a patient
export const getNursingNotes = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id } = req.params;
    const { note_type } = req.query;

    let whereClause = 'WHERE patient_id = $1';
    const params: any[] = [patient_id];

    if (note_type) {
      whereClause += ' AND note_type = $2';
      params.push(note_type);
    }

    const notes = await query(
      `SELECT nn.*, u.first_name, u.last_name
       FROM nursing_notes nn
       JOIN users u ON nn.nurse_id = u.id
       ${whereClause}
       ORDER BY nn.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: notes.rows
    });
  }
);

// Create wound assessment
export const createWoundAssessment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      patient_id,
      wound_location,
      wound_stage,
      length_cm,
      width_cm,
      depth_cm,
      appearance,
      drainage,
      photos,
      pain_score,
      treatment_applied,
      next_assessment_date
    } = req.body;
    const nurseId = (req as any).user?.id;

    const result = await query(
      `INSERT INTO wound_assessments (patient_id, nurse_id, wound_location, wound_stage, length_cm, width_cm, depth_cm, appearance, drainage, photos, pain_score, treatment_applied, next_assessment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [patient_id, nurseId, wound_location, wound_stage, length_cm, width_cm, depth_cm, 
       appearance, drainage, JSON.stringify(photos), pain_score, treatment_applied, next_assessment_date]
    );

    res.status(201).json({
      success: true,
      message: 'Wound assessment recorded successfully',
      data: result.rows[0]
    });
  }
);

// Get wound assessments for a patient
export const getWoundAssessments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id } = req.params;

    const assessments = await query(
      `SELECT wa.*, u.first_name, u.last_name
       FROM wound_assessments wa
       JOIN users u ON wa.nurse_id = u.id
       WHERE wa.patient_id = $1
       ORDER BY wa.created_at DESC`,
      [patient_id]
    );

    res.json({
      success: true,
      data: assessments.rows
    });
  }
);

// Create GCS assessment
export const createGCSAssessment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id, eye_response, verbal_response, motor_response, notes } = req.body;
    const nurseId = (req as any).user?.id;

    // Calculate total score
    const total_score = eye_response + verbal_response + motor_response;

    const result = await query(
      `INSERT INTO gcs_assessments (patient_id, nurse_id, eye_response, verbal_response, motor_response, total_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, nurseId, eye_response, verbal_response, motor_response, total_score, notes]
    );

    res.status(201).json({
      success: true,
      message: 'GCS assessment recorded successfully',
      data: result.rows[0]
    });
  }
);

// Get GCS assessments for a patient
export const getGCSAssessments = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id } = req.params;

    const assessments = await query(
      `SELECT gcs.*, u.first_name, u.last_name
       FROM gcs_assessments gcs
       JOIN users u ON gcs.nurse_id = u.id
       WHERE gcs.patient_id = $1
       ORDER BY gcs.assessment_time DESC`,
      [patient_id]
    );

    res.json({
      success: true,
      data: assessments.rows
    });
  }
);

// Get latest GCS for a patient
export const getLatestGCS = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { patient_id } = req.params;

    const assessment = await query(
      `SELECT gcs.*, u.first_name, u.last_name
       FROM gcs_assessments gcs
       JOIN users u ON gcs.nurse_id = u.id
       WHERE gcs.patient_id = $1
       ORDER BY gcs.assessment_time DESC
       LIMIT 1`,
      [patient_id]
    );

    if (assessment.rows.length === 0) {
      res.json({
        success: true,
        data: null
      });
      return;
    }

    res.json({
      success: true,
      data: assessment.rows[0]
    });
  }
);
