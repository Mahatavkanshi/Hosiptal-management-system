import api from './api';

export interface PrescriptionItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface ReportData {
  patient_id: string;
  type: 'medical' | 'prescription' | 'discharge' | 'lab';
  title: string;
  diagnosis?: string;
  chief_complaint?: string;
  examination_notes?: string;
  prescriptions?: PrescriptionItem[];
  follow_up_date?: string;
  additional_notes?: string;
}

export interface Report {
  id: string;
  patient_id: string;
  doctor_id: string;
  type: string;
  title: string;
  diagnosis?: string;
  chief_complaint?: string;
  examination_notes?: string;
  prescriptions?: PrescriptionItem[];
  follow_up_date?: string;
  content: any;
  pdf_path?: string;
  download_count: number;
  created_at: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
}

export interface ReportStats {
  total_reports: number;
  this_month: number;
  prescriptions: number;
  medical_reports: number;
  discharge_summaries: number;
  lab_reports: number;
  total_downloads: number;
}

export const reportService = {
  // Create new report
  createReport: async (data: ReportData): Promise<{ success: boolean; data: Report; message?: string }> => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  // Get all reports for a patient
  getPatientReports: async (patientId: string): Promise<Report[]> => {
    const response = await api.get(`/reports/patient/${patientId}`);
    return response.data.data || [];
  },

  // Get single report
  getReport: async (reportId: string): Promise<Report> => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data.data;
  },

  // Download report PDF
  downloadReportPDF: async (reportId: string): Promise<Blob> => {
    const response = await api.get(`/reports/${reportId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get report statistics
  getReportStats: async (): Promise<ReportStats> => {
    const response = await api.get('/reports/stats/overview');
    return response.data.data;
  },

  // Delete report
  deleteReport: async (reportId: string): Promise<void> => {
    await api.delete(`/reports/${reportId}`);
  },

  // Download PDF and trigger browser download
  downloadAndSavePDF: async (reportId: string, filename?: string) => {
    try {
      console.log('📥 Downloading PDF for report:', reportId);
      const blob = await reportService.downloadReportPDF(reportId);
      console.log('✅ PDF downloaded successfully, size:', blob.size, 'bytes');
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error: any) {
      console.error('❌ Download failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      return false;
    }
  }
};

export default reportService;
