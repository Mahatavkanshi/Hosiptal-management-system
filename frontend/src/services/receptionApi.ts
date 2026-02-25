import api from './api';

// Types
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  room: string;
  status: 'available' | 'busy' | 'off_duty';
  consultation_fee: number;
  current_patients: number;
  waiting_count: number;
}

export interface QueueItem {
  id: string;
  token: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  doctor_id: string;
  check_in_time: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  type: 'regular' | 'priority' | 'emergency';
  fee_paid: boolean;
  fee_amount: number;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  total_visits: number;
  last_visit: string;
  outstanding_amount: number;
}

export interface TodayStats {
  total_patients: number;
  completed: number;
  waiting: number;
  total_revenue: number;
}

export interface DoctorStats {
  id: string;
  name: string;
  current_patients: number;
  waiting_count: number;
  completed_count: number;
}

// Reception API Service
export const receptionApi = {
  // Get all doctors with queue info
  getDoctors: async (): Promise<Doctor[]> => {
    const response = await api.get('/reception/doctors');
    return response.data.data;
  },

  // Get queue for specific doctor
  getDoctorQueue: async (doctorId: string): Promise<QueueItem[]> => {
    const response = await api.get(`/reception/queue/${doctorId}`);
    return response.data.data;
  },

  // Get all queues for today
  getAllQueues: async (): Promise<QueueItem[]> => {
    const response = await api.get('/reception/queue');
    return response.data.data;
  },

  // Add patient to queue
  addToQueue: async (data: {
    patient_id: string;
    doctor_id: string;
    type?: 'regular' | 'priority' | 'emergency';
    symptoms?: string;
  }) => {
    const response = await api.post('/reception/queue', data);
    return response.data;
  },

  // Update appointment status
  updateQueueStatus: async (appointmentId: string, status: string) => {
    const response = await api.patch(`/reception/queue/${appointmentId}/status`, { status });
    return response.data;
  },

  // Call next patient
  callNextPatient: async (doctorId: string) => {
    const response = await api.post(`/reception/queue/${doctorId}/call-next`);
    return response.data;
  },

  // Process payment
  processPayment: async (appointmentId: string, amount: number, payment_method: string = 'cash') => {
    const response = await api.post(`/reception/queue/${appointmentId}/payment`, {
      amount,
      payment_method
    });
    return response.data;
  },

  // Get today's statistics
  getTodayStats: async (): Promise<{ overall: TodayStats; by_doctor: DoctorStats[] }> => {
    const response = await api.get('/reception/stats/today');
    return response.data.data;
  },

  // Search patients
  searchPatients: async (query: string): Promise<Patient[]> => {
    const response = await api.get('/reception/patients/search', {
      params: { query }
    });
    return response.data.data;
  }
};

export default receptionApi;
