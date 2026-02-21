import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Get API key from environment ONLY - never hardcode secrets
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn('⚠️  GROQ_API_KEY not set in environment variables. AI features will use demo mode.');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, DOC files allowed.'));
    }
  }
});

// Auto-create table if not exists
const ensureTableExists = async () => {
  try {
    // Create table without foreign key constraints first
    await query(`
      CREATE TABLE IF NOT EXISTS ai_diagnoses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL,
        patient_id UUID,
        symptoms TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_doctor_id ON ai_diagnoses(doctor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_patient_id ON ai_diagnoses(patient_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_created_at ON ai_diagnoses(created_at DESC)`);
    
    console.log('✅ AI diagnoses table ready');
  } catch (error: any) {
    console.error('❌ Error creating ai_diagnoses table:', error.message);
    // Continue even if table creation fails - might already exist
  }
};

// Ensure table exists on startup
ensureTableExists();

// AI Diagnosis endpoint
router.post('/diagnose',
  authenticate,
  authorize('doctor'),
  upload.array('files', 5), // Allow up to 5 files
  asyncHandler(async (req: Request, res: Response) => {
    console.log('🔍 AI Diagnose endpoint called');
    
    const { symptoms, patient_id } = req.body;
    const userId = (req as any).user?.id;
    
    console.log('Request body:', { symptoms: symptoms?.substring(0, 50), patient_id });
    
    if (!symptoms) {
      throw new AppError('Symptoms are required', 400);
    }
    
    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    console.log('✅ Doctor found:', doctorId);
    
    // Get patient info (without revealing name to AI for privacy)
    // Skip if patient_id starts with 'demo-' as it's a demo patient
    let patientInfo = '';
    if (patient_id && !patient_id.startsWith('demo-')) {
      try {
        const patientResult = await query(
          'SELECT p.id, p.date_of_birth, p.gender, p.blood_group FROM patients p WHERE p.id = $1',
          [patient_id]
        );
        if (patientResult.rows.length > 0) {
          const patient = patientResult.rows[0];
          patientInfo = `Patient Age: ${Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / 31557600000)} years, Gender: ${patient.gender}, Blood Group: ${patient.blood_group}`;
        }
      } catch (patientError) {
        console.log('⚠️ Could not fetch patient info, continuing without it');
      }
    }
    
    // Process uploaded files
    const files = req.files as Express.Multer.File[];
    let fileContent = '';
    
    if (files && files.length > 0) {
      fileContent = `\n\nAttached Files: ${files.length} file(s) uploaded for analysis.`;
    }
    
    // DEMO MODE: If API key is not set, return mock response
    const isDemoMode = !GROQ_API_KEY;
    
    if (isDemoMode) {
      console.log('⚠️  Running in DEMO MODE - Using mock AI response');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const demoResponse = `POSSIBLE CONDITIONS:
1. Viral Fever - Patient presents with fever, which commonly indicates viral infection
2. Seasonal Flu - Symptoms match influenza pattern
3. Common Cold - Mild fever with respiratory symptoms

SUGGESTED MEDICINES (Generic names only):
- Paracetamol 500mg - 3 times daily after food for fever
- Vitamin C 500mg - Once daily for immunity
- ORS solution - For hydration

RECOMMENDED TESTS:
- Complete Blood Count (CBC)
- Rapid Fever Panel

RED FLAGS (Immediate specialist referral needed if):
- Fever persists > 5 days
- Patient becomes unconscious
- Severe dehydration occurs

NOTES:
Monitor temperature every 6 hours. Maintain hydration. Light diet recommended.

DISCLAIMER: This is AI-generated assistance. Final diagnosis by a qualified doctor is required.`;

      try {
        const diagnosisResult = await query(
          `INSERT INTO ai_diagnoses (doctor_id, patient_id, symptoms, ai_response, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING *`,
          [doctorId, patient_id || null, symptoms, demoResponse]
        );
        
        res.json({
          success: true,
          data: {
            diagnosis_id: diagnosisResult.rows[0].id,
            ai_response: demoResponse,
            patient_id: patient_id,
            created_at: diagnosisResult.rows[0].created_at,
            demo_mode: true
          }
        });
      } catch (dbError) {
        console.error('DB error in demo mode:', dbError);
        res.json({
          success: true,
          data: {
            diagnosis_id: 'demo-' + Date.now(),
            ai_response: demoResponse,
            patient_id: patient_id,
            created_at: new Date().toISOString(),
            demo_mode: true
          }
        });
      }
      return;
    }
    
    // Call Groq API
    try {
      console.log('Calling Groq API with symptoms:', symptoms.substring(0, 100) + '...');
      
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an AI medical assistant helping doctors analyze symptoms and suggest possible diagnoses. 
              Provide your response in this exact format:
              
              POSSIBLE CONDITIONS:
              1. [Condition Name] - [Brief reason why]
              2. [Condition Name] - [Brief reason why]
              3. [Condition Name] - [Brief reason why]
              
              SUGGESTED MEDICINES (Generic names only):
              - [Medicine 1] - [Dosage]
              - [Medicine 2] - [Dosage]
              
              RECOMMENDED TESTS:
              - [Test 1]
              - [Test 2]
              
              RED FLAGS (Immediate specialist referral needed if):
              - [Red flag 1]
              - [Red flag 2]
              
              NOTES:
              [Any additional notes]
              
              DISCLAIMER: This is AI-generated assistance. Final diagnosis by a qualified doctor is required.`
            },
            {
              role: 'user',
              content: `Doctor needs help diagnosing a patient.
              
              ${patientInfo}
              
              SYMPTOMS: ${symptoms}
              ${fileContent}
              
              Please analyze and provide suggestions.`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      clearTimeout(timeoutId); // Clear timeout on success
      
      console.log('Groq API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error Response:', errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }
      
      const data: any = await response.json();
      console.log('Groq API Response received successfully');
      
      const aiResponse = data.choices?.[0]?.message?.content || 'No response from AI';
      
      // Save AI diagnosis to database (with error handling)
      let diagnosisId = 'temp-' + Date.now();
      try {
        const diagnosisResult = await query(
          `INSERT INTO ai_diagnoses (doctor_id, patient_id, symptoms, ai_response, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING *`,
          [doctorId, patient_id || null, symptoms, aiResponse]
        );
        diagnosisId = diagnosisResult.rows[0].id;
        console.log('AI diagnosis saved to database:', diagnosisId);
      } catch (dbError: any) {
        console.error('Database error (non-critical):', dbError.message);
        // Continue even if DB save fails - we still have the AI response
      }
      
      // Clean up uploaded files
      if (files) {
        files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        });
      }
      
      res.json({
        success: true,
        data: {
          diagnosis_id: diagnosisId,
          ai_response: aiResponse,
          patient_id: patient_id,
          created_at: new Date().toISOString()
        }
      });
      
    } catch (error: any) {
      console.error('Groq API Error:', error.message);
      console.error('Full error:', error);
      
      // Clean up uploaded files on error
      if (files) {
        files.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        });
      }
      
      // Handle specific error types
      let errorMessage = 'AI service unavailable, please proceed manually';
      let statusCode = 503;
      
      if (error.name === 'AbortError') {
        errorMessage = 'AI analysis timed out (30s). Please try with shorter symptoms or try again later.';
      } else if (error.message?.includes('fetch failed')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'AI API authentication failed. Please contact administrator.';
        statusCode = 401;
      } else if (error.message?.includes('429')) {
        errorMessage = 'AI API rate limit exceeded. Please try again in a few minutes.';
        statusCode = 429;
      } else if (error.message) {
        errorMessage = `AI Error: ${error.message}`;
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  })
);

// Get AI diagnosis history for a patient
router.get('/history/:patient_id',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { patient_id } = req.params;
      const userId = (req as any).user?.id;
      
      // Skip demo patients
      if (patient_id.startsWith('demo-')) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      // Get doctor ID
      const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
      if (doctorResult.rows.length === 0) {
        throw new AppError('Doctor not found', 404);
      }
      const doctorId = doctorResult.rows[0].id;
      
      const result = await query(
        `SELECT id, symptoms, ai_response, created_at 
         FROM ai_diagnoses 
         WHERE doctor_id = $1 AND patient_id = $2
         ORDER BY created_at DESC`,
        [doctorId, patient_id]
      );
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: any) {
      console.error('Error fetching AI history:', error.message);
      // Return empty array on error
      res.json({
        success: true,
        data: []
      });
    }
  })
);

// Get all AI diagnoses for doctor
router.get('/all-diagnoses',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    
    // Get doctor ID
    const doctorResult = await query('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (doctorResult.rows.length === 0) {
      throw new AppError('Doctor not found', 404);
    }
    const doctorId = doctorResult.rows[0].id;
    
    const result = await query(
      `SELECT ad.id, ad.symptoms, ad.ai_response, ad.created_at,
              p.id as patient_id, u.first_name, u.last_name
       FROM ai_diagnoses ad
       LEFT JOIN patients p ON ad.patient_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE ad.doctor_id = $1
       ORDER BY ad.created_at DESC
       LIMIT 20`,
      [doctorId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Test Groq API endpoint
router.get('/test',
  authenticate,
  authorize('doctor'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API test failed: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      res.json({
        success: true,
        message: 'Groq API connection successful',
        available_models: data.data?.map((m: any) => m.id) || []
      });
    } catch (error: any) {
      res.status(503).json({
        success: false,
        message: 'Groq API connection failed',
        error: error.message
      });
    }
  })
);

export default router;
