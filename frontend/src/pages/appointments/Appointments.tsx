import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeWrapper from '../../components/theme/ThemeWrapper';
import { Calendar, Clock, Users, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_age?: number;
  patient_phone: string;
  address: string;
  city: string;
  state: string;
  appointment_time: string;
  appointment_date: string;
  status: string;
  type: string;
  symptoms?: string;
  date_of_birth?: string;
}

const Appointments = () => {
  const { isDark, cardColors, textPrimary, textSecondary, textTertiary } = useTheme();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Fetch today's appointments
      const todayRes = await api.get('/doctor-dashboard/today-appointments');
      setTodayAppointments(todayRes.data.data);
      
      // Fetch all appointments for upcoming
      const allRes = await api.get('/appointments');
      const today = new Date().toISOString().split('T')[0];
      
      // Filter upcoming appointments (future dates, not today)
      const upcoming = allRes.data.data.filter((apt: Appointment) => {
        const aptDate = apt.appointment_date || apt.appointment_time?.split('T')[0];
        return aptDate && aptDate > today;
      });
      
      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string }> = {
      completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
      confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
      cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    };
    return configs[status] || configs.pending;
  };

  const AppointmentItem = ({ apt }: { apt: Appointment }) => {
    const status = getStatusConfig(apt.status);
    const displayTime = apt.appointment_time?.substring(0, 5) || 'TBD';
    const displayDate = apt.appointment_date 
      ? new Date(apt.appointment_date).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        })
      : '';
    
    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl hover:bg-white/10 transition-colors group border border-transparent hover:border-slate-600/30 ${cardColors.glassBg || 'bg-white/5'}`}>
        {/* Time & Date */}
        <div className="flex-shrink-0 text-center min-w-[80px]">
          <p className={`${textPrimary} font-bold text-lg`}>{displayTime}</p>
          {activeTab === 'upcoming' && displayDate && (
            <p className={`${textTertiary} text-xs mt-1`}>{displayDate}</p>
          )}
          <p className={`${textTertiary} text-xs uppercase mt-1`}>{apt.type}</p>
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
          <p className={`${textSecondary} text-sm`}>
            {apt.patient_age 
              ? `${apt.patient_age} years` 
              : apt.date_of_birth 
                ? `${Math.floor((new Date().getTime() - new Date(apt.date_of_birth).getTime()) / 31557600000)} years`
                : 'Age unknown'
            } • {apt.city || 'N/A'}
          </p>
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

  const currentAppointments = activeTab === 'today' ? todayAppointments : upcomingAppointments;

  return (
    <ThemeWrapper>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary}`}>
              Appointments
            </h1>
            <p className={`${textTertiary} mt-1`}>
              Manage your patient appointments
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className={`p-6 rounded-2xl ${cardColors.glassBg || 'bg-white/5'} backdrop-blur-xl border ${cardColors.border}`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className={`${textTertiary} text-sm`}>Today's Appointments</p>
                <p className={`${textPrimary} text-2xl font-bold`}>{todayAppointments.length}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl ${cardColors.glassBg || 'bg-white/5'} backdrop-blur-xl border ${cardColors.border}`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className={`${textTertiary} text-sm`}>Upcoming</p>
                <p className={`${textPrimary} text-2xl font-bold`}>{upcomingAppointments.length}</p>
              </div>
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl ${cardColors.glassBg || 'bg-white/5'} backdrop-blur-xl border ${cardColors.border}`}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className={`${textTertiary} text-sm`}>Total Patients</p>
                <p className={`${textPrimary} text-2xl font-bold`}>
                  {new Set([...todayAppointments, ...upcomingAppointments].map(a => a.patient_first_name + a.patient_last_name)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex items-center gap-2 mb-6 p-1 rounded-xl ${cardColors.inputBg || 'bg-white/5'} w-fit`}>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'today'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : `${textSecondary} hover:${textPrimary}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today's Appointments
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {todayAppointments.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'upcoming'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : `${textSecondary} hover:${textPrimary}`
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {upcomingAppointments.length}
              </span>
            </div>
          </button>
        </div>

        {/* Appointments List */}
        <div className={`rounded-2xl ${cardColors.glassBg || 'bg-white/5'} backdrop-blur-xl border ${cardColors.border} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${textPrimary}`}>
              {activeTab === 'today' ? "Today's Schedule" : 'Upcoming Appointments'}
            </h2>
            <button className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${textTertiary}`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-blue-500 animate-spin" />
            </div>
          ) : currentAppointments.length > 0 ? (
            <div className="space-y-3">
              {currentAppointments.map((apt) => (
                <AppointmentItem key={apt.id} apt={apt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl ${cardColors.inputBg || 'bg-white/5'} flex items-center justify-center`}>
                <Calendar className="w-10 h-10 text-white/30" />
              </div>
              <p className={`${textTertiary}`}>
                {activeTab === 'today' 
                  ? 'No appointments scheduled for today'
                  : 'No upcoming appointments'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default Appointments;
