import api from './api';

export interface AIDiagnosisRequest {
  symptoms: string;
  patient_id?: string;
  files?: File[];
}

export interface AIDiagnosisResponse {
  success: boolean;
  data?: {
    diagnosis_id: string;
    ai_response: string;
    patient_id?: string;
    created_at: string;
  };
  message?: string;
}

export interface AIDiagnosisHistory {
  id: string;
  symptoms: string;
  ai_response: string;
  created_at: string;
}

export const aiService = {
  // Analyze symptoms with AI
  analyzeSymptoms: async (data: AIDiagnosisRequest): Promise<AIDiagnosisResponse> => {
    const formData = new FormData();
    formData.append('symptoms', data.symptoms);
    
    if (data.patient_id) {
      formData.append('patient_id', data.patient_id);
    }
    
    if (data.files && data.files.length > 0) {
      data.files.forEach(file => {
        formData.append('files', file);
      });
    }
    
    const response = await api.post('/ai/diagnose', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  // Get AI diagnosis history for a patient
  getPatientHistory: async (patientId: string): Promise<AIDiagnosisHistory[]> => {
    const response = await api.get(`/ai/history/${patientId}`);
    return response.data.data;
  },
  
  // Get all AI diagnoses for doctor
  getAllDiagnoses: async (): Promise<any[]> => {
    const response = await api.get('/ai/all-diagnoses');
    return response.data.data;
  }
};

export default aiService;
