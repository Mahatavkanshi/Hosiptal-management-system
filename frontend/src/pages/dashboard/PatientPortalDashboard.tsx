import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText,
  CreditCard,
  Clock,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  Activity,
  Pill,
  AlertCircle,
  CheckCircle2,
  Download,
  X,
  Search,
  Stethoscope,
  Video,
  DollarSign,
  History,
  ChevronLeft,
  Plus,
  Minus,
  Receipt,
  ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  type: string;
  consultationType: 'in-person' | 'video';
  amount: number;
  paymentStatus: 'paid' | 'pending';
  tokenNumber?: string;
  appointmentNumber?: string;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  consultationFee: number;
  availableSlots: string[];
  image?: string;
  rating: number;
  experience: number;
}

interface MedicalRecord {
  id: string;
  date: string;
  doctor: string;
  doctorId: string;
  diagnosis: string;
  prescription: string[];
  notes: string;
  attachments?: string[];
  symptoms: string[];
}

interface Bill {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  type: 'appointment' | 'pharmacy' | 'lab' | 'other';
  paidDate?: string;
  serviceProvider: string;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'appointment' | 'pharmacy' | 'reception' | 'other';
  status: 'success' | 'failed' | 'pending';
  transactionId: string;
}

interface TelemedicineSession {
  id: string;
  doctorName: string;
  department: string;
  date: string;
  duration: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  recordingUrl?: string;
  prescription?: string[];
}

// Demo Data
const demoDoctors: Doctor[] = [
  {
    id: 'doc1',
    name: 'Dr. Sarah Johnson',
    department: 'Cardiology',
    specialization: 'Interventional Cardiology',
    consultationFee: 1500,
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
    rating: 4.8,
    experience: 15
  },
  {
    id: 'doc2',
    name: 'Dr. Michael Chen',
    department: 'General Medicine',
    specialization: 'Internal Medicine',
    consultationFee: 800,
    availableSlots: ['09:30 AM', '10:30 AM', '11:30 AM', '02:30 PM', '03:30 PM', '04:30 PM'],
    rating: 4.7,
    experience: 12
  },
  {
    id: 'doc3',
    name: 'Dr. Emily Davis',
    department: 'Dermatology',
    specialization: 'Clinical Dermatology',
    consultationFee: 1200,
    availableSlots: ['10:00 AM', '11:00 AM', '12:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'],
    rating: 4.9,
    experience: 10
  },
  {
    id: 'doc4',
    name: 'Dr. Robert Wilson',
    department: 'Orthopedics',
    specialization: 'Joint Replacement',
    consultationFee: 1800,
    availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
    rating: 4.6,
    experience: 20
  },
  {
    id: 'doc5',
    name: 'Dr. Lisa Anderson',
    department: 'Pediatrics',
    specialization: 'Child Health',
    consultationFee: 1000,
    availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM'],
    rating: 4.9,
    experience: 8
  }
];

const demoMedicalRecords: MedicalRecord[] = [
  {
    id: 'rec1',
    date: '2024-02-15',
    doctor: 'Dr. Michael Chen',
    doctorId: 'doc2',
    diagnosis: 'Common Cold',
    prescription: ['Paracetamol 500mg - 3 times daily', 'Vitamin C 1000mg - Once daily', 'Cough syrup - As needed'],
    notes: 'Patient advised rest and hydration. Follow up in 1 week if symptoms persist. Temperature monitored.',
    symptoms: ['Fever', 'Cough', 'Body ache'],
    attachments: ['blood-report.pdf', 'prescription.pdf']
  },
  {
    id: 'rec2',
    date: '2024-01-20',
    doctor: 'Dr. Emily Davis',
    doctorId: 'doc3',
    diagnosis: 'Eczema',
    prescription: ['Hydrocortisone cream - Apply twice daily', 'Moisturizer - Apply 3-4 times daily', 'Antihistamine - Once at night'],
    notes: 'Apply cream twice daily. Avoid harsh soaps. Use lukewarm water for bathing.',
    symptoms: ['Skin rash', 'Itching', 'Dry skin'],
    attachments: ['skin-test.pdf']
  },
  {
    id: 'rec3',
    date: '2023-12-10',
    doctor: 'Dr. Sarah Johnson',
    doctorId: 'doc1',
    diagnosis: 'Hypertension',
    prescription: ['Amlodipine 5mg - Once daily', 'Lifestyle modifications advised'],
    notes: 'Blood pressure monitored. Patient advised to reduce salt intake and exercise regularly.',
    symptoms: ['Headache', 'Dizziness'],
    attachments: ['bp-chart.pdf', 'ecg-report.pdf']
  }
];

