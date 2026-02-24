import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Bed,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Plus,
  Calendar,
  MessageSquare,
  Video,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Loader2,
  Bell,
  FileText,
  Phone,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  status: 'stable' | 'critical' | 'recovering';
  vitals: {
    bp: string;
    hr: number;
    temp: number;
    spo2: number;
  };
  lastChecked: string;
  gcs_score?: number;
}

interface TodayShift {
  id: string;
  shift_type: 'day' | 'night' | 'rotating';
  department: string;
  start_time: string;
  end_time: string;
  floor_number: number;
}

interface Handover {
  id: string;
  patient_name: string;
  from_nurse: string;
  critical_flags: string[];
  acknowledged: boolean;
}

interface DashboardSummary {
  today_shift: TodayShift | null;
  pending_tasks: number;
  pending_handovers: Handover[];
  unread_messages: number;
  total_patients: number;
  critical_patients: number;
}

const demoPatients: Patient[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    age: 45,
    room: '101-A',
    status: 'stable',
    vitals: { bp: '120/80', hr: 72, temp: 98.6, spo2: 98 },
    lastChecked: '10 mins ago',
    gcs_score: 15
  },
  {
    id: '2',
    name: 'Bob Smith',
    age: 62,
    room: '102-B',
    status: 'recovering',
    vitals: { bp: '135/85', hr: 78, temp: 99.2, spo2: 96 },
    lastChecked: '25 mins ago',
    gcs_score: 15
  },
  {
    id: '3',
    name: 'Carol Williams',
    age: 28,
    room: '103-A',
    status: 'stable',
    vitals: { bp: '110/70', hr: 68, temp: 98.4, spo2: 99 },
    lastChecked: '1 hour ago',
    gcs_score: 15
  },
  {
    id: '4',
    name: 'David Brown',
    age: 55,
    room: '104-C',
    status: 'critical',
    vitals: { bp: '160/95', hr: 95, temp: 101.2, spo2: 92 },
    lastChecked: '5 mins ago',
    gcs_score: 12
  },
  {
    id: '5',
    name: 'Emma Davis',
    age: 34,
    room: '105-A',
    status: 'stable',
    vitals: { bp: '118/76', hr: 70, temp: 98.8, spo2: 97 },
    lastChecked: '30 mins ago',
    gcs_score: 15
  }
];

const demoShift: TodayShift = {
  id: '1',
  shift_type: 'day',
  department: 'General Ward',
  start_time: '07:00',
  end_time: '19:00',
  floor_number: 1
};

const demoHandovers: Handover[] = [
  {
    id: '1',
    patient_name: 'Michael Chen',
    from_nurse: 'Sarah Johnson',
    critical_flags: ['High BP', 'Diabetic'],
    acknowledged: false
  },
  {
    id: '2',
    patient_name: 'Lisa Wong',
    from_nurse: 'Emily Davis',
    critical_flags: ['Post-op', 'Pain Management'],
    acknowledged: false
  }
];

