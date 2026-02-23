import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Users, BedDouble, Pill, Plus, UserPlus, CreditCard, 
  Activity, Bed, IndianRupee, User, Brain, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Search, Bell,
  LayoutDashboard, Stethoscope, Clock, FileText, ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AddPatientModal from '../../components/modals/AddPatientModal';
import AllocateBedModal from '../../components/modals/AllocateBedModal';
import MedicineOrderModal from '../../components/modals/MedicineOrderModal';
import BookAppointmentModal from '../../components/modals/BookAppointmentModal';
import ProcessPaymentModal from '../../components/modals/ProcessPaymentModal';
import BedManagement from '../../components/beds/BedManagement';
import OutstandingPayments from '../../components/payments/OutstandingPayments';
import AISymptomChecker from '../../components/ai/AISymptomChecker';

interface DashboardStats {
  total_appointments: number;
  today_appointments: {
    total: number;
    completed: number;
    in_progress: number;
    upcoming: number;
  };
  active_patients: number;
  pending_appointments: number;
  beds: {
    total: number;
    available: number;
    occupied: number;
  };
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  address: string;
  city: string;
  state: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
  has_bed: boolean;
  bed_number?: string;
  room_number?: string;
  ward_type?: string;
}

interface Appointment {
  id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_age: number;
  patient_phone: string;
  address: string;
  city: string;
  state: string;
  appointment_time: string;
  status: string;
  type: string;
  symptoms?: string;
}

interface Activity {
  type: string;
  patient_name: string;
  description: string;
  created_at: string;
  time?: string;
  status?: string;
  amount?: number;
}

