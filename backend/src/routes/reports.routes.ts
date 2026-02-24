import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import PDFService from '../services/pdf.service';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Auto-create reports table
const ensureTableExists = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL,
        doctor_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        diagnosis TEXT,
        chief_complaint TEXT,
        examination_notes TEXT,
        prescriptions JSONB DEFAULT '[]',
        follow_up_date DATE,
        content JSONB NOT NULL,
        pdf_path VARCHAR(500),
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await query(`CREATE INDEX IF NOT EXISTS idx_reports_patient ON reports(patient_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reports_doctor ON reports(doctor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(created_at DESC)`);
    
    console.log('✅ Reports table ready');
  } catch (error: any) {
    console.error('❌ Error creating reports table:', error.message);
  }
};

ensureTableExists();

// Create new report
router.post('/',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      patient_id,
      type,
      title,
      diagnosis,
      chief_complaint,
      examination_notes,
      prescriptions,
      follow_up_date,
      additional_notes
    } = req.body;
    
    const userId = (req as any).user?.id;
    
    // Validate required fields
    if (!patient_id || !type || !title) {
      throw new AppError('Patient ID, type, and title are required', 400);
    }
    
    // Get doctor ID
    const doctorResult = await query('SELECT id, first_name, last_name FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    const doctorName = `Dr. ${doctorResult.rows[0].first_name} ${doctorResult.rows[0].last_name}`;
    
    // Get patient info
    let patientInfo: any = { id: patient_id, name: 'Unknown', age: null, gender: null };
    
    if (!patient_id.startsWith('demo-')) {
      try {
        const patientResult = await query(
          `SELECT p.id, u.first_name, u.last_name, p.date_of_birth, p.gender 
           FROM patients p 
           JOIN users u ON p.user_id = u.id 
           WHERE p.id = $1`,
          [patient_id]
        );
        if (patientResult.rows.length > 0) {
          const p = patientResult.rows[0];
          patientInfo = {
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            age: p.date_of_birth ? Math.floor((new Date().getTime() - new Date(p.date_of_birth).getTime()) / 31557600000) : null,
            gender: p.gender
          };
        }
      } catch (error) {
        console.log('⚠️ Could not fetch patient info, using defaults');
      }
    } else {
      // Demo patient info
      const demoPatients: any = {
        'demo-patient-1': { name: 'John Doe', age: 45, gender: 'Male' },
        'demo-patient-2': { name: 'Jane Smith', age: 32, gender: 'Female' },
        'demo-patient-3': { name: 'Michael Brown', age: 28, gender: 'Male' },
        'demo-patient-4': { name: 'Sarah Wilson', age: 56, gender: 'Female' },
        'demo-patient-5': { name: 'David Lee', age: 67, gender: 'Male' },
        'demo-patient-6': { name: 'Emily Johnson', age: 24, gender: 'Female' },
        'demo-patient-7': { name: 'Robert Taylor', age: 41, gender: 'Male' },
        'demo-patient-8': { name: 'Lisa Anderson', age: 35, gender: 'Female' }
      };
      patientInfo = demoPatients[patient_id] || patientInfo;
      patientInfo.id = patient_id;
    }
    
    // Prepare report content
    const reportContent = {
      patient_id,
      patient_name: patientInfo.name,
      patient_age: patientInfo.age,
      patient_gender: patientInfo.gender,
      doctor_name: doctorName,
      doctor_title: 'MBBS, MD (Internal Medicine)',
      doctor_registration: 'MCI-12345',
      type,
      title,
      diagnosis: diagnosis || '',
      chief_complaint: chief_complaint || '',
      examination_notes: examination_notes || '',
      prescriptions: prescriptions || [],
      follow_up_date: follow_up_date || '',
      additional_notes: additional_notes || '',
      created_at: new Date().toISOString()
    };
    
    // Save report to database
    console.log('Creating report for patient:', patient_id, 'Type:', type);
    
    try {
      const result = await query(
        `INSERT INTO reports (patient_id, doctor_id, type, title, diagnosis, chief_complaint, 
          examination_notes, prescriptions, follow_up_date, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [patient_id, doctorId, type, title, diagnosis || '', chief_complaint || '', 
         examination_notes || '', JSON.stringify(prescriptions || []), follow_up_date || null, JSON.stringify(reportContent)]
      );
      
      console.log('✅ Report saved to database:', result.rows[0].id);
      var savedReport = result.rows[0];
    } catch (dbError: any) {
      console.error('❌ Database error saving report:', dbError.message);
      throw new AppError('Failed to save report: ' + dbError.message, 500);
    }
    
    // Generate PDF
    try {
      console.log('📝 Generating PDF for report:', savedReport.id);
      const pdfBuffer = await PDFService.generateAndSavePDF({
        id: savedReport.id,
        ...reportContent
      });
      
      // Save PDF file
      const pdfPath = path.join(reportsDir, `${savedReport.id}.pdf`);
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log('✅ PDF saved to:', pdfPath);
      
      // Update report with PDF path
      await query('UPDATE reports SET pdf_path = $1 WHERE id = $2', [pdfPath, savedReport.id]);
      
      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: {
          ...savedReport,
          pdf_generated: true
        }
      });
    } catch (pdfError: any) {
      console.error('❌ PDF generation error:', pdfError.message);
      // Return success even if PDF generation fails
      res.status(201).json({
        success: true,
        message: 'Report saved but PDF generation failed',
        data: savedReport,
        pdf_error: pdfError.message
      });
    }
  })
);

// Get all reports for a patient
router.get('/patient/:patient_id',
  authenticate,
  authorize('doctor', 'patient'),
  asyncHandler(async (req: Request, res: Response) => {
    const { patient_id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    // For demo patients, return dummy reports
    if (patient_id.startsWith('demo-')) {
      const dummyReports = getDummyReports(patient_id);
      return res.json({
        success: true,
        data: dummyReports
      });
    }
    
    // Check access permissions
    if (userRole === 'patient') {
      const patientCheck = await query('SELECT id FROM patients WHERE user_id = $1 AND id = $2', [userId, patient_id]);
      if (patientCheck.rows.length === 0) {
        throw new AppError('Access denied', 403);
      }
    }
    
    const result = await query(
      `SELECT r.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM reports r
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE r.patient_id = $1
       ORDER BY r.created_at DESC`,
      [patient_id]
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  })
);

// Get single report
router.get('/:id',
  authenticate,
  authorize('doctor', 'patient'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await query(
      `SELECT r.*, u.first_name as doctor_first_name, u.last_name as doctor_last_name
       FROM reports r
       JOIN doctors d ON r.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Report not found', 404);
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

// Download report PDF
router.get('/:id/download',
  authenticate,
  authorize('doctor', 'patient'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Handle dummy reports
    if (id.startsWith('demo-report-')) {
      console.log('📄 Generating PDF for dummy report:', id);
      
      // Find the dummy report
      let dummyReport = null;
      for (const patientId in getDummyReportsData()) {
        const reports = getDummyReportsData()[patientId];
        const found = reports.find((r: any) => r.id === id);
        if (found) {
          dummyReport = found;
          break;
        }
      }
      
      if (!dummyReport) {
        throw new AppError('Dummy report not found', 404);
      }
      
      // Generate PDF for dummy report
      const pdfData = {
        id: dummyReport.id,
        patient_id: dummyReport.patient_id,
        patient_name: dummyReport.patient_name || 'Demo Patient',
        patient_age: dummyReport.patient_age || 30,
        patient_gender: dummyReport.patient_gender || 'Unknown',
        doctor_name: `Dr. ${dummyReport.doctor_first_name || 'Sajal'} ${dummyReport.doctor_last_name || 'Saini'}`,
        doctor_title: 'MBBS, MD (Internal Medicine)',
        doctor_registration: 'MCI-12345',
        type: dummyReport.type,
        title: dummyReport.title,
        diagnosis: dummyReport.diagnosis || 'No diagnosis',
        chief_complaint: dummyReport.chief_complaint || '',
        examination_notes: dummyReport.examination_notes || '',
        prescriptions: dummyReport.prescriptions || [],
        follow_up_date: dummyReport.follow_up_date || '',
        additional_notes: '',
        created_at: dummyReport.created_at
      };
      
      const pdfBuffer = await PDFService.generateAndSavePDF(pdfData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${dummyReport.type}-report-${id}.pdf"`);
      res.send(pdfBuffer);
      return;
    }
    
    const result = await query('SELECT * FROM reports WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      throw new AppError('Report not found', 404);
    }
    
    const report = result.rows[0];
    
    // Check if PDF file exists
    if (report.pdf_path && fs.existsSync(report.pdf_path)) {
      // Update download count
      await query('UPDATE reports SET download_count = download_count + 1 WHERE id = $1', [id]);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.pdf"`);
      fs.createReadStream(report.pdf_path).pipe(res);
    } else {
      // Generate PDF on-the-fly
      try {
        let content = report.content;
        
        // Parse content if it's a string
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch (e) {
            console.error('Failed to parse report content:', e);
            content = {};
          }
        }
        
        // Ensure content has required fields
        const pdfData = {
          id: report.id,
          patient_id: report.patient_id,
          patient_name: content.patient_name || 'Unknown Patient',
          patient_age: content.patient_age || null,
          patient_gender: content.patient_gender || null,
          doctor_name: content.doctor_name || 'Dr. Sajal Saini',
          doctor_title: content.doctor_title || 'MBBS, MD (Internal Medicine)',
          doctor_registration: content.doctor_registration || 'MCI-12345',
          type: report.type,
          title: report.title,
          diagnosis: report.diagnosis || content.diagnosis || 'No diagnosis provided',
          chief_complaint: report.chief_complaint || content.chief_complaint || '',
          examination_notes: report.examination_notes || content.examination_notes || '',
          prescriptions: report.prescriptions || content.prescriptions || [],
          follow_up_date: report.follow_up_date || content.follow_up_date || '',
          additional_notes: content.additional_notes || '',
          created_at: report.created_at
        };
        
        console.log('Generating PDF for report:', report.id, 'Type:', report.type);
        const pdfBuffer = await PDFService.generateAndSavePDF(pdfData);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${id}.pdf"`);
        res.send(pdfBuffer);
      } catch (error: any) {
        console.error('PDF Generation Error:', error);
        throw new AppError('Failed to generate PDF: ' + error.message, 500);
      }
    }
  })
);

// Get report statistics for doctor
router.get('/stats/overview',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    
    const stats = await query(
      `SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month,
        COUNT(*) FILTER (WHERE type = 'prescription') as prescriptions,
        COUNT(*) FILTER (WHERE type = 'medical') as medical_reports,
        COUNT(*) FILTER (WHERE type = 'discharge') as discharge_summaries,
        COUNT(*) FILTER (WHERE type = 'lab') as lab_reports,
        SUM(download_count) as total_downloads
       FROM reports 
       WHERE doctor_id = $1`,
      [doctorId]
    );
    
    res.json({
      success: true,
      data: stats.rows[0]
    });
  })
);

