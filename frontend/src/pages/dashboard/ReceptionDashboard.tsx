import React, { useState, useEffect } from 'react';
import { 
  Clock,
  Users,
  MessageSquare,
  Search,
  Bell,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { receptionApi, QueueItem, TodayStats } from '../../services/receptionApi';
import toast from 'react-hot-toast';

// Types
interface Message {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  time: string;
  unread: boolean;
}

interface DashboardStats {
  dischargeList: number;
  dischargeChange: number;
  newPatients: number;
  newPatientsChange: number;
  totalPatients: number;
  totalPatientsChange: number;
}

const ReceptionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [admissions, setAdmissions] = useState<QueueItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    dischargeList: 0,
    dischargeChange: 0,
    newPatients: 0,
    newPatientsChange: 0,
    totalPatients: 0,
    totalPatientsChange: 0
  });
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch today's queue data
      const queueData = await receptionApi.getAllQueues();
      setAdmissions(queueData);

      // Fetch today's stats
      const statsData = await receptionApi.getTodayStats();
      setTodayStats(statsData.overall);
      
      // Update dashboard stats with real data
      setStats({
        dischargeList: statsData.overall.completed,
        dischargeChange: 0,
        newPatients: statsData.overall.total_patients,
        newPatientsChange: 0,
        totalPatients: statsData.overall.total_patients,
        totalPatientsChange: 0
      });

      // Load demo messages (until messaging API is implemented)
      setMessages([
        { id: '1', sender: 'Dianne Russell', avatar: 'DR', message: 'Please confirm your appointment', time: '11:25', unread: true },
        { id: '2', sender: 'Eleanor Pena', avatar: 'EP', message: 'Hi, I need to reschedule my appointment', time: '10:20', unread: false },
        { id: '3', sender: 'Guy Hawkins', avatar: 'GH', message: 'Can you help me?', time: '09:11', unread: true },
        { id: '4', sender: 'Ronald Richards', avatar: 'RR', message: 'Great! Thank you!', time: '08:19', unread: false },
        { id: '5', sender: 'Darrell Steward', avatar: 'DS', message: 'How are you doing well?', time: 'Yesterday', unread: false },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-700';
      case 'priority': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-orange-100 text-orange-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-2xl p-6 flex items-center justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Hello, {user?.first_name || 'Esther'}!</h2>
          <p className="text-green-100">Welcome back to Hospital MS</p>
        </div>
        <div className="relative z-10">
          <img
            src="https://img.freepik.com/free-vector/doctor-character-background_1270-84.jpg"
            alt="Doctor"
            className="w-32 h-32 object-cover rounded-full border-4 border-white/30"
          />
        </div>
        {/* Decorative circles */}
        <div className="absolute right-20 top-0 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute right-40 bottom-0 w-24 h-24 bg-white/10 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Discharge List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Today's Discharge List</p>
              <p className="text-3xl font-bold text-gray-900">{stats.dischargeList}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Users className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-red-500 font-medium">{stats.dischargeChange}%</span>
            <span className="text-gray-400 ml-2">vs yesterday</span>
          </div>
        </div>

        {/* New Patients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">New Patients</p>
              <p className="text-3xl font-bold text-gray-900">{stats.newPatients}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <Users className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-500 font-medium">+{stats.newPatientsChange}%</span>
            <span className="text-gray-400 ml-2">vs yesterday</span>
          </div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}+</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-red-500 font-medium">{stats.totalPatientsChange}%</span>
            <span className="text-gray-400 ml-2">vs yesterday</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Admissions List */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-900">Admissions List</h3>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50">
                <option>All Time (PDT)</option>
                <option>Today</option>
                <option>This Week</option>
              </select>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase py-4 px-6">Time</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase py-4 px-6">Patient Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase py-4 px-6">Token</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase py-4 px-6">Priority</th>
                </tr>
              </thead>
              <tbody>
                {admissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No admissions today
                    </td>
                  </tr>
                ) : (
                  admissions.map((admission) => (
                    <tr key={admission.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-600">{formatTime(admission.check_in_time)}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{admission.patient_name}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{admission.token}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(admission.type)}`}>
                          {admission.type}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Messages</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'all' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
              }`}
            >
              All Messages
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'unread' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
              }`}
            >
              Unread Messages
            </button>
          </div>

          {/* Messages List */}
          <div className="divide-y divide-gray-50">
            {messages
              .filter((msg) => activeTab === 'all' || msg.unread)
              .map((message) => (
                <div
                  key={message.id}
                  className={`p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    message.unread ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                    {message.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">{message.sender}</p>
                      <span className="text-xs text-gray-400">{message.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{message.message}</p>
                  </div>
                  {message.unread && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              ))}
          </div>

          <div className="p-4 border-t border-gray-100 text-center">
            <button className="text-sm text-green-600 font-medium hover:text-green-700">
              View More
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* New vs Returning */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">New vs Returning</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                {/* New patients (40%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray="100.53 150.8"
                  strokeLinecap="round"
                />
                {/* Returning patients (60%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="12"
                  strokeDasharray="150.8 100.53"
                  strokeDashoffset="-100.53"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">New</span>
                <span className="text-sm font-bold text-gray-900 ml-auto">40%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-sm text-gray-600">Returning</span>
                <span className="text-sm font-bold text-gray-900 ml-auto">60%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Answered vs Missed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Answered vs Missed</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                {/* Answered (25%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#84cc16"
                  strokeWidth="12"
                  strokeDasharray="62.83 188.5"
                  strokeLinecap="round"
                />
                {/* Missed (75%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="12"
                  strokeDasharray="188.5 62.83"
                  strokeDashoffset="-62.83"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-lime-500"></div>
                <span className="text-sm text-gray-600">Answered</span>
                <span className="text-sm font-bold text-gray-900 ml-auto">25%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-sm text-gray-600">Missed</span>
                <span className="text-sm font-bold text-gray-900 ml-auto">75%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