// Professional Stat Card
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendUp,
  color,
  onClick
}: { 
  icon: any;
  label: string;
  value: number;
  trend?: string;
  trendUp?: boolean;
  color: string;
  onClick?: () => void;
}) => {
  const colorClasses: Record<string, { bg: string; iconBg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', text: 'text-emerald-600' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', iconBg: 'bg-rose-100', text: 'text-rose-600' },
    cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', text: 'text-cyan-600' },
  };
  
  const colors = colorClasses[color] || colorClasses.blue;
  
  return (
    <div 
      onClick={onClick}
      className={`${colors.bg} rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100`}
    >
      <div className="flex items-start justify-between">
        <div className={`${colors.iconBg} ${colors.text} p-3 rounded-xl`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
};

// Sample data for charts
const patientHistoryData = [
  { month: 'Jan', newPatients: 65, oldPatients: 120 },
  { month: 'Feb', newPatients: 78, oldPatients: 135 },
  { month: 'Mar', newPatients: 90, oldPatients: 140 },
  { month: 'Apr', newPatients: 85, oldPatients: 155 },
  { month: 'May', newPatients: 95, oldPatients: 160 },
  { month: 'Jun', newPatients: 110, oldPatients: 175 },
  { month: 'Jul', newPatients: 105, oldPatients: 180 },
  { month: 'Aug', newPatients: 120, oldPatients: 190 },
  { month: 'Sep', newPatients: 115, oldPatients: 185 },
  { month: 'Oct', newPatients: 125, oldPatients: 195 },
  { month: 'Nov', newPatients: 130, oldPatients: 200 },
  { month: 'Dec', newPatients: 140, oldPatients: 210 },
];

const conditionData = [
  { name: 'Diabetes', value: 35, color: '#3b82f6' },
  { name: 'Hypertension', value: 25, color: '#10b981' },
  { name: 'Heart Disease', value: 20, color: '#f59e0b' },
  { name: 'Respiratory', value: 15, color: '#ef4444' },
  { name: 'Others', value: 5, color: '#8b5cf6' },
];

const revenueData = [
  { day: 'Mon', income: 45000, expense: 28000 },
  { day: 'Tue', income: 52000, expense: 31000 },
  { day: 'Wed', income: 48000, expense: 29000 },
  { day: 'Thu', income: 61000, expense: 35000 },
  { day: 'Fri', income: 55000, expense: 32000 },
  { day: 'Sat', income: 42000, expense: 25000 },
  { day: 'Sun', income: 38000, expense: 22000 },
];

// Activity Item Component
const ActivityItem = ({ activity }: { activity: Activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'payment':
        return { icon: IndianRupee, bg: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'patient_added':
        return { icon: User, bg: 'bg-blue-100', text: 'text-blue-600' };
      case 'bed_allocated':
        return { icon: Bed, bg: 'bg-purple-100', text: 'text-purple-600' };
      case 'appointment':
        return { icon: Calendar, bg: 'bg-cyan-100', text: 'text-cyan-600' };
      default:
        return { icon: Activity, bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  const { icon: Icon, bg, text } = getIcon();

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
      <div className={`${bg} ${text} p-3 rounded-lg`}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-medium truncate">{activity.description}</p>
        <p className="text-gray-500 text-sm">{activity.patient_name}</p>
        
        <div className="flex items-center gap-3 mt-1">
          {activity.amount && (
            <span className="text-emerald-600 font-semibold text-sm">
              ₹{activity.amount.toLocaleString()}
            </span>
          )}
          <span className="text-gray-400 text-xs">{activity.created_at}</span>
        </div>
      </div>
      
      <button className="text-gray-400 hover:text-gray-600">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
};

// Quick Action Button
const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  color,
  onClick 
}: { 
  icon: any;
  label: string;
  color: string;
  onClick: () => void;
}) => {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    cyan: 'bg-cyan-500 hover:bg-cyan-600',
    pink: 'bg-pink-500 hover:bg-pink-600',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} text-white p-4 rounded-xl font-medium flex flex-col items-center justify-center gap-2 transition-all hover:shadow-lg hover:scale-105`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-sm">{label}</span>
    </button>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [medicineAlerts, setMedicineAlerts] = useState<any[]>([]);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [useDummyData, setUseDummyData] = useState(false);

  // Dummy data for fallback when API returns 0
  const dummyStats: DashboardStats = {
    total_appointments: 156,
    today_appointments: {
      total: 8,
      completed: 3,
      in_progress: 2,
      upcoming: 3
    },
    active_patients: 342,
    pending_appointments: 12,
    beds: {
      total: 50,
      available: 18,
      occupied: 32
    }
  };

  const dummyPatients: Patient[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      age: 45,
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      blood_group: 'O+',
      allergies: 'None',
      chronic_conditions: 'Diabetes',
      has_bed: true,
      bed_number: 'B-101',
      room_number: 'R-10',
      ward_type: 'General'
    },
    {
      id: '2',
      first_name: 'Sarah',
      last_name: 'Smith',
      age: 32,
      address: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      blood_group: 'A+',
      allergies: 'Penicillin',
      chronic_conditions: 'None',
      has_bed: false
    },
    {
      id: '3',
      first_name: 'Michael',
      last_name: 'Johnson',
      age: 58,
      address: '789 Oak Road',
      city: 'Bangalore',
      state: 'Karnataka',
      blood_group: 'B+',
      allergies: 'None',
      chronic_conditions: 'Hypertension',
      has_bed: true,
      bed_number: 'B-205',
      room_number: 'R-15',
      ward_type: 'ICU'
    },
    {
      id: '4',
      first_name: 'Emily',
      last_name: 'Williams',
      age: 28,
      address: '321 Elm Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      blood_group: 'AB+',
      allergies: 'Dust',
      chronic_conditions: 'None',
      has_bed: false
    },
    {
      id: '5',
      first_name: 'Robert',
      last_name: 'Brown',
      age: 65,
      address: '654 Pine Lane',
      city: 'Hyderabad',
      state: 'Telangana',
      blood_group: 'O-',
      allergies: 'None',
      chronic_conditions: 'Heart Disease',
      has_bed: true,
      bed_number: 'B-112',
      room_number: 'R-8',
      ward_type: 'General'
    }
  ];

  const dummyActivities: Activity[] = [
    {
      type: 'patient_added',
      patient_name: 'John Doe',
      description: 'New patient registered',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      amount: undefined
    },
    {
      type: 'payment',
      patient_name: 'Sarah Smith',
      description: 'Consultation fee payment',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      amount: 1500
    },
    {
      type: 'appointment',
      patient_name: 'Michael Johnson',
      description: 'Appointment completed',
      created_at: new Date(Date.now() - 10800000).toISOString()
    },
    {
      type: 'bed_allocated',
      patient_name: 'Emily Williams',
      description: 'Bed allocated - B-205',
      created_at: new Date(Date.now() - 14400000).toISOString()
    },
    {
      type: 'payment',
      patient_name: 'Robert Brown',
      description: 'Surgery fee payment',
      created_at: new Date(Date.now() - 18000000).toISOString(),
      amount: 45000
    }
  ];

  const dummyAppointments = [
    {
      id: 'apt-1',
      patient_first_name: 'John',
      patient_last_name: 'Doe',
      patient_age: 45,
      patient_phone: '+91 9876543210',
      appointment_time: '09:30',
      appointment_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      type: 'In Person',
      symptoms: 'Fever, headache'
    },
    {
      id: 'apt-2',
      patient_first_name: 'Sarah',
      patient_last_name: 'Smith',
      patient_age: 32,
      patient_phone: '+91 9876543211',
      appointment_time: '10:00',
      appointment_date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      type: 'Video',
      symptoms: 'Chest pain'
    },
    {
      id: 'apt-3',
      patient_first_name: 'Michael',
      patient_last_name: 'Johnson',
      patient_age: 58,
      patient_phone: '+91 9876543212',
      appointment_time: '11:30',
      appointment_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      type: 'In Person',
      symptoms: 'Diabetes checkup'
    },
    {
      id: 'apt-4',
      patient_first_name: 'Emily',
      patient_last_name: 'Williams',
      patient_age: 28,
      patient_phone: '+91 9876543213',
      appointment_time: '14:00',
      appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'confirmed',
      type: 'In Person',
      symptoms: 'Skin rash'
    },
    {
      id: 'apt-5',
      patient_first_name: 'Robert',
      patient_last_name: 'Brown',
      patient_age: 65,
      patient_phone: '+91 9876543214',
      appointment_time: '15:30',
      appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'confirmed',
      type: 'Video',
      symptoms: 'Heart checkup'
    },
    {
      id: 'apt-6',
      patient_first_name: 'Lisa',
      patient_last_name: 'Davis',
      patient_age: 35,
      patient_phone: '+91 9876543215',
      appointment_time: '16:00',
      appointment_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      status: 'pending',
      type: 'In Person',
      symptoms: 'Regular checkup'
    }
  ];

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const dummyMedicineAlerts = [
    {
      id: '1',
      name: 'Ibuprofen',
      generic_name: 'Ibuprofen',
      stock: 2,
      min_quantity: 25,
      shortage: 23
    },
    {
      id: '2',
      name: 'Aspirin',
      generic_name: 'Acetylsalicylic Acid',
      stock: 8,
      min_quantity: 30,
      shortage: 22
    },
    {
      id: '3',
      name: 'Omeprazole',
      generic_name: 'Omeprazole Magnesium',
      stock: 4,
      min_quantity: 25,
      shortage: 21
    },
    {
      id: '4',
      name: 'Paracetamol',
      generic_name: 'Acetaminophen',
      stock: 5,
      min_quantity: 20,
      shortage: 15
    },
    {
      id: '5',
      name: 'Metformin',
      generic_name: 'Metformin Hydrochloride',
      stock: 6,
      min_quantity: 20,
      shortage: 14
    },
    {
      id: '6',
      name: 'Salbutamol',
      generic_name: 'Salbutamol Sulfate',
      stock: 2,
      min_quantity: 15,
      shortage: 13
    },
    {
      id: '7',
      name: 'Amoxicillin',
      generic_name: 'Amoxicillin Trihydrate',
      stock: 3,
      min_quantity: 15,
      shortage: 12
    },
    {
      id: '8',
      name: 'Cetirizine',
      generic_name: 'Cetirizine Hydrochloride',
      stock: 4,
      min_quantity: 15,
      shortage: 11
    },
    {
      id: '9',
      name: 'Azithromycin',
      generic_name: 'Azithromycin Dihydrate',
      stock: 3,
      min_quantity: 12,
      shortage: 9
    }
  ];
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showAllocateBed, setShowAllocateBed] = useState(false);
  const [showMedicineOrder, setShowMedicineOrder] = useState(false);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [showProcessPayment, setShowProcessPayment] = useState(false);
  const [showAISymptomChecker, setShowAISymptomChecker] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Safety check: if stats has 0 values after loading, use dummy data
  useEffect(() => {
    if (!loading && stats) {
      const hasZeroValues = stats.total_appointments === 0 && stats.active_patients === 0;
      if (hasZeroValues && !useDummyData) {
        console.log('Stats has 0 values, switching to dummy data');
        setUseDummyData(true);
        setStats(dummyStats);
        if (activities.length === 0) setActivities(dummyActivities);
        if (patients.length === 0) setPatients(dummyPatients);
        // Don't use dummy medicines - fetch from API instead or leave empty
        if (medicineAlerts.length === 0) setMedicineAlerts([]);
        // Use dummy appointments
        if (appointments.length === 0) setAppointments(dummyAppointments);
      }
    }
  }, [loading, stats]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch medicines separately to ensure we get real data with UUIDs
      const [statsRes, activityRes, medicinesRes, allMedicinesRes, appointmentsRes] = await Promise.all([
        api.get('/doctor-dashboard/dashboard-stats'),
        api.get('/doctor-dashboard/activity?limit=5'),
        api.get('/doctor-dashboard/medicine-alerts'),
        api.get('/medicines?limit=100').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/doctor-dashboard/today-appointments').catch(() => ({ data: { success: false, data: [] } }))
      ]);
      
      const paymentActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
      const allActivities = [...paymentActivities, ...activityRes.data.data].slice(0, 10);
      const allPayments = JSON.parse(localStorage.getItem('payments') || '[]');
      const localAppointments = JSON.parse(localStorage.getItem('doctor_appointments') || '[]');
      
      const apiStats = statsRes.data.data;
      const apiAppointments = appointmentsRes.data.success ? appointmentsRes.data.data : [];
      
      // Check if API returned meaningful data (not all zeros)
      const hasRealData = (apiStats.total_appointments > 0 || apiStats.active_patients > 0 || apiStats.beds?.available > 0);
      
      const apiMedicines = medicinesRes.data.data;
      const allMedicines = allMedicinesRes.data.success ? allMedicinesRes.data.data : [];
      
      if (!hasRealData) {
        // Use dummy data if API returns zeros
        console.log('API returned zeros, using dummy data');
        setUseDummyData(true);
        setStats(dummyStats);
        setActivities(dummyActivities.length > 0 ? dummyActivities : allActivities);
        setPatients(dummyPatients);
        // Use real medicines from API if available, otherwise use empty array
        setMedicineAlerts(allMedicines.length > 0 ? allMedicines.filter((m: any) => m.stock_quantity < m.reorder_level) : []);
        // Use real appointments from API if available, otherwise use dummy
        setAppointments(apiAppointments.length > 0 ? apiAppointments : dummyAppointments);
      } else {
        console.log('Using real API data');
        setUseDummyData(false);
        const mergedStats = {
          ...apiStats,
          total_appointments: (apiStats.total_appointments || 0) + localAppointments.length
        };
        setStats(mergedStats);
        setActivities(allActivities.length > 0 ? allActivities : dummyActivities);
        // Use real medicines with UUIDs from API
        setMedicineAlerts(allMedicines.length > 0 ? allMedicines.filter((m: any) => m.stock_quantity < m.reorder_level) : apiMedicines || []);
        // Use real appointments from API
        setAppointments(apiAppointments.length > 0 ? apiAppointments : dummyAppointments);
      }
      
      setPaymentsCount(allPayments.length || 156);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use dummy data on error
      setUseDummyData(true);
      setStats(dummyStats);
      setActivities(dummyActivities);
      setPatients(dummyPatients);
      setMedicineAlerts([]);
      setAppointments(dummyAppointments);
      setPaymentsCount(156);
      toast.error('Failed to load dashboard data - showing demo data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/doctor-dashboard/my-patients?limit=10');
      const apiPatients = response.data.data.patients;
      
      // Use API data if available, otherwise use dummy data
      if (apiPatients && apiPatients.length > 0) {
        setPatients(apiPatients);
      } else if (useDummyData || patients.length === 0) {
        setPatients(dummyPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Use dummy data on error
      setPatients(dummyPatients);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, <span className="text-blue-600">Dr. {user?.first_name}</span> 👋
                </h1>
                {useDummyData && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Here's what's happening with your practice today
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                />
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <button 
                onClick={() => setShowAddPatient(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Patient
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <StatCard
                icon={Calendar}
                label="Total Appointments"
                value={stats?.total_appointments || dummyStats.total_appointments}
                trend="+12%"
                trendUp={true}
                color="blue"
                onClick={() => { fetchPatients(); setActiveTab('appointments'); }}
              />
              <StatCard
                icon={Users}
                label="Active Patients"
                value={stats?.active_patients || dummyStats.active_patients}
                trend="+5%"
                trendUp={true}
                color="emerald"
                onClick={() => { fetchPatients(); setActiveTab('patients'); }}
              />
              <StatCard
                icon={BedDouble}
                label="Available Beds"
                value={stats?.beds?.available || dummyStats.beds.available}
                color="purple"
                onClick={() => setActiveTab('beds')}
              />
              <StatCard
                icon={Pill}
                label="Low Stock"
                value={medicineAlerts?.length || 9}
                trend="-3"
                trendUp={false}
                color="rose"
                onClick={() => setActiveTab('medicines')}
              />
              <StatCard
                icon={IndianRupee}
                label="Total Revenue"
                value={254000}
                trend="+8%"
                trendUp={true}
                color="amber"
                onClick={() => setActiveTab('payments')}
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Patient History Chart */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Patient History</h3>
                    <p className="text-gray-500 text-sm">New vs Returning Patients</p>
                  </div>
                  <select className="border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-600">
                    <option>This Year</option>
                    <option>Last Year</option>
                  </select>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patientHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newPatients" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        name="New Patients"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="oldPatients" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 4 }}
                        name="Returning Patients"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="text-sm text-gray-600">New Patients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-sm text-gray-600">Returning Patients</span>
                  </div>
                </div>
              </div>

              {/* Major Conditions Pie Chart */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Major Conditions</h3>
                    <p className="text-gray-500 text-sm">Patient condition distribution</p>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={conditionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {conditionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {conditionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-sm text-gray-600">{item.name}</span>
                      <span className="text-sm text-gray-900 font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Weekly Revenue</h3>
                  <p className="text-gray-500 text-sm">Income vs Expenses</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-sm text-gray-600">Income</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span className="text-sm text-gray-600">Expense</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                    <p className="text-gray-500 text-sm">Latest updates from your practice</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('activity')}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {activities.length > 0 ? (
                    activities.slice(0, 5).map((activity, index) => (
                      <ActivityItem key={index} activity={activity} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickActionButton
                    icon={UserPlus}
                    label="Add Patient"
                    color="emerald"
                    onClick={() => setShowAddPatient(true)}
                  />
                  <QuickActionButton
                    icon={Bed}
                    label="Allocate Bed"
                    color="blue"
                    onClick={() => setShowAllocateBed(true)}
                  />
                  <QuickActionButton
                    icon={CreditCard}
                    label="Payment"
                    color="purple"
                    onClick={() => setShowProcessPayment(true)}
                  />
                  <QuickActionButton
                    icon={Calendar}
                    label="Book Appt"
                    color="cyan"
                    onClick={() => setShowBookAppointment(true)}
                  />
                  <QuickActionButton
                    icon={Brain}
                    label="AI Assistant"
                    color="pink"
                    onClick={() => setShowAISymptomChecker(true)}
                  />
                  <QuickActionButton
                    icon={Pill}
                label="Medicine"
                    color="amber"
                    onClick={() => setShowMedicineOrder(true)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Appointments</h3>
                <p className="text-gray-500 text-sm">Manage your patient appointments</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowBookAppointment(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Book Appointment
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
              <button className="pb-3 border-b-2 border-blue-500 text-blue-600 font-medium">
                All Appointments ({appointments.length || dummyAppointments.length})
              </button>
            </div>

            {/* Appointments Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Patient</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Time</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Date</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Type</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Status</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Symptoms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(appointments.length > 0 ? appointments : dummyAppointments).map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {apt.patient_first_name[0]}{apt.patient_last_name[0]}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">
                              {apt.patient_first_name} {apt.patient_last_name}
                            </span>
                            <span className="text-gray-500 text-sm">{apt.patient_phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900 font-medium">{apt.appointment_time}</td>
                      <td className="py-4 px-4 text-gray-600">
                        {new Date(apt.appointment_date).toLocaleDateString('en-IN', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          apt.type === 'Video' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {apt.type}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          apt.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : apt.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : apt.status === 'confirmed'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{apt.symptoms || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">All Activity</h3>
                <p className="text-gray-500 text-sm">Complete history of your practice activities</p>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No activity found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <ActivityItem key={index} activity={activity} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">My Patients</h3>
                <p className="text-gray-500 text-sm">Manage your patient records</p>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Patient</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Age</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Address</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Bed</th>
                    <th className="text-left py-4 px-4 text-gray-500 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{patient.age}</td>
                      <td className="py-4 px-4 text-gray-600">{patient.city}, {patient.state}</td>
                      <td className="py-4 px-4">
                        {patient.has_bed ? (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            Bed {patient.bed_number}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Beds Tab */}
        {activeTab === 'beds' && (
          <BedManagement
            onBack={() => setActiveTab('overview')}
            onAllocateBed={() => setShowAllocateBed(true)}
          />
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
                <p className="text-gray-500 text-sm">View all payments and transactions</p>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
            <OutstandingPayments />
          </div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Medicine Management</h3>
                <p className="text-gray-500 text-sm">View low stock medicines and manage orders</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMedicineOrder(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Order
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
              <button className="pb-3 border-b-2 border-rose-500 text-rose-600 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Low Stock ({medicineAlerts?.length || 9})
              </button>
            </div>

            {/* Medicine List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {(medicineAlerts?.length > 0 ? medicineAlerts : dummyMedicineAlerts).map((medicine) => (
                <div 
                  key={medicine.id} 
                  className="flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900">{medicine.name}</h4>
                        <span className="text-gray-500 text-sm">({medicine.generic_name})</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-gray-600">
                          Stock: <span className="font-semibold text-rose-600">{medicine.stock} units</span>
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">
                          Min: {medicine.min_quantity}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-rose-600 font-semibold">
                          Shortage: {medicine.shortage}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMedicineOrder(true)}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Order Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        {showAddPatient && (
          <AddPatientModal
            onClose={() => setShowAddPatient(false)}
            onSuccess={() => {
              setShowAddPatient(false);
              fetchDashboardData();
              toast.success('Patient added successfully!');
            }}
          />
        )}

        {showAllocateBed && (
          <AllocateBedModal
            onClose={() => setShowAllocateBed(false)}
            onSuccess={() => {
              setShowAllocateBed(false);
              fetchDashboardData();
              toast.success('Bed allocated successfully!');
            }}
          />
        )}

        {showMedicineOrder && (
          <MedicineOrderModal
            onClose={() => setShowMedicineOrder(false)}
            lowStockMedicines={medicineAlerts}
            onSuccess={() => {
              fetchDashboardData();
              toast.success('Order placed successfully!');
            }}
          />
        )}

        {showBookAppointment && (
          <BookAppointmentModal
            onClose={() => setShowBookAppointment(false)}
            onSuccess={() => {
              setShowBookAppointment(false);
              fetchDashboardData();
              toast.success('Appointment booked successfully!');
            }}
          />
        )}

        {showProcessPayment && (
          <ProcessPaymentModal
            onClose={() => setShowProcessPayment(false)}
            onSuccess={() => {
              setShowProcessPayment(false);
              fetchDashboardData();
            }}
          />
        )}

        {showAISymptomChecker && (
          <AISymptomChecker
            onClose={() => setShowAISymptomChecker(false)}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
