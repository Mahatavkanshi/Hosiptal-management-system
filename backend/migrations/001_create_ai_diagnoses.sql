-- Create AI Diagnoses Table
CREATE TABLE IF NOT EXISTS ai_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  symptoms TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_ai_diagnoses_doctor_id ON ai_diagnoses(doctor_id);
CREATE INDEX idx_ai_diagnoses_patient_id ON ai_diagnoses(patient_id);
CREATE INDEX idx_ai_diagnoses_created_at ON ai_diagnoses(created_at DESC);