const NurseDashboard: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>(demoPatients);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(demoPatients);
  const [summary, setSummary] = useState<DashboardSummary>({
    today_shift: demoShift,
    pending_tasks: 3,
    pending_handovers: demoHandovers,
    unread_messages: 5,
    total_patients: demoPatients.length,
    critical_patients: 1
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Try to fetch real data
      try {
        const response = await api.get('/reports/nurse/dashboard-summary');
        if (response.data?.data) {
          setSummary(prev => ({ ...prev, ...response.data.data }));
        }
      } catch (error) {
        console.log('Using demo data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchQuery) {
      setFilteredPatients(patients);
      return;
    }
    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.room.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-700 border-green-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'recovering': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getGCSColor = (score: number) => {
    if (score >= 13) return 'text-green-600';
    if (score >= 9) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nursing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/nurse/shifts"
            className="flex items-center px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
          >
            <Calendar className="h-4 w-4 mr-2" />
            My Schedule
          </Link>
          <Link
            to="/nurse/chat"
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors relative"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
            {summary.unread_messages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {summary.unread_messages}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Today's Shift Card */}
      {summary.today_shift && (
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Today's Shift</p>
              <h2 className="text-2xl font-bold mt-1">
                {summary.today_shift.shift_type.charAt(0).toUpperCase() + summary.today_shift.shift_type.slice(1)} Shift
              </h2>
              <p className="text-pink-100 mt-2">
                {formatTime(summary.today_shift.start_time)} - {formatTime(summary.today_shift.end_time)}
              </p>
              <p className="text-pink-100">
                {summary.today_shift.department} • Floor {summary.today_shift.floor_number}
              </p>
            </div>
            <div className="text-right">
              <Clock className="h-12 w-12 text-pink-200" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/nurse/patients" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_patients}</p>
            </div>
          </div>
        </Link>

        <Link to="/nurse/patients?filter=critical" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-gray-900">{summary.critical_patients}</p>
            </div>
          </div>
        </Link>

        <Link to="/nurse/shifts/handovers" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Handovers</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pending_handovers.length}</p>
            </div>
          </div>
        </Link>

        <Link to="/nurse/tasks" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pending_tasks}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/nurse/care-plans/new"
                className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-blue-700">New Care Plan</span>
              </Link>
              <Link
                to="/nurse/gcs-assessment"
                className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Activity className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-purple-700">GCS Assessment</span>
              </Link>
              <Link
                to="/nurse/video-call"
                className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Video className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-green-700">Video Call</span>
              </Link>
              <button
                onClick={() => toast('Emergency alert feature coming soon!')}
                className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
                <span className="text-sm font-medium text-red-700">Emergency</span>
              </button>
            </div>
          </div>

          {/* Patients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Patients</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {filteredPatients.map((patient) => (
                <div key={patient.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-pink-600 font-semibold">{patient.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500">Room {patient.room} • Age {patient.age}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {patient.gcs_score && (
                        <span className={`text-sm font-medium ${getGCSColor(patient.gcs_score)}`}>
                          GCS: {patient.gcs_score}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4 ml-14">
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-gray-600">{patient.vitals.hr} bpm</span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600">{patient.vitals.bp}</span>
                    </div>
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm text-gray-600">{patient.vitals.temp}°F</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-green-600 font-medium">SpO2 {patient.vitals.spo2}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 ml-14 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Last checked: {patient.lastChecked}</p>
                    <Link 
                      to={`/nurse/patients/${patient.id}`}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center"
                    >
                      View Details <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pending Handovers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Pending Handovers</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {summary.pending_handovers.map((handover) => (
                <div key={handover.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{handover.patient_name}</p>
                      <p className="text-sm text-gray-500">From: {handover.from_nurse}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {handover.critical_flags.map((flag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => toast('Acknowledge handover coming soon!')}
                      className="px-3 py-1 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
              {summary.pending_handovers.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No pending handovers</p>
                </div>
              )}
            </div>
          </div>

          {/* Daily Report Reminder */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">End of Shift</p>
                <h3 className="text-xl font-bold mt-1">Submit Daily Report</h3>
                <p className="text-blue-100 mt-2 text-sm">
                  Don't forget to submit your daily report before leaving!
                </p>
              </div>
              <FileText className="h-10 w-10 text-blue-200" />
            </div>
            <Link
              to="/nurse/daily-report"
              className="mt-4 block w-full py-2 bg-white text-blue-600 text-center rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Submit Report
            </Link>
          </div>

          {/* Performance Quick View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Patients Cared</span>
                <span className="font-bold text-gray-900">45</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tasks Completed</span>
                <span className="font-bold text-gray-900">128</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Quality Score</span>
                <span className="font-bold text-green-600">94%</span>
              </div>
            </div>
            <Link
              to="/nurse/performance"
              className="mt-4 block text-center text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              View Full Report →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
