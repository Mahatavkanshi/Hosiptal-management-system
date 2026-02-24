import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// Get nurse performance metrics
export const getPerformanceMetrics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const nurseId = (req as any).user?.id;
    const { month, year } = req.query;

    let dateFilter = '';
    const params: any[] = [nurseId];

    if (month && year) {
      dateFilter = 'AND metric_date >= $2 AND metric_date < $3';
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${parseInt(month as string) + 1}-01`;
      params.push(startDate, endDate);
    }

    // Get daily metrics
    const metrics = await query(
      `SELECT * FROM nurse_performance_metrics 
       WHERE nurse_id = $1 ${dateFilter}
       ORDER BY metric_date DESC`,
      params
    );

    // Get summary statistics
    const summary = await query(
      `SELECT 
        COALESCE(SUM(patients_cared), 0) as total_patients,
        COALESCE(SUM(tasks_completed), 0) as total_tasks_completed,
        COALESCE(AVG(quality_score), 0) as avg_quality_score,
        COALESCE(AVG(response_time_avg_seconds), 0) as avg_response_time,
        COALESCE(AVG(shift_adherence_percentage), 0) as avg_shift_adherence,
        COUNT(*) as total_days
       FROM nurse_performance_metrics 
       WHERE nurse_id = $1 ${dateFilter}`,
      params
    );

    res.json({
      success: true,
      data: {
        daily_metrics: metrics.rows,
        summary: summary.rows[0]
      }
    });
  }
);

// Create/update daily performance metric
export const recordPerformanceMetric = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      metric_date,
      patients_cared,
      tasks_completed,
      tasks_pending,
      response_time_avg_seconds,
      shift_adherence_percentage,
      notes_documented,
      incidents_reported,
      quality_score
    } = req.body;
    const nurseId = (req as any).user?.id;

    // Check if metric already exists for this date
    const existing = await query(
      'SELECT id FROM nurse_performance_metrics WHERE nurse_id = $1 AND metric_date = $2',
      [nurseId, metric_date]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await query(
        `UPDATE nurse_performance_metrics 
         SET patients_cared = $1, tasks_completed = $2, tasks_pending = $3, 
             response_time_avg_seconds = $4, shift_adherence_percentage = $5,
             notes_documented = $6, incidents_reported = $7, quality_score = $8
         WHERE nurse_id = $9 AND metric_date = $10
         RETURNING *`,
        [patients_cared, tasks_completed, tasks_pending, response_time_avg_seconds,
         shift_adherence_percentage, notes_documented, incidents_reported, quality_score,
         nurseId, metric_date]
      );
    } else {
      // Create new
      result = await query(
        `INSERT INTO nurse_performance_metrics 
         (nurse_id, metric_date, patients_cared, tasks_completed, tasks_pending,
          response_time_avg_seconds, shift_adherence_percentage, notes_documented, 
          incidents_reported, quality_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [nurseId, metric_date, patients_cared, tasks_completed, tasks_pending,
         response_time_avg_seconds, shift_adherence_percentage, notes_documented,
         incidents_reported, quality_score]
      );
    }

    res.json({
      success: true,
      message: 'Performance metric recorded',
      data: result.rows[0]
    });
  }
);

// Get team performance (admin only)
export const getTeamPerformance = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { month, year } = req.query;

    let dateFilter = '';
    const params: any[] = [];

    if (month && year) {
      dateFilter = 'WHERE metric_date >= $1 AND metric_date < $2';
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${parseInt(month as string) + 1}-01`;
      params.push(startDate, endDate);
    }

    const teamMetrics = await query(
      `SELECT 
        u.id as nurse_id,
        u.first_name,
        u.last_name,
        COALESCE(SUM(npm.patients_cared), 0) as total_patients,
        COALESCE(SUM(npm.tasks_completed), 0) as total_tasks_completed,
        COALESCE(AVG(npm.quality_score), 0) as avg_quality_score,
        COALESCE(AVG(npm.response_time_avg_seconds), 0) as avg_response_time
       FROM users u
       LEFT JOIN nurse_performance_metrics npm ON u.id = npm.nurse_id ${dateFilter}
       WHERE u.role = 'nurse'
       GROUP BY u.id, u.first_name, u.last_name
       ORDER BY avg_quality_score DESC`,
      params
    );

    res.json({
      success: true,
      data: teamMetrics.rows
    });
  }
);

// Submit daily report
export const submitDailyReport = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      shift_id,
      summary,
      key_events,
      patients_handled,
      critical_incidents,
      medications_administered,
      handover_notes
    } = req.body;
    const nurseId = (req as any).user?.id;
    const reportDate = new Date().toISOString().split('T')[0];

    // Check if report already exists
    const existing = await query(
      'SELECT id FROM daily_nurse_reports WHERE nurse_id = $1 AND report_date = $2',
      [nurseId, reportDate]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await query(
        `UPDATE daily_nurse_reports 
         SET shift_id = $1, summary = $2, key_events = $3, patients_handled = $4,
             critical_incidents = $5, medications_administered = $6, 
             handover_notes = $7, handover_completed = true, submitted_at = CURRENT_TIMESTAMP
         WHERE nurse_id = $8 AND report_date = $9
         RETURNING *`,
        [shift_id, summary, JSON.stringify(key_events), patients_handled,
         critical_incidents, medications_administered, handover_notes,
         nurseId, reportDate]
      );
    } else {
      // Create new
      result = await query(
        `INSERT INTO daily_nurse_reports 
         (nurse_id, report_date, shift_id, summary, key_events, patients_handled,
          critical_incidents, medications_administered, handover_notes, 
          handover_completed, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, CURRENT_TIMESTAMP)
         RETURNING *`,
        [nurseId, reportDate, shift_id, summary, JSON.stringify(key_events), 
         patients_handled, critical_incidents, medications_administered, handover_notes]
      );
    }

    res.json({
      success: true,
      message: 'Daily report submitted successfully',
      data: result.rows[0]
    });
  }
);

// Get daily reports for a nurse
export const getDailyReports = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const nurseId = (req as any).user?.id;
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params: any[] = [nurseId];

    if (start_date && end_date) {
      dateFilter = 'AND report_date BETWEEN $2 AND $3';
      params.push(start_date, end_date);
    }

    const reports = await query(
      `SELECT dnr.*, ss.shift_type, ss.department
       FROM daily_nurse_reports dnr
       LEFT JOIN shift_schedules ss ON dnr.shift_id = ss.id
       WHERE dnr.nurse_id = $1 ${dateFilter}
       ORDER BY dnr.report_date DESC`,
      params
    );

    res.json({
      success: true,
      data: reports.rows
    });
  }
);

// Report incident
export const reportIncident = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      incident_type,
      severity,
      patient_id,
      location,
      incident_date,
      description,
      immediate_action,
      witnesses
    } = req.body;
    const reporterId = (req as any).user?.id;

    const result = await query(
      `INSERT INTO incident_reports 
       (reporter_id, incident_type, severity, patient_id, location, incident_date, 
        description, immediate_action, witnesses)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [reporterId, incident_type, severity, patient_id, location, incident_date,
       description, immediate_action, JSON.stringify(witnesses)]
    );

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully',
      data: result.rows[0]
    });
  }
);

