import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Calendar, Users, BedDouble, Pill, Plus, UserPlus, CreditCard, 
  Activity, Clock, Bed, IndianRupee, User, Brain,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Filter
} from 'lucide-react';
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

// Premium Glass Card Component with theme support
const GlassCard = ({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  glowColor = 'blue',
  onClick
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
  onClick?: () => void;
}) => {
  const { cardColors } = useTheme();
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-3xl 
        backdrop-blur-xl 
        ${cardColors.bg} ${cardColors.border} shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        border 
        ${hover 
          ? `${cardColors.hover} hover:border-opacity-80 transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]` 
          : ''
        }
        ${glow ? `shadow-[0_0_40px_rgba(var(--glow-color),0.15)]` : ''}
        ${className}
      `}
      style={glow ? { '--glow-color': glowColor === 'blue' ? '59,130,246' : glowColor === 'emerald' ? '16,185,129' : glowColor === 'purple' ? '168,85,247' : '59,130,246' } as React.CSSProperties : undefined}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
      
      {/* Corner glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Premium Stat Card with theme support
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
  value: number | string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  onClick?: () => void;
}) => {
  const colorClasses: Record<string, { bg: string; text: string; glow: string }> = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
    rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', glow: 'shadow-rose-500/30' },
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const textPrimary = 'text-white';
  const textSecondary = 'text-white/60';

  return (
    <GlassCard 
      className={`p-6 ${onClick ? 'cursor-pointer' : ''}`} 
      hover={!!onClick}
      glow={true}
      glowColor={color}
      
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colors.bg} shadow-lg ${colors.glow}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {trend}
          </div>
        )}
      </div>
      
      <div>
        <p className={`${textSecondary} text-sm font-medium mb-1`}>{label}</p>
        <p className={`text-3xl font-bold ${textPrimary} tracking-tight`}>{value}</p>
      </div>
    </GlassCard>
  );
};

// Activity Item Component with theme support
const ActivityItem = ({ activity }: { activity: Activity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'payment':
        return { icon: IndianRupee, color: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      case 'patient_added':
        return { icon: User, color: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400' };
      case 'bed_allocated':
        return { icon: Bed, color: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-400' };
      case 'appointment':
        return { icon: Calendar, color: 'cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400' };
      default:
        return { icon: Activity, color: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-400' };
    }
  };

  const { icon: Icon, bg, text } = getIcon();
  const textPrimary = 'text-white';
  const textSecondary = 'text-white/50';
  const textTertiary = 'text-white/40';
  const hoverBg = 'hover:bg-white/10';

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl ${hoverBg} transition-colors group`}>
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${bg} flex items-center justify-center shadow-lg`}>
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`${textPrimary} font-medium truncate`}>{activity.description}</p>
        <p className={`${textSecondary} text-sm mt-0.5`}>{activity.patient_name}</p>
        
        <div className="flex items-center gap-3 mt-2">
          {activity.amount && (
            <span className="text-emerald-400 font-semibold text-sm">
              ₹{activity.amount.toLocaleString()}
            </span>
          )}
          <span className={`${textTertiary} text-xs`}>{activity.created_at}</span>
        </div>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal className={`w-5 h-5 ${textTertiary}`} />
      </div>
    </div>
  );
};

// Appointment Item Component with theme support
const AppointmentItem = ({ apt }: { apt: Appointment }) => {
  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  };

  const status = statusConfig[apt.status] || statusConfig.pending;
  const textPrimary = 'text-white';
  const textSecondary = 'text-white/50';
  const textTertiary = 'text-white/40';
  const hoverBg = 'hover:bg-white/10';
  const borderHover = 'hover:border-slate-600/30';

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl ${hoverBg} transition-colors group border border-transparent ${borderHover}`}>
      {/* Time */}
      <div className="flex-shrink-0 text-center min-w-[60px]">
        <p className={`${textPrimary} font-bold text-lg`}>{apt.appointment_time?.substring(0, 5)}</p>
        <p className={`${textTertiary} text-xs uppercase`}>{apt.type}</p>
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      {/* Patient Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={`${textPrimary} font-semibold truncate`}>
            {apt.patient_first_name} {apt.patient_last_name}
          </p>
          {apt.id?.startsWith('apt-') && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Demo
            </span>
          )}
        </div>
        <p className={`${textSecondary} text-sm`}>{apt.patient_age} years • {apt.city}</p>
        {apt.symptoms && (
          <p className={`${textTertiary} text-xs mt-1`}>Symptoms: {apt.symptoms}</p>
        )}
      </div>

      {/* Status */}
      <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
        {apt.status}
      </div>
    </div>
  );
};