const demoBills: Bill[] = [
  {
    id: 'bill1',
    date: '2024-02-15',
    description: 'Consultation Fee - Dr. Michael Chen',
    amount: 800,
    status: 'paid',
    type: 'appointment',
    paidDate: '2024-02-15',
    serviceProvider: 'Dr. Michael Chen'
  },
  {
    id: 'bill2',
    date: '2024-02-15',
    description: 'Lab Tests - Blood Work',
    amount: 250,
    status: 'paid',
    type: 'lab',
    paidDate: '2024-02-15',
    serviceProvider: 'Lab Department'
  },
  {
    id: 'bill3',
    date: '2024-01-20',
    description: 'Consultation Fee - Dr. Emily Davis',
    amount: 1200,
    status: 'paid',
    type: 'appointment',
    paidDate: '2024-01-20',
    serviceProvider: 'Dr. Emily Davis'
  },
  {
    id: 'bill4',
    date: '2024-02-28',
    description: 'Video Consultation - Dr. Sarah Johnson',
    amount: 1500,
    status: 'pending',
    type: 'appointment',
    serviceProvider: 'Dr. Sarah Johnson'
  },
  {
    id: 'bill5',
    date: '2024-02-25',
    description: 'Medicines - Pharmacy',
    amount: 450,
    status: 'pending',
    type: 'pharmacy',
    serviceProvider: 'Hospital Pharmacy'
  }
];

const demoPaymentHistory: PaymentHistory[] = [
  {
    id: 'pay1',
    date: '2024-02-15',
    amount: 1050,
    description: 'Consultation + Lab Tests',
    type: 'appointment',
    status: 'success',
    transactionId: 'TXN-20240215-001'
  },
  {
    id: 'pay2',
    date: '2024-01-20',
    amount: 1200,
    description: 'Dermatology Consultation',
    type: 'appointment',
    status: 'success',
    transactionId: 'TXN-20240120-002'
  },
  {
    id: 'pay3',
    date: '2023-12-10',
    amount: 1500,
    description: 'Cardiology Checkup',
    type: 'appointment',
    status: 'success',
    transactionId: 'TXN-20231210-003'
  }
];

const demoTelemedicineSessions: TelemedicineSession[] = [
  {
    id: 'tele1',
    doctorName: 'Dr. Sarah Johnson',
    department: 'Cardiology',
    date: '2024-02-28',
    duration: '25 mins',
    status: 'scheduled',
    prescription: ['Continue current medications']
  },
  {
    id: 'tele2',
    doctorName: 'Dr. Michael Chen',
    department: 'General Medicine',
    date: '2024-02-10',
    duration: '15 mins',
    status: 'completed',
    prescription: ['Paracetamol 500mg', 'Vitamin C'],
    recordingUrl: '#'
  }
];

const PatientPortalDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>(demoMedicalRecords);
  const [bills, setBills] = useState<Bill[]>(demoBills);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>(demoPaymentHistory);
  const [telemedicineSessions, setTelemedicineSessions] = useState<TelemedicineSession[]>(demoTelemedicineSessions);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [showViewRecords, setShowViewRecords] = useState(false);
  const [showPayBills, setShowPayBills] = useState(false);
  const [showTelemedicine, setShowTelemedicine] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showRecordDetails, setShowRecordDetails] = useState<MedicalRecord | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  
  // Book Appointment State
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'in-person' | 'video'>('in-person');
  const [symptoms, setSymptoms] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [bookingStep, setBookingStep] = useState(1);
  
  // Payment State
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentStep, setPaymentStep] = useState(1);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Demo data with appointments
      setTimeout(() => {
        setAppointments([
          { 
            id: '1', 
            doctorId: 'doc1',
            doctorName: 'Dr. Sarah Johnson', 
            department: 'Cardiology', 
            date: '2024-02-28', 
            time: '10:00 AM', 
            status: 'upcoming', 
            type: 'Follow-up',
            consultationType: 'video',
            amount: 1500,
            paymentStatus: 'paid',
            appointmentNumber: 'V-2024-015'
          },
          { 
            id: '2', 
            doctorId: 'doc2',
            doctorName: 'Dr. Michael Chen', 
            department: 'General Medicine', 
            date: '2024-02-15', 
            time: '02:30 PM', 
            status: 'completed', 
            type: 'General Checkup',
            consultationType: 'in-person',
            amount: 800,
            paymentStatus: 'paid',
            tokenNumber: 'A-042',
            appointmentNumber: 'APT-2024-042'
          },
          { 
            id: '3', 
            doctorId: 'doc3',
            doctorName: 'Dr. Emily Davis', 
            department: 'Dermatology', 
            date: '2024-02-26', 
            time: '11:30 AM', 
            status: 'upcoming', 
            type: 'Consultation',
            consultationType: 'in-person',
            amount: 1200,
            paymentStatus: 'paid',
            tokenNumber: 'A-056',
            appointmentNumber: 'APT-2024-056'
          }
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  // Filter doctors based on search
  const filteredDoctors = demoDoctors.filter(doc => 
    doc.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doc.department.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doc.specialization.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  // Calculate totals
  const totalDue = bills.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((acc, b) => acc + b.amount, 0);
  const upcomingCount = appointments.filter(a => a.status === 'upcoming').length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'upcoming': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'paid': 'bg-green-100 text-green-700',
      'overdue': 'bg-red-100 text-red-700',
      'success': 'bg-green-100 text-green-700',
      'failed': 'bg-red-100 text-red-700',
      'scheduled': 'bg-blue-100 text-blue-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  // Handle Book Appointment
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Please select doctor, date and time');
      return;
    }

    // For video consultations, check payment
    if (consultationType === 'video' && selectedDoctor.consultationFee > 0) {
      setBookingStep(3); // Go to payment step
      return;
    }

    // Create appointment
    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      department: selectedDoctor.department,
      date: selectedDate,
      time: selectedTime,
      status: 'upcoming',
      type: 'Consultation',
      consultationType: consultationType,
      amount: selectedDoctor.consultationFee,
      paymentStatus: consultationType === 'video' ? 'pending' : 'paid'
    };

    setAppointments([newAppointment, ...appointments]);
    toast.success('Appointment booked successfully!');
    setShowBookAppointment(false);
    resetBookingForm();
    
    // In real implementation, send to doctor dashboard via API
    console.log('Appointment created:', newAppointment);
  };

  const resetBookingForm = () => {
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTime('');
    setConsultationType('in-person');
    setSymptoms('');
    setBookingStep(1);
    setDoctorSearch('');
  };

  // Handle Payment
  const handlePayment = async () => {
    if (!selectedBill) return;
    
    // Razorpay integration would go here
    toast.success('Payment successful!');
    
    // Update bill status
    const updatedBills = bills.map(b => 
      b.id === selectedBill.id ? { ...b, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] } : b
    );
    setBills(updatedBills);
    
    // Add to payment history
    const newPayment: PaymentHistory = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: selectedBill.amount,
      description: selectedBill.description,
      type: selectedBill.type,
      status: 'success',
      transactionId: `TXN-${Date.now()}`
    };
    setPaymentHistory([newPayment, ...paymentHistory]);
    
    setShowPayBills(false);
    setSelectedBill(null);
    setPaymentStep(1);
  };

  // Video Call Handler
  const startVideoCall = (appointment: Appointment) => {
    if (appointment.paymentStatus === 'pending') {
      toast.error('Please complete payment first');
      return;
    }
    navigate(`/video-call/${appointment.id}`);
  };

  // Generate available dates (next 14 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-teal-500 text-white p-2 rounded-lg mr-3">
                <Activity className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-gray-900">Hospital MS</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.first_name || 'Patient'} {user?.last_name || 'Doe'}</p>
                <p className="text-xs text-gray-500">Patient ID: PT-2024-001</p>
              </div>
              <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.first_name || 'Patient'}! 👋
              </h1>
              <p className="text-teal-100 text-lg">
                Manage your health records and appointments
              </p>
              <div className="flex items-center mt-3 space-x-4 text-sm text-teal-100">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowBookAppointment(true)}
                className="bg-white text-teal-600 px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button 
            onClick={() => setShowBookAppointment(true)}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Book</h3>
            <p className="text-sm text-gray-500">Appointment</p>
          </button>
          
          <button 
            onClick={() => setShowViewRecords(true)}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">View</h3>
            <p className="text-sm text-gray-500">Records</p>
          </button>
          
          <button 
            onClick={() => setShowPayBills(true)}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-yellow-200 transition-colors">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Pay</h3>
            <p className="text-sm text-gray-500">Bills</p>
          </button>
          
          <button 
            onClick={() => setShowTelemedicine(true)}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Video</h3>
            <p className="text-sm text-gray-500">Consult</p>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Medical Records</p>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Balance Due</p>
                <p className="text-2xl font-bold text-gray-900">${totalDue}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Pill className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Upcoming Appointments</h3>
                    <p className="text-sm text-gray-500">{upcomingCount} scheduled</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAllAppointments(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              
              <div className="divide-y divide-gray-100">
                {appointments.filter(a => a.status === 'upcoming').length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No upcoming appointments</p>
                    <button 
                      onClick={() => setShowBookAppointment(true)}
                      className="mt-3 text-teal-600 font-medium hover:text-teal-700"
                    >
                      Book your first appointment
                    </button>
                  </div>
                ) : (
                  appointments.filter(a => a.status === 'upcoming').map((apt) => (
                    <div key={apt.id} className="p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                            <Stethoscope className="h-6 w-6 text-teal-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{apt.doctorName}</p>
                              {apt.tokenNumber && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold border border-amber-300">
                                  Token: {apt.tokenNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{apt.department} • {apt.type}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{apt.date} at {apt.time}</span>
                              {apt.consultationType === 'video' && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Video</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {apt.consultationType === 'video' && apt.paymentStatus === 'paid' && (
                            <button
                              onClick={() => startVideoCall(apt)}
                              className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </button>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Medical Records Sidebar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Recent Records</h3>
                  <p className="text-sm text-gray-500">{records.length} total</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {records.slice(0, 3).map((record) => (
                <div 
                  key={record.id} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setShowRecordDetails(record)}
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <FileText className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{record.diagnosis}</p>
                      <p className="text-xs text-gray-500">{record.doctor}</p>
                      <p className="text-xs text-gray-400 mt-1">{record.date}</p>
                    </div>
                    <button className="ml-2 text-gray-400 hover:text-teal-600">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button 
                onClick={() => setShowViewRecords(true)}
                className="w-full py-2 text-center text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
              >
                View All Records
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Medical Records</p>
              <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-bold text-gray-900">${totalDue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout - Equal Size Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments - Compact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Upcoming Appointments</h3>
                  <p className="text-xs text-gray-500">{upcomingCount} appointment{upcomingCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAllAppointments(true)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
            {appointments.filter(a => a.status === 'upcoming').length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="text-sm">No upcoming appointments</p>
              </div>
            ) : (
              appointments.filter(a => a.status === 'upcoming').slice(0, 2).map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{apt.doctorName}</p>
                        {apt.tokenNumber && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold border border-amber-300">
                            Token: {apt.tokenNumber}
                          </span>
                        )}
                        {apt.appointmentNumber && !apt.tokenNumber && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                            {apt.appointmentNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{apt.department} • {apt.type}</p>
                      
                      <div className="flex items-center mt-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{apt.date} at {apt.time}</span>
                        {apt.consultationType === 'video' && (
                          <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">Video</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {apt.consultationType === 'video' && apt.paymentStatus === 'paid' && (
                        <button
                          onClick={() => startVideoCall(apt)}
                          className="flex items-center px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        >
                          <Video className="h-3 w-3 mr-0.5" />
                          Join
                        </button>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medical Records - Compact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Recent Medical Records</h3>
                  <p className="text-xs text-gray-500">{records.length} records</p>
                </div>
              </div>
              <button 
                onClick={() => setShowViewRecords(true)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
            {records.slice(0, 2).map((record) => (
              <div 
                key={record.id} 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setShowRecordDetails(record)}
              >
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{record.diagnosis}</p>
                    <p className="text-xs text-gray-500">{record.doctor}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{record.date}</p>
                    
                    <div className="mt-1">
                      <p className="text-[10px] text-gray-600 truncate">
                        {record.prescription.slice(0, 2).join(', ')}
                        {record.prescription.length > 2 && '...'}
                      </p>
                    </div>
                  </div>
                  
                  <button className="ml-2 text-teal-600 hover:text-teal-700">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showBookAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <button 
                onClick={() => {
                  setShowBookAppointment(false);
                  resetBookingForm();
                }}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
                  <p className="text-sm text-gray-500">Step {bookingStep} of {consultationType === 'video' ? 3 : 2}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowBookAppointment(false);
                    resetBookingForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {bookingStep === 1 && (
                <div className="space-y-6">
                  {/* Consultation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setConsultationType('in-person')}
                        className={`p-4 border-2 rounded-xl text-left transition-colors ${
                          consultationType === 'in-person' 
                            ? 'border-teal-500 bg-teal-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Stethoscope className="h-6 w-6 mb-2 text-teal-600" />
                        <p className="font-medium">In-Person Visit</p>
                        <p className="text-sm text-gray-500">Visit the hospital</p>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setConsultationType('video')}
                        className={`p-4 border-2 rounded-xl text-left transition-colors ${
                          consultationType === 'video' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Video className="h-6 w-6 mb-2 text-purple-600" />
                        <p className="font-medium">Video Consultation</p>
                        <p className="text-sm text-gray-500">Consult from home</p>
                      </button>
                    </div>
                  </div>

                  {/* Doctor Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Doctor</label>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, department, or specialization..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    {/* Doctor List */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {filteredDoctors.map((doctor) => (
                        <button
                          key={doctor.id}
                          type="button"
                          onClick={() => setSelectedDoctor(doctor)}
                          className={`w-full p-4 border-2 rounded-xl text-left transition-colors ${
                            selectedDoctor?.id === doctor.id 
                              ? 'border-teal-500 bg-teal-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{doctor.name}</p>
                              <p className="text-sm text-gray-500">{doctor.department} • {doctor.specialization}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-600">{doctor.experience} years exp</span>
                                <span className="text-yellow-600">★ {doctor.rating}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-teal-600">₹{doctor.consultationFee}</p>
                              <p className="text-xs text-gray-500">Consultation fee</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms/Reason for Visit</label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Describe your symptoms or reason for the appointment..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              {bookingStep === 2 && selectedDoctor && (
                <div className="space-y-6">
                  <button
                    onClick={() => setBookingStep(1)}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </button>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedDoctor.name}</p>
                    <p className="text-sm text-gray-500">{selectedDoctor.department}</p>
                    <p className="text-teal-600 font-medium mt-2">₹{selectedDoctor.consultationFee}</p>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
                    <div className="grid grid-cols-7 gap-2">
                      {getAvailableDates().map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setSelectedDate(date)}
                          className={`p-2 border-2 rounded-lg text-center transition-colors ${
                            selectedDate === date 
                              ? 'border-teal-500 bg-teal-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-xs text-gray-500">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                          <p className="font-medium">{new Date(date).getDate()}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Select Time</label>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedDoctor.availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`p-3 border-2 rounded-lg text-center transition-colors ${
                              selectedTime === slot 
                                ? 'border-teal-500 bg-teal-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {bookingStep === 3 && consultationType === 'video' && selectedDoctor && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">Payment Required</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Video consultations require payment before booking.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Doctor</span>
                        <span className="font-medium">{selectedDoctor.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time</span>
                        <span className="font-medium">{selectedDate} at {selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type</span>
                        <span className="font-medium">Video Consultation</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between text-lg font-medium">
                        <span>Total</span>
                        <span>₹{selectedDoctor.consultationFee}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // Razorpay integration here
                      toast.success('Payment processing... (Demo Mode)');
                      handleBookAppointment();
                    }}
                    className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Pay ₹{selectedDoctor.consultationFee} & Book
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {bookingStep < 3 && (
              <div className="p-6 border-t border-gray-100 flex justify-between">
                <button
                  onClick={() => {
                    if (bookingStep > 1) {
                      setBookingStep(bookingStep - 1);
                    } else {
                      setShowBookAppointment(false);
                      resetBookingForm();
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {bookingStep === 1 ? 'Cancel' : 'Back'}
                </button>
                
                <button
                  onClick={() => {
                    if (bookingStep === 1 && selectedDoctor) {
                      setBookingStep(2);
                    } else if (bookingStep === 2 && selectedDate && selectedTime) {
                      handleBookAppointment();
                    }
                  }}
                  disabled={bookingStep === 1 ? !selectedDoctor : !selectedDate || !selectedTime}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingStep === 1 ? 'Next' : 'Book Appointment'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Records Modal */}
      {showViewRecords && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <button 
                onClick={() => setShowViewRecords(false)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Medical Records</h2>
                <button 
                  onClick={() => setShowViewRecords(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {records.map((record) => (
                  <div 
                    key={record.id} 
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setShowRecordDetails(record)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <FileText className="h-6 w-6 text-green-600" />
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-900">{record.diagnosis}</p>
                          <p className="text-sm text-gray-500">{record.doctor}</p>
                          <p className="text-sm text-gray-400">{record.date}</p>
                          
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Symptoms: </span>
                              {record.symptoms.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button className="flex items-center text-teal-600 hover:text-teal-700">
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      {showRecordDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <button 
                onClick={() => setShowRecordDetails(null)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Records
              </button>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Medical Record Details</h2>
                <button 
                  onClick={() => setShowRecordDetails(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{showRecordDetails.date}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Doctor</p>
                <p className="font-medium text-lg">{showRecordDetails.doctor}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                <p className="font-medium text-lg text-teal-600">{showRecordDetails.diagnosis}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {showRecordDetails.symptoms.map((symptom, idx) => (
                    <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Prescription</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {showRecordDetails.prescription.map((med, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <Pill className="h-4 w-4 mr-2 text-green-600" />
                        {med}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Doctor's Notes</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{showRecordDetails.notes}</p>
              </div>

              {showRecordDetails.attachments && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Attachments</p>
                  <div className="space-y-2">
                    {showRecordDetails.attachments.map((file, idx) => (
                      <button
                        key={idx}
                        className="flex items-center w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <FileText className="h-5 w-5 mr-3 text-gray-400" />
                        <span className="flex-1 text-left">{file}</span>
                        <Download className="h-4 w-4 text-teal-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pay Bills Modal */}
      {showPayBills && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <button 
                onClick={() => {
                  setShowPayBills(false);
                  setPaymentStep(1);
                  setSelectedBill(null);
                }}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Pay Bills</h2>
                <button 
                  onClick={() => {
                    setShowPayBills(false);
                    setPaymentStep(1);
                    setSelectedBill(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {paymentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="font-medium text-yellow-900">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-yellow-700">${totalDue}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPaymentHistory(true)}
                      className="flex items-center text-yellow-700 hover:text-yellow-800"
                    >
                      <History className="h-4 w-4 mr-1" />
                      View History
                    </button>
                  </div>

                  <h3 className="font-medium text-gray-900">Pending Bills</h3>

                  <div className="space-y-3">
                    {bills.filter(b => b.status === 'pending' || b.status === 'overdue').map((bill) => (
                      <div 
                        key={bill.id} 
                        className="border-2 border-gray-200 rounded-xl p-4 hover:border-teal-500 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedBill(bill);
                          setPaymentStep(2);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{bill.description}</p>
                            <p className="text-sm text-gray-500">{bill.serviceProvider} • {bill.date}</p>
                            <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(bill.status)}`}>
                              {bill.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">${bill.amount}</p>
                            <button className="mt-2 px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
                              Pay Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {bills.filter(b => b.status === 'pending' || b.status === 'overdue').length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                        <p className="text-gray-600">No pending bills!</p>
                        <p className="text-sm text-gray-400">All your bills are paid</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentStep === 2 && selectedBill && (
                <div className="space-y-6">
                  <button
                    onClick={() => setPaymentStep(1)}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Bills
                  </button>

                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="font-medium mb-4">Payment Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description</span>
                        <span className="font-medium">{selectedBill.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service Provider</span>
                        <span className="font-medium">{selectedBill.serviceProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date</span>
                        <span className="font-medium">{selectedBill.date}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-xl font-bold">
                        <span>Total Amount</span>
                        <span>${selectedBill.amount}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-3">Select Payment Method</p>
                    <div className="space-y-2">
                      {['Credit/Debit Card', 'UPI', 'Net Banking', 'Wallet'].map((method) => (
                        <button
                          key={method}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl text-left hover:border-teal-500 transition-colors"
                        >
                          <p className="font-medium">{method}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
                  >
                    Pay ${selectedBill.amount}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <button 
                onClick={() => setShowPaymentHistory(false)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
                <button 
                  onClick={() => setShowPaymentHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                          payment.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Receipt className={`h-5 w-5 ${
                            payment.status === 'success' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-900">{payment.description}</p>
                          <p className="text-sm text-gray-500">{payment.date}</p>
                          <p className="text-xs text-gray-400 mt-1">Txn ID: {payment.transactionId}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${payment.amount}</p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadge(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telemedicine Modal */}
      {showTelemedicine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <button 
                onClick={() => setShowTelemedicine(false)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Telemedicine</h2>
                <button 
                  onClick={() => setShowTelemedicine(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Video className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-purple-900">Video Consultations</p>
                      <p className="text-sm text-purple-700">Consult with doctors from the comfort of your home</p>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="font-medium text-gray-900 mb-4">Your Video Consultations</h3>

              <div className="space-y-4">
                {telemedicineSessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                          <Video className="h-6 w-6 text-purple-600" />
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-900">{session.doctorName}</p>
                          <p className="text-sm text-gray-500">{session.department}</p>
                          <p className="text-sm text-gray-400">{session.date} • {session.duration}</p>
                          
                          {session.prescription && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">Prescription: {session.prescription.join(', ')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                          {session.status}
                        </span>
                        
                        {session.status === 'scheduled' && (
                          <button className="mt-2 block px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                            Join Call
                          </button>
                        )}
                        
                        {session.recordingUrl && (
                          <button className="mt-2 block text-sm text-purple-600 hover:text-purple-700">
                            View Recording
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {telemedicineSessions.length === 0 && (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600">No video consultations yet</p>
                    <button 
                      onClick={() => {
                        setShowTelemedicine(false);
                        setShowBookAppointment(true);
                      }}
                      className="mt-3 text-purple-600 font-medium hover:underline"
                    >
                      Book a video consultation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Appointments Modal */}
      {showAllAppointments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <button 
                onClick={() => setShowAllAppointments(false)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">All Appointments</h2>
                <button 
                  onClick={() => setShowAllAppointments(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Filter Tabs */}
              <div className="px-6 pt-4 border-b border-gray-100">
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All', count: appointments.length },
                    { id: 'upcoming', label: 'Upcoming', count: appointments.filter(a => a.status === 'upcoming').length },
                    { id: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
                    { id: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAppointmentFilter(tab.id as any)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        appointmentFilter === tab.id
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Appointments List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {appointments
                    .filter(apt => appointmentFilter === 'all' || apt.status === appointmentFilter)
                    .map((apt) => (
                    <div key={apt.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                            apt.status === 'upcoming' ? 'bg-teal-100' :
                            apt.status === 'completed' ? 'bg-green-100' :
                            apt.status === 'cancelled' ? 'bg-red-100' :
                            'bg-gray-100'
                          }`}>
                            <Calendar className={`h-6 w-6 ${
                              apt.status === 'upcoming' ? 'text-teal-600' :
                              apt.status === 'completed' ? 'text-green-600' :
                              apt.status === 'cancelled' ? 'text-red-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{apt.doctorName}</p>
                              {apt.tokenNumber && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold border border-amber-300">
                                  Token: {apt.tokenNumber}
                                </span>
                              )}
                              {apt.appointmentNumber && !apt.tokenNumber && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {apt.appointmentNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{apt.department} • {apt.type}</p>
                            
                            <div className="flex items-center mt-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{apt.date} at {apt.time}</span>
                              {apt.consultationType === 'video' && (
                                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Video</span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <span className="text-gray-600">Amount: ${apt.amount}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                apt.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {apt.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {apt.status === 'upcoming' && apt.consultationType === 'video' && apt.paymentStatus === 'paid' && (
                            <button
                              onClick={() => startVideoCall(apt)}
                              className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </button>
                          )}
                          
                          {apt.status === 'upcoming' && apt.paymentStatus === 'pending' && (
                            <button
                              onClick={() => {
                                setShowAllAppointments(false);
                                setShowPayBills(true);
                              }}
                              className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                            >
                              Pay
                            </button>
                          )}
                          
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons for Upcoming */}
                      {apt.status === 'upcoming' && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                          <button 
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                            onClick={() => toast.success('Reschedule feature coming soon!')}
                          >
                            Reschedule
                          </button>
                          <button 
                            className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                            onClick={() => toast.success('Cancel feature coming soon!')}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {appointments.filter(apt => appointmentFilter === 'all' || apt.status === appointmentFilter).length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 text-lg">No appointments found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {appointmentFilter === 'all' ? 'Book your first appointment' : `No ${appointmentFilter} appointments`}
                      </p>
                      <button 
                        onClick={() => {
                          setShowAllAppointments(false);
                          setShowBookAppointment(true);
                        }}
                        className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                      >
                        Book Appointment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPortalDashboard;
