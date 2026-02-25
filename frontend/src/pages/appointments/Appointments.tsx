import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeWrapper from '../../components/theme/ThemeWrapper';
import { Calendar, Clock, Stethoscope, Filter } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface Appointment {
  id: string;
  doctor_first_name: string;
  doctor_last_name: string;
  doctor_specialization: string;
  doctor_department: string;
  appointment_time: string;
  appointment_date: string;
  status: string;
  type: string;
  symptoms?: string;
  consultation_fee?: number;
}

// Current patient (logged in user)
const currentPatient = {
  first_name: 'John',
  last_name: 'Doe',
  age: 45,
  city: 'Mumbai'
};

// Dummy appointments data - Same patient with different doctors
const dummyTodayAppointments: Appointment[] = [
  {
    id: 'apt-1',
    doctor_first_name: 'Dr. Sarah',
    doctor_last_name: 'Johnson',
    doctor_specialization: 'Cardiologist',
    doctor_department: 'Cardiology',
    appointment_time: '09:30',
    appointment_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    type: 'In Person',
    symptoms: 'Heart checkup, routine monitoring',
    consultation_fee: 1500
  },
  {
    id: 'apt-2',
    doctor_first_name: 'Dr. Michael',
    doctor_last_name: 'Chen',
    doctor_specialization: 'General Physician',
    doctor_department: 'General Medicine',
    appointment_time: '10:00',
    appointment_date: new Date().toISOString().split('T')[0],
    status: 'in_progress',
    type: 'Video',
    symptoms: 'Fever, headache, body ache',
    consultation_fee: 800
  },
  {
    id: 'apt-3',
    doctor_first_name: 'Dr. Emily',
    doctor_last_name: 'Davis',
    doctor_specialization: 'Dermatologist',
    doctor_department: 'Dermatology',
    appointment_time: '11:30',
    appointment_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    type: 'In Person',
    symptoms: 'Skin rash, itching',
    consultation_fee: 1200
  },
  {
    id: 'apt-4',
    doctor_first_name: 'Dr. Robert',
    doctor_last_name: 'Wilson',
    doctor_specialization: 'Orthopedic Surgeon',
    doctor_department: 'Orthopedics',
    appointment_time: '14:00',
    appointment_date: new Date().toISOString().split('T')[0],
    status: 'confirmed',
    type: 'In Person',
    symptoms: 'Back pain, knee pain',
    consultation_fee: 1800
  },
  {
    id: 'apt-5',
    doctor_first_name: 'Dr. Lisa',
    doctor_last_name: 'Anderson',
    doctor_specialization: 'Pediatrician',
    doctor_department: 'Pediatrics',
    appointment_time: '15:30',
    appointment_date: new Date().toISOString().split('T')[0],
    status: 'confirmed',
    type: 'Video',
    symptoms: 'Regular health checkup',
    consultation_fee: 1000
  }
];

const dummyUpcomingAppointments: Appointment[] = [
  {
    id: 'apt-6',
    doctor_first_name: 'Dr. David',
    doctor_last_name: 'Miller',
    doctor_specialization: 'Neurologist',
    doctor_department: 'Neurology',
    appointment_time: '09:00',
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'confirmed',
    type: 'In Person',
    symptoms: 'Headache, migraine',
    consultation_fee: 2000
  },
  {
    id: 'apt-7',
    doctor_first_name: 'Dr. Jennifer',
    doctor_last_name: 'Wilson',
    doctor_specialization: 'Gynecologist',
    doctor_department: 'Gynecology',
    appointment_time: '10:30',
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'confirmed',
    type: 'In Person',
    symptoms: 'Regular checkup',
    consultation_fee: 1500
  },
  {
    id: 'apt-8',
    doctor_first_name: 'Dr. James',
    doctor_last_name: 'Taylor',
    doctor_specialization: 'ENT Specialist',
    doctor_department: 'ENT',
    appointment_time: '14:30',
    appointment_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    status: 'confirmed',
    type: 'Video',
    symptoms: 'Ear pain, throat infection',
    consultation_fee: 1200
  },
  {
    id: 'apt-9',
    doctor_first_name: 'Dr. Maria',
    doctor_last_name: 'Garcia',
    doctor_specialization: 'Dentist',
    doctor_department: 'Dental',
    appointment_time: '11:00',
    appointment_date: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    status: 'pending',
    type: 'In Person',
    symptoms: 'Toothache, dental cleaning',
    consultation_fee: 800
  },
  {
    id: 'apt-10',
    doctor_first_name: 'Dr. William',
    doctor_last_name: 'Brown',
    doctor_specialization: 'Ophthalmologist',
    doctor_department: 'Ophthalmology',
    appointment_time: '16:00',
    appointment_date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
    status: 'confirmed',
    type: 'In Person',
    symptoms: 'Eye checkup, vision test',
    consultation_fee: 1000
  }
];

