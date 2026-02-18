export type UserRole = 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient' | 'pharmacist';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  license_number?: string;
  available_days: string[];
  available_time_start: string;
  available_time_end: string;
  slot_duration: number;
  is_available: boolean;
  rating: number;
  total_reviews: number;
  about?: string;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth?: Date;
  blood_group?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  allergies?: string;
  chronic_conditions?: string;
  created_at: Date;
  updated_at: Date;
  user?: User;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'in_progress';
export type AppointmentType = 'in_person' | 'video';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: Date;
  appointment_time: string;
  end_time?: string;
  status: AppointmentStatus;
  type: AppointmentType;
  symptoms?: string;
  notes?: string;
  queue_number?: number;
  payment_status: PaymentStatus;
  payment_amount?: number;
  video_call_room_id?: string;
  video_call_started_at?: Date;
  video_call_ended_at?: Date;
  cancellation_reason?: string;
  cancelled_by?: string;
  created_at: Date;
  updated_at: Date;
  patient?: Patient;
  doctor?: Doctor;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  visit_date: Date;
  diagnosis?: string;
  chief_complaint?: string;
  examination_notes?: string;
  prescription?: string;
  follow_up_date?: Date;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  created_at: Date;
  updated_at: Date;
  doctor?: Doctor;
  patient?: Patient;
}

export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
export type WardType = 'general' | 'semi_private' | 'private' | 'icu' | 'ccu' | 'emergency';

export interface Bed {
  id: string;
  bed_number: string;
  ward_type: WardType;
  floor_number: number;
  room_number: string;
  status: BedStatus;
  patient_id?: string;
  assigned_date?: Date;
  discharge_date?: Date;
  daily_charge: number;
  amenities: string[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
  patient?: Patient;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  dosage_form?: string;
  strength?: string;
  stock_quantity: number;
  unit_price: number;
  cost_price: number;
  expiry_date?: Date;
  batch_number?: string;
  reorder_level: number;
  storage_conditions?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  medicine_id?: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  created_at: Date;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'insurance' | 'netbanking';
export type PaymentStatusType = 'pending' | 'success' | 'failed' | 'refunded' | 'cancelled';
export type PaymentType = 'consultation' | 'bed' | 'medicine' | 'lab_test' | 'registration';

export interface Payment {
  id: string;
  appointment_id?: string;
  patient_id: string;
  amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method?: PaymentMethod;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status: PaymentStatusType;
  payment_type?: PaymentType;
  description?: string;
  created_at: Date;
  updated_at: Date;
  patient?: Patient;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  data: Record<string, any>;
  created_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