// Get incidents
export const getIncidents = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { status, severity, patient_id } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    const conditions: string[] = [];

    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (severity) {
      conditions.push(`severity = $${paramIndex}`);
      params.push(severity);
      paramIndex++;
    }

    if (patient_id) {
      conditions.push(`patient_id = $${paramIndex}`);
      params.push(patient_id);
      paramIndex++;
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const incidents = await query(
      `SELECT ir.*, 
        reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name,
        p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM incident_reports ir
       JOIN users reporter ON ir.reporter_id = reporter.id
       LEFT JOIN patients p ON ir.patient_id = p.id
       ${whereClause}
       ORDER BY ir.created_at DESC
       LIMIT 100`,
      params
    );

    res.json({
      success: true,
      data: incidents.rows
    });
  }
);

// Update incident status
export const updateIncidentStatus = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { status, investigation_notes, corrective_actions } = req.body;
    const userId = (req as any).user?.id;

    let updateFields = 'status = $1';
    const params: any[] = [status, id];
    let paramIndex = 3;

    if (investigation_notes) {
      updateFields += `, investigation_notes = $${paramIndex}`;
      params.push(investigation_notes);
      paramIndex++;
    }

    if (corrective_actions) {
      updateFields += `, corrective_actions = $${paramIndex}`;
      params.push(corrective_actions);
      paramIndex++;
    }

    if (status === 'closed') {
      updateFields += `, closed_by = $${paramIndex}, closed_at = CURRENT_TIMESTAMP`;
      params.push(userId);
    }

    const result = await query(
      `UPDATE incident_reports SET ${updateFields} WHERE id = $2 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      throw new AppError('Incident not found', 404);
    }

    res.json({
      success: true,
      message: 'Incident updated successfully',
      data: result.rows[0]
    });
  }
);

// Get dashboard summary for nurse
export const getNurseDashboardSummary = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const nurseId = (req as any).user?.id;
    const today = new Date().toISOString().split('T')[0];

    // Today's shift
    const todayShift = await query(
      `SELECT * FROM shift_schedules 
       WHERE nurse_id = $1 AND shift_date = $2`,
      [nurseId, today]
    );

    // Pending tasks count
    const pendingTasks = await query(
      `SELECT COUNT(*) as count FROM daily_nurse_reports 
       WHERE nurse_id = $1 AND report_date = $2 AND handover_completed = false`,
      [nurseId, today]
    );

    // Recent handovers
    const recentHandovers = await query(
      `SELECT sh.*, p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM shift_handovers sh
       JOIN patients p ON sh.patient_id = p.id
       WHERE sh.to_nurse_id = $1 AND sh.acknowledged = false
       ORDER BY sh.created_at DESC
       LIMIT 5`,
      [nurseId]
    );

    // Unread messages
    const unreadMessages = await query(
      `SELECT COUNT(*) as count
       FROM chat_messages cm
       JOIN chat_rooms cr ON cm.room_id = cr.id
       WHERE $1 = ANY(cr.participants) AND NOT ($1 = ANY(cm.read_by))`,
      [nurseId]
    );

    // Today's performance
    const todayPerformance = await query(
      `SELECT * FROM nurse_performance_metrics 
       WHERE nurse_id = $1 AND metric_date = $2`,
      [nurseId, today]
    );

    res.json({
      success: true,
      data: {
        today_shift: todayShift.rows[0] || null,
        pending_tasks: parseInt(pendingTasks.rows[0].count),
        pending_handovers: recentHandovers.rows,
        unread_messages: parseInt(unreadMessages.rows[0].count),
        today_performance: todayPerformance.rows[0] || null
      }
    });
  }
);