// Delete report (doctor only)
router.delete('/:id',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    
    // Check ownership
    const reportCheck = await query('SELECT pdf_path FROM reports WHERE id = $1 AND doctor_id = $2', [id, doctorId]);
    if (reportCheck.rows.length === 0) {
      throw new AppError('Report not found or access denied', 404);
    }
    
    // Delete PDF file if exists
    const pdfPath = reportCheck.rows[0].pdf_path;
    if (pdfPath && fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
    
    // Delete from database
    await query('DELETE FROM reports WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  })
);

// Demo reports data
const demoReportsData: any = {
  'demo-patient-1': [
    {
      id: 'demo-report-1',
      patient_id: 'demo-patient-1',
      type: 'prescription',
      title: 'Fever and Cold Treatment',
      diagnosis: 'Viral Fever',
      prescriptions: [
        { name: 'Paracetamol', dosage: '500mg', frequency: '3x daily', duration: '5 days', instructions: '' }
      ],
      created_at: '2026-02-21T10:30:00Z',
      doctor_first_name: 'Sajal',
      doctor_last_name: 'Saini'
    }
  ],
  'demo-patient-2': [
    {
      id: 'demo-report-3',
      patient_id: 'demo-patient-2',
      type: 'prescription',
      title: 'Diabetes Management',
      diagnosis: 'Type 2 Diabetes',
      prescriptions: [
        { name: 'Metformin', dosage: '500mg', frequency: '2x daily', duration: '30 days', instructions: '' }
      ],
      created_at: '2026-02-18T09:15:00Z',
      doctor_first_name: 'Sajal',
      doctor_last_name: 'Saini'
    }
  ]
};

// END OF DEMO REPORTS DATA


// Helper function to get dummy reports for a specific patient
function getDummyReports(patientId: string): any[] {
  return demoReportsData[patientId] || [];
}

// Helper function to get all demo reports data
function getDummyReportsData(): any {
  return demoReportsData;
}

// Test PDF generation endpoint
router.get('/test/pdf',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      console.log('🧪 Testing PDF generation...');
      
      const testData = {
        id: 'test-report-123',
        patient_id: 'test-patient',
        patient_name: 'Test Patient',
        patient_age: 30,
        patient_gender: 'Male',
        doctor_name: 'Dr. Test Doctor',
        doctor_title: 'MBBS, MD',
        doctor_registration: 'MCI-TEST-123',
        type: 'prescription' as const,
        title: 'Test Prescription',
        diagnosis: 'Test Diagnosis',
        chief_complaint: 'Test complaint',
        examination_notes: 'Test examination',
        prescriptions: [
          { name: 'Test Medicine', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', instructions: 'After food' }
        ],
        follow_up_date: '',
        additional_notes: 'Test notes',
        created_at: new Date().toISOString()
      };
      
      const pdfBuffer = await PDFService.generateAndSavePDF(testData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="test-report.pdf"');
      res.send(pdfBuffer);
      
      console.log('✅ Test PDF generated successfully');
    } catch (error: any) {
      console.error('❌ Test PDF generation failed:', error.message);
      res.status(500).json({
        success: false,
        message: 'PDF generation test failed',
        error: error.message
      });
    }
  })
);

// Nurse Reports Routes
import {
  getPerformanceMetrics,
  recordPerformanceMetric,
  getTeamPerformance,
  submitDailyReport,
  getDailyReports,
  reportIncident,
  getIncidents,
  updateIncidentStatus,
  getNurseDashboardSummary
} from '../controllers/reports.controller';

// Nurse Performance metrics
router.get('/nurse/performance', authenticate, authorize('nurse'), getPerformanceMetrics);
router.post('/nurse/performance', authenticate, authorize('nurse'), recordPerformanceMetric);
router.get('/nurse/team-performance', authenticate, authorize('admin', 'super_admin'), getTeamPerformance);

// Daily reports
router.post('/nurse/daily', authenticate, authorize('nurse'), submitDailyReport);
router.get('/nurse/daily', authenticate, authorize('nurse', 'admin'), getDailyReports);

// Incidents
router.post('/nurse/incidents', authenticate, authorize('nurse', 'doctor', 'admin'), reportIncident);
router.get('/nurse/incidents', authenticate, authorize('nurse', 'doctor', 'admin'), getIncidents);
router.put('/nurse/incidents/:id', authenticate, authorize('admin', 'super_admin'), updateIncidentStatus);

// Nurse Dashboard summary
router.get('/nurse/dashboard-summary', authenticate, authorize('nurse'), getNurseDashboardSummary);

export default router;