const Appointments = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>(dummyTodayAppointments);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>(dummyUpcomingAppointments);
  const [loading, setLoading] = useState(false);

  // Use logged in user data if available, otherwise use default
  const patient = user ? {
    first_name: user.first_name,
    last_name: user.last_name,
    age: 45,
    city: 'Mumbai'
  } : currentPatient;

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let realTodayAppointments: Appointment[] = [];
      let realUpcomingAppointments: Appointment[] = [];
      
      try {
        // Fetch patient's today's appointments
        const todayRes = await api.get('/appointments/patient/today');
        realTodayAppointments = todayRes.data?.data || [];
      } catch (apiError) {
        console.log('API error fetching today appointments, using dummy data');
      }
      
      try {
        // Fetch patient's all appointments for upcoming
        const allRes = await api.get('/appointments/patient');
        const today = new Date().toISOString().split('T')[0];
        
        // Filter upcoming appointments (future dates, not today)
        realUpcomingAppointments = allRes.data?.data?.filter((apt: Appointment) => {
          const aptDate = apt.appointment_date || apt.appointment_time?.split('T')[0];
          return aptDate && aptDate > today;
        }) || [];
      } catch (apiError) {
        console.log('API error fetching upcoming appointments, using dummy data');
      }
      
      // Merge real appointments with dummy appointments
      if (realTodayAppointments.length > 0) {
        console.log(`Found ${realTodayAppointments.length} real today appointments, merging with dummy`);
        setTodayAppointments([...realTodayAppointments, ...dummyTodayAppointments]);
      }
      
      if (realUpcomingAppointments.length > 0) {
        console.log(`Found ${realUpcomingAppointments.length} real upcoming appointments, merging with dummy`);
        setUpcomingAppointments([...realUpcomingAppointments, ...dummyUpcomingAppointments]);
      }
      
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
      // Keep dummy data on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; border: string }> = {
      completed: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' },
      in_progress: { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
      pending: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
      confirmed: { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700' },
      cancelled: { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700' },
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
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-800 border-2 border-slate-600 shadow-xl hover:shadow-2xl hover:border-slate-500 transition-all duration-200 hover:scale-[1.01]">
        {/* Time & Date */}
        <div className="flex-shrink-0 text-center min-w-[90px]">
          <p className="text-white font-bold text-2xl">{displayTime}</p>
          {activeTab === 'upcoming' && displayDate && (
            <p className="text-slate-300 text-sm font-semibold mt-1">{displayDate}</p>
          )}
          <p className="text-slate-400 text-xs uppercase mt-1 font-bold tracking-wider">{apt.type}</p>
        </div>

        {/* Divider */}
        <div className="w-0.5 h-14 bg-slate-600" />

        {/* Doctor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-bold text-lg truncate">
              {apt.doctor_first_name} {apt.doctor_last_name}
            </p>
            {apt.id?.startsWith('apt-') && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white border border-purple-400">
                Demo
              </span>
            )}
          </div>
          <p className="text-slate-300 text-sm font-medium">
            {apt.doctor_specialization} • {apt.doctor_department}
          </p>
          {apt.consultation_fee && (
            <p className="text-emerald-400 text-sm font-medium mt-1">
              ₹{apt.consultation_fee} consultation fee
            </p>
          )}
          {apt.symptoms && (
            <p className="text-slate-400 text-sm mt-2">Symptoms: {apt.symptoms}</p>
          )}
        </div>

        {/* Status */}
        <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 ${status.bg} ${status.text} ${status.border}`}>
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
            <h1 className="text-4xl font-black text-slate-900">
              My Appointments
            </h1>
            <p className="text-slate-700 text-lg font-bold mt-2">
              View and manage your doctor appointments
            </p>
            <p className="text-slate-500 text-base mt-1">
              {patient.first_name} {patient.last_name} • {patient.age} years • {patient.city}
            </p>
          </div>
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base bg-white px-4 py-2 rounded-xl border-2 border-slate-300 shadow-lg">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Cards - Removed Total Patients, only 2 cards now */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-slate-800 border-2 border-slate-600 shadow-xl hover:shadow-2xl hover:border-slate-500 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-600">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-slate-300 text-sm font-bold">Today's Appointments</p>
                <p className="text-white text-3xl font-bold">{todayAppointments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-slate-800 border-2 border-slate-600 shadow-xl hover:shadow-2xl hover:border-slate-500 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-600">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-slate-300 text-sm font-bold">Upcoming</p>
                <p className="text-white text-3xl font-bold">{upcomingAppointments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 p-1 rounded-xl bg-slate-200 w-fit border-2 border-slate-300">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today's Appointments
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs">
                {todayAppointments.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs">
                {upcomingAppointments.length}
              </span>
            </div>
          </button>
        </div>

        {/* Appointments List */}
        <div className="rounded-2xl bg-white border-2 border-slate-200 shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'today' ? "Today's Schedule" : 'Upcoming Appointments'}
            </h2>
            <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 border border-slate-300">
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
            </div>
          ) : currentAppointments.length > 0 ? (
            <div className="space-y-4">
              {currentAppointments.map((apt) => (
                <AppointmentItem key={apt.id} apt={apt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                <Stethoscope className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-lg">
                {activeTab === 'today' 
                  ? 'No appointments scheduled for today'
                  : 'No upcoming appointments'
                }
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Book an appointment with your doctor
              </p>
            </div>
          )}
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default Appointments;