// Quick Action Button with theme support
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
  const { cardColors } = useTheme();
  const colorClasses: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    emerald: { 
      bg: 'bg-emerald-500/10', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/30',
      glow: 'hover:shadow-emerald-500/20'
    },
    blue: { 
      bg: 'bg-blue-500/10', 
      text: 'text-blue-400', 
      border: 'border-blue-500/30',
      glow: 'hover:shadow-blue-500/20'
    },
    purple: { 
      bg: 'bg-purple-500/10', 
      text: 'text-purple-400', 
      border: 'border-purple-500/30',
      glow: 'hover:shadow-purple-500/20'
    },
    cyan: { 
      bg: 'bg-cyan-500/10', 
      text: 'text-cyan-400', 
      border: 'border-cyan-500/30',
      glow: 'hover:shadow-cyan-500/20'
    },
    pink: { 
      bg: 'bg-pink-500/10', 
      text: 'text-pink-400', 
      border: 'border-pink-500/30',
      glow: 'hover:shadow-pink-500/20'
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <button
      onClick={onClick}
      className={`
        relative group p-6 rounded-3xl
        ${cardColors.bg} backdrop-blur-xl
        border ${colors.border}
        transition-all duration-500
        ${cardColors.hover} hover:scale-105
        hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        ${colors.glow}
      `}
    >
      {/* Glow effect on hover */}
      <div className={`
        absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-gradient-to-br ${colors.bg} to-transparent blur-xl
      `} />
      
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className={`
          p-4 rounded-2xl ${colors.bg} ${colors.text}
          shadow-lg transition-transform duration-500 group-hover:scale-110
        `}>
          <Icon className="w-7 h-7" />
        </div>
        <span className={`font-semibold ${colors.text}`}>{label}</span>
      </div>
    </button>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

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
      
      const [statsRes, appointmentsRes, activityRes, medicinesRes] = await Promise.all([
        api.get('/doctor-dashboard/dashboard-stats'),
        api.get('/doctor-dashboard/today-appointments'),
        api.get('/doctor-dashboard/activity?limit=5'),
        api.get('/doctor-dashboard/medicine-alerts')
      ]);
      
      const paymentActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
      const allActivities = [...paymentActivities, ...activityRes.data.data].slice(0, 10);
      const doctorPayments = JSON.parse(localStorage.getItem('doctor_payments') || '[]');
      const localAppointments = JSON.parse(localStorage.getItem('doctor_appointments') || '[]');
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  const textPrimary = 'text-white';
  const textSecondary = 'text-white/60';
  const textTertiary = 'text-white/50';

  return (
    <div className="min-h-screen pb-12">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-bold ${textPrimary} mb-2`}>
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user?.first_name}</span> 👋
            </h1>
            <p className={`${textTertiary} text-lg`}>
              Here's what's happening with your patients today
            </p>
          </div>
          
          <button 
            onClick={() => setShowAddPatient(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white
              bg-gradient-to-r from-blue-500 to-purple-500
              hover:from-blue-400 hover:to-purple-400
              shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
              transition-all duration-300 hover:scale-105"
          >
            <UserPlus className="w-5 h-5" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <StatCard
          icon={Calendar}
          label="Total Appointments"
          value={stats?.total_appointments || 0}
          trend="+12%"
          trendUp={true}
          color="blue"
          
          onClick={() => { fetchPatients(); setActiveTab('appointments'); }}
        />
        <StatCard
          icon={Users}
          label="Active Patients"
          value={stats?.active_patients || 0}
          trend="+5%"
          trendUp={true}
          color="emerald"
          
          onClick={() => { fetchPatients(); setActiveTab('patients'); }}
        />
        <StatCard
          icon={BedDouble}
          label="Available Beds"
          value={stats?.beds?.available || 0}
          color="cyan"
          
          onClick={() => setActiveTab('beds')}
        />
        <StatCard
          icon={Pill}
          label="Low Stock"
          value={medicineAlerts?.length || 0}
          color="amber"
          
          onClick={() => setShowMedicineOrder(true)}
        />
        <StatCard
          icon={IndianRupee}
          label="Payments"
          value={paymentHistory?.length || 0}
          color="purple"
          
          onClick={() => setActiveTab('payments')}
        />
      </div>

      {/* Main Content Grid */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <GlassCard className="p-6" glow={true} glowColor="blue" >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${textPrimary}`}>Recent Activity</h3>
                  <p className={`${textTertiary} text-sm opacity-70`}>Latest updates from your practice</p>
                </div>
              </div>
              <button className={`p-2 rounded-xl ${'hover:bg-white/10'} transition-colors`}>
                <Filter className={`w-5 h-5 ${textTertiary} opacity-60`} />
              </button>
            </div>

            <div className="space-y-2">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <ActivityItem key={index} activity={activity}  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${'bg-slate-800/50'} flex items-center justify-center`}>
                    <Activity className={`w-8 h-8 ${textTertiary} opacity-30`} />
                  </div>
                  <p className={`${textTertiary} opacity-60`}>No recent activity</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Today's Appointments */}
          <GlassCard className="p-6" glow={true} glowColor="purple" >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${textPrimary}`}>Today's Appointments</h3>
                  <p className={`${textTertiary} text-sm opacity-70`}>{todayAppointments.length} scheduled today</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full ${'bg-slate-800/50'} ${textSecondary} text-sm font-medium`}>
                {todayAppointments.length} total
              </span>
            </div>

            <div className="space-y-2">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt) => (
                  <AppointmentItem key={apt.id} apt={apt}  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${'bg-slate-800/50'} flex items-center justify-center`}>
                    <Calendar className={`w-8 h-8 ${textTertiary} opacity-30`} />
                  </div>
                  <p className={`${textTertiary} opacity-60`}>No appointments today</p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Payment History Preview */}
          <OutstandingPayments />
        </div>
      )}

      {/* Quick Actions */}
      {activeTab === 'overview' && (
        <div className="mt-8">
          <h3 className={`text-2xl font-bold ${textPrimary} mb-6`}>Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              label="Process Payment"
              color="purple"
              
              onClick={() => setShowProcessPayment(true)}
            />
            <QuickActionButton
              icon={Plus}
              label="Book Appointment"
              color="cyan"
              
              onClick={() => setShowBookAppointment(true)}
            />
            <QuickActionButton
              icon={Brain}
              label="AI Assistant"
              color="pink"
              
              onClick={() => setShowAISymptomChecker(true)}
            />
          </div>
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <GlassCard className="p-6" >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className={`text-xl font-bold ${textPrimary}`}>My Patients</h3>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl ${'bg-slate-800/50'} ${textSecondary} hover:${'bg-slate-800/70'} transition-colors`}
            >
              ← Back
            </button>
          </div>
          
          {/* Patients Table - Premium Version */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${'border-slate-700/30'}`}>
                  <th className={`text-left py-4 px-4 ${textSecondary} text-sm font-medium opacity-60`}>Patient</th>
                  <th className={`text-left py-4 px-4 ${textSecondary} text-sm font-medium opacity-60`}>Age</th>
                  <th className={`text-left py-4 px-4 ${textSecondary} text-sm font-medium opacity-60`}>Address</th>
                  <th className={`text-left py-4 px-4 ${textSecondary} text-sm font-medium opacity-60`}>Bed</th>
                  <th className={`text-left py-4 px-4 ${textSecondary} text-sm font-medium opacity-60`}>Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${'divide-slate-700/20'}`}>
                {patients.map((patient) => (
                  <tr key={patient.id} className={`${'hover:bg-white/10'} transition-colors`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                          <span className={`${textPrimary} font-bold text-sm`}>
                            {patient.first_name[0]}{patient.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className={`${textPrimary} font-medium`}>{patient.first_name} {patient.last_name}</p>
                          <p className={`${textTertiary} text-sm opacity-60`}>{patient.blood_group}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-4 px-4 ${textPrimary}`}>{patient.age} years</td>
                    <td className="py-4 px-4">
                      <p className={`${textTertiary} opacity-80`}>{patient.address}</p>
                      <p className={`${textTertiary} text-sm opacity-60`}>{patient.city}, {patient.state}</p>
                    </td>
                    <td className="py-4 px-4">
                      {patient.has_bed ? (
                        <span className="text-emerald-400 font-medium">{patient.bed_number}</span>
                      ) : (
                        <span className={`${textTertiary} opacity-40`}>Not allocated</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        patient.has_bed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : `${'bg-slate-800/50'} ${textTertiary} opacity-60 ${'border-slate-700/30'}`
                      }`}>
                        {patient.has_bed ? 'Admitted' : 'Outpatient'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
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
        <GlassCard className="p-6" >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className={`text-xl font-bold ${textPrimary}`}>Payment History</h3>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl ${'bg-slate-800/50'} ${textSecondary} hover:${'bg-slate-800/70'} transition-colors`}
            >
              ← Back
            </button>
          </div>
          
          {paymentHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${'bg-slate-800/50'} flex items-center justify-center`}>
                <CreditCard className={`w-8 h-8 ${textTertiary} opacity-30`} />
              </div>
              <p className={`${textTertiary} opacity-60`}>No payment history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentHistory.map((payment, index) => (
                <div 
                  key={index} 
                  className={`p-5 rounded-2xl ${'bg-slate-800/50'} border ${'border-slate-700/30'} hover:${'bg-slate-800/70'} transition-colors`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className={`${textPrimary} font-bold text-lg`}>Receipt #{payment.receipt_number}</p>
                      <p className={`${textTertiary} text-sm mt-1 opacity-60`}>{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">₹{payment.amount}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {payment.fee_items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className={`${textTertiary} opacity-70`}>{item.description}</span>
                        <span className={`${textPrimary} font-medium`}>₹{item.amount}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`pt-4 border-t ${'border-slate-700/30'}`}>
                    <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
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