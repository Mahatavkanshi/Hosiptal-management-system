import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Calendar, Users, BedDouble, Pill, Plus, UserPlus, CreditCard, Activity, Clock, Bed, IndianRupee, User, Brain } from 'lucide-react';
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

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [medicineAlerts, setMedicineAlerts] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsRes, appointmentsRes, activityRes, medicinesRes] = await Promise.all([
        api.get('/doctor-dashboard/dashboard-stats'),
        api.get('/doctor-dashboard/today-appointments'),
        api.get('/doctor-dashboard/activity?limit=5'),
        api.get('/doctor-dashboard/medicine-alerts')
      ]);
      
      // Get payment activities from localStorage
      const paymentActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
      
      // Merge regular activities with payment activities
      const allActivities = [...paymentActivities, ...activityRes.data.data].slice(0, 10);
      
      // Get payment history from localStorage
      const doctorPayments = JSON.parse(localStorage.getItem('doctor_payments') || '[]');
      
      // Get doctor appointments from localStorage (for appointments not yet in DB)
      const localAppointments = JSON.parse(localStorage.getItem('doctor_appointments') || '[]');
      
      // Merge stats with localStorage appointments
      const apiStats = statsRes.data.data;
      const mergedStats = {
        ...apiStats,
        total_appointments: apiStats.total_appointments + localAppointments.length
      };
      
      setStats(mergedStats);
      setTodayAppointments(appointmentsRes.data.data);
      setActivities(allActivities);
      setMedicineAlerts(medicinesRes.data.data);
      setPaymentHistory(doctorPayments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await api.get('/doctor-dashboard/my-patients?limit=10');
      setPatients(response.data.data.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const formatTime = (time: string) => {
    return time?.substring(0, 5) || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-4xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Welcome back, {user?.first_name}! 👋
        </h1>
        <p className={`mt-3 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Here's what's happening with your patients today.
        </p>
      </div>

      {/* Stats Cards - Enhanced Highlighting */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Appointments */}
        <div 
          className={`rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
            isDark 
              ? 'bg-slate-800 border-blue-500/30 hover:border-blue-400 shadow-lg shadow-blue-500/10' 
              : 'bg-white border-blue-100 hover:border-blue-300 shadow-lg hover:shadow-blue-200/50'
          }`}
          onClick={() => {
            fetchPatients();
            setActiveTab('appointments');
          }}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Calendar className={`h-7 w-7 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Total Appointments</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.total_appointments || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-base">
            <span className="text-green-500 font-bold">+12%</span>
            <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>from last month</span>
          </div>
        </div>

        {/* Active Patients */}
        <div 
          className={`rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
            isDark 
              ? 'bg-slate-800 border-emerald-500/30 hover:border-emerald-400 shadow-lg shadow-emerald-500/10' 
              : 'bg-white border-emerald-100 hover:border-emerald-300 shadow-lg hover:shadow-emerald-200/50'
          }`}
          onClick={() => {
            fetchPatients();
            setActiveTab('patients');
          }}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <Users className={`h-7 w-7 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Active Patients</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.active_patients || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-base">
            <span className="text-emerald-500 font-bold">+5%</span>
            <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>this month</span>
          </div>
        </div>

        {/* Available Beds */}
        <div 
          className={`rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
            isDark 
              ? 'bg-slate-800 border-cyan-500/30 hover:border-cyan-400 shadow-lg shadow-cyan-500/10' 
              : 'bg-white border-cyan-100 hover:border-cyan-300 shadow-lg hover:shadow-cyan-200/50'
          }`}
          onClick={() => setActiveTab('beds')}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
              <BedDouble className={`h-7 w-7 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Available Beds</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats?.beds?.available || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-base">
            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stats?.beds?.occupied || 0} occupied</span>
          </div>
        </div>

        {/* Medicine Alerts */}
        <div 
          className={`rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
            isDark 
              ? 'bg-slate-800 border-amber-500/30 hover:border-amber-400 shadow-lg shadow-amber-500/10' 
              : 'bg-white border-amber-100 hover:border-amber-300 shadow-lg hover:shadow-amber-200/50'
          }`}
          onClick={() => setShowMedicineOrder(true)}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <Pill className={`h-7 w-7 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Low Stock Alerts</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{medicineAlerts?.length || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-base">
            <span className="text-rose-500 font-bold">Needs attention</span>
          </div>
        </div>

        {/* Payment History */}
        <div 
          className={`rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-2xl ${
            isDark 
              ? 'bg-slate-800 border-purple-500/30 hover:border-purple-400 shadow-lg shadow-purple-500/10' 
              : 'bg-white border-purple-100 hover:border-purple-300 shadow-lg hover:shadow-purple-200/50'
          }`}
          onClick={() => setActiveTab('payments')}
        >
          <div className="flex items-center">
            <div className={`p-4 rounded-full ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <IndianRupee className={`h-7 w-7 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-base font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Payment History</p>
              <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{paymentHistory?.length || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-base">
            <span className="text-purple-500 font-bold">View payments</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity - Enhanced */}
            <div className={`rounded-xl border-2 shadow-lg overflow-hidden ${
              isDark 
                ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' 
                : 'bg-white border-gray-200 shadow-gray-200/50'
            }`}>
              <div className={`px-6 py-5 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Activity className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-xl font-bold ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-5">
                  {activities.map((activity, index) => (
                    <div key={index} className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 ${
                      isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                    }`}>
                      {activity.type === 'payment' ? (
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                          isDark ? 'bg-emerald-500/20 shadow-emerald-500/20' : 'bg-emerald-100 shadow-emerald-200/50'
                        }`}>
                          <IndianRupee className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                      ) : activity.type === 'patient_added' ? (
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                          isDark ? 'bg-blue-500/20 shadow-blue-500/20' : 'bg-blue-100 shadow-blue-200/50'
                        }`}>
                          <User className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                      ) : activity.type === 'bed_allocated' ? (
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                          isDark ? 'bg-purple-500/20 shadow-purple-500/20' : 'bg-purple-100 shadow-purple-200/50'
                        }`}>
                          <Bed className={`h-5 w-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                      ) : activity.type === 'appointment' ? (
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                          isDark ? 'bg-indigo-500/20 shadow-indigo-500/20' : 'bg-indigo-100 shadow-indigo-200/50'
                        }`}>
                          <Calendar className={`h-5 w-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        </div>
                      ) : (
                        <div className={`w-3 h-3 rounded-full mt-2 shadow-lg ${isDark ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-emerald-500 shadow-emerald-500/30'}`} />
                      )}
                      <div className="flex-1">
                        <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{activity.description}</p>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{activity.patient_name}</p>
                        {activity.amount && (
                          <p className={`text-sm font-bold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            ₹{activity.amount.toLocaleString()}
                          </p>
                        )}
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {activity.created_at}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today's Appointments - Enhanced */}
            <div className={`rounded-xl border-2 shadow-lg overflow-hidden ${
              isDark 
                ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' 
                : 'bg-white border-gray-200 shadow-gray-200/50'
            }`}>
              <div className={`px-6 py-5 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                      <Clock className={`h-6 w-6 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    </div>
                    <h3 className={`text-xl font-bold ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Today's Appointments</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {todayAppointments.length} total
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {todayAppointments.map((apt) => (
                    <div key={apt.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                      isDark 
                        ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500' 
                        : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {apt.patient_first_name} {apt.patient_last_name}
                          </p>
                          <span className={`ml-3 px-3 py-1 text-sm rounded-full font-semibold border ${
                            apt.status === 'completed' 
                              ? (isDark ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-800') 
                              : apt.status === 'in_progress' 
                                ? (isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-blue-100 border-blue-200 text-blue-800')
                                : (isDark ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-800')
                          }`}>
                            {apt.status}
                          </span>
                          {apt.id?.startsWith('apt-') && (
                            <span className={`ml-2 px-2 py-0.5 text-sm rounded-full font-semibold border ${
                              isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-100 border-purple-200 text-purple-800'
                            }`}>
                              Demo
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {apt.patient_age} years • {apt.city}, {apt.state}
                        </p>
                        {apt.symptoms && (
                          <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Symptoms: {apt.symptoms}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatTime(apt.appointment_time)}
                        </p>
                        <p className={`text-sm capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{apt.type}</p>
                      </div>
                    </div>
                  ))}
                  {todayAppointments.length === 0 && (
                    <p className={`text-center py-4 text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No appointments today</p>
                  )}
                </div>
              </div>
            </div>

            {/* Outstanding Payments */}
            <OutstandingPayments />
          </div>

          {/* Quick Actions - Enhanced with Better Highlighting */}
          <div>
            <h3 className={`text-2xl font-black mb-6 ${isDark ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setShowAddPatient(true)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
                    : 'bg-gradient-to-br from-white to-emerald-50 border-emerald-300 hover:border-emerald-500 shadow-lg hover:shadow-emerald-200/80 shadow-emerald-100/50'
                }`}
              >
                <div className={`p-4 rounded-full mb-3 shadow-lg ${isDark ? 'bg-emerald-500/30 shadow-emerald-500/40' : 'bg-emerald-100 shadow-emerald-200/50'}`}>
                  <UserPlus className={`h-8 w-8 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
                </div>
                <span className={`text-base font-black ${isDark ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>Add Patient</span>
              </button>

              <button 
                onClick={() => setShowAllocateBed(true)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-blue-500/50 hover:border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]' 
                    : 'bg-gradient-to-br from-white to-blue-50 border-blue-300 hover:border-blue-500 shadow-lg hover:shadow-blue-200/80 shadow-blue-100/50'
                }`}
              >
                <div className={`p-4 rounded-full mb-3 shadow-lg ${isDark ? 'bg-blue-500/30 shadow-blue-500/40' : 'bg-blue-100 shadow-blue-200/50'}`}>
                  <Bed className={`h-8 w-8 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                </div>
                <span className={`text-base font-black ${isDark ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>Allocate Bed</span>
              </button>

              <button 
                onClick={() => setShowProcessPayment(true)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-purple-500/50 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]' 
                    : 'bg-gradient-to-br from-white to-purple-50 border-purple-300 hover:border-purple-500 shadow-lg hover:shadow-purple-200/80 shadow-purple-100/50'
                }`}
              >
                <div className={`p-4 rounded-full mb-3 shadow-lg ${isDark ? 'bg-purple-500/30 shadow-purple-500/40' : 'bg-purple-100 shadow-purple-200/50'}`}>
                  <CreditCard className={`h-8 w-8 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                </div>
                <span className={`text-base font-black ${isDark ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>Process Payment</span>
              </button>

              <button 
                onClick={() => setShowBookAppointment(true)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]' 
                    : 'bg-gradient-to-br from-white to-cyan-50 border-cyan-300 hover:border-cyan-500 shadow-lg hover:shadow-cyan-200/80 shadow-cyan-100/50'
                }`}
              >
                <div className={`p-4 rounded-full mb-3 shadow-lg ${isDark ? 'bg-cyan-500/30 shadow-cyan-500/40' : 'bg-cyan-100 shadow-cyan-200/50'}`}>
                  <Plus className={`h-8 w-8 ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`} />
                </div>
                <span className={`text-base font-black ${isDark ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>Book Appointment</span>
              </button>

              <button 
                onClick={() => setShowAISymptomChecker(true)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-pink-500/50 hover:border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]' 
                    : 'bg-gradient-to-br from-white to-pink-50 border-pink-300 hover:border-pink-500 shadow-lg hover:shadow-pink-200/80 shadow-pink-100/50'
                }`}
              >
                <div className={`p-4 rounded-full mb-3 shadow-lg ${isDark ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 shadow-purple-500/40' : 'bg-gradient-to-r from-blue-100 to-purple-100 shadow-purple-200/50'}`}>
                  <Brain className={`h-8 w-8 ${isDark ? 'text-pink-300' : 'text-purple-600'}`} />
                </div>
                <span className={`text-base font-black ${isDark ? 'text-white drop-shadow-md' : 'text-gray-900'}`}>AI Assistant</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className={`rounded-xl border-2 shadow-lg overflow-hidden ${
          isDark 
            ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' 
            : 'bg-white border-gray-200 shadow-gray-200/50'
        }`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Users className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>My Patients</h3>
              </div>
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  isDark 
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                ← Back
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                <thead className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Patient</th>
                    <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Age</th>
                    <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Address</th>
                    <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bed</th>
                    <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-700 bg-slate-800' : 'divide-gray-200 bg-white'}`}>
                  {patients.map((patient) => (
                    <tr key={patient.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                            <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{patient.blood_group}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {patient.age} years
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {patient.address}, {patient.city}, {patient.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {patient.has_bed ? (
                          <span className="text-emerald-500">
                            {patient.bed_number} ({patient.ward_type})
                          </span>
                        ) : (
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Not allocated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.has_bed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {patient.has_bed ? 'Admitted' : 'Outpatient'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Payment History Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              <button 
                onClick={() => setActiveTab('overview')}
                className="text-primary-600 hover:text-primary-700"
              >
                ← Back
              </button>
            </div>
          </div>
          <div className="p-6">
            {paymentHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No payment history found</p>
            ) : (
              <div className="space-y-4">
                {paymentHistory.map((payment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">Receipt #{payment.receipt_number}</p>
                        <p className="text-sm text-gray-500">{new Date(payment.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xl font-bold text-green-600">₹{payment.amount}</span>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Items:</p>
                      <div className="space-y-1">
                        {payment.fee_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.description}</span>
                            <span className="text-gray-900">₹{item.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          onSuccess={(appointment) => {
            console.log('✅ Appointment booked:', appointment);
            setShowBookAppointment(false);
            
            if (!appointment) {
              toast.error('Failed to book appointment');
              return;
            }
            
            // Refresh dashboard data to get the latest appointments from database
            fetchDashboardData();
            
            toast.success('Appointment booked and payment collected successfully!');
          }}
        />
      )}

      {showProcessPayment && (
        <ProcessPaymentModal
          onClose={() => setShowProcessPayment(false)}
          onSuccess={() => {
            setShowProcessPayment(false);
            fetchDashboardData();
            toast.success('Payment processed successfully!');
          }}
        />
      )}

      {showAISymptomChecker && (
        <AISymptomChecker
          onClose={() => setShowAISymptomChecker(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
