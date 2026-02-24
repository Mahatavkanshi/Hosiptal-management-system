import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Calendar,
  Bed,
  Pill,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalRevenue: number;
  totalAppointments: number;
  occupancyRate: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    occupancyRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // In a real app, fetch from API
      // const response = await api.get('/admin/dashboard');
      // setStats(response.data.data);
      
      // Demo data
      setTimeout(() => {
        setStats({
          totalUsers: 1250,
          totalDoctors: 45,
          totalPatients: 890,
          totalRevenue: 285000,
          totalAppointments: 156,
          occupancyRate: 78
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const revenueData = [
    { name: 'Mon', revenue: 45000 },
    { name: 'Tue', revenue: 52000 },
    { name: 'Wed', revenue: 48000 },
    { name: 'Thu', revenue: 61000 },
    { name: 'Fri', revenue: 55000 },
    { name: 'Sat', revenue: 42000 },
    { name: 'Sun', revenue: 38000 },
  ];

  const userDistribution = [
    { name: 'Doctors', value: 45, color: '#3b82f6' },
    { name: 'Nurses', value: 120, color: '#ec4899' },
    { name: 'Patients', value: 890, color: '#10b981' },
    { name: 'Staff', value: 195, color: '#f59e0b' },
  ];

  const recentActivities = [
    { id: 1, action: 'New patient registered', user: 'John Smith', time: '2 mins ago', type: 'patient' },
    { id: 2, action: 'Appointment scheduled', user: 'Dr. Sarah Johnson', time: '15 mins ago', type: 'appointment' },
    { id: 3, action: 'Bed allocated', user: 'Nurse Mike', time: '1 hour ago', type: 'bed' },
    { id: 4, action: 'Payment received', user: 'Patient #1234', time: '2 hours ago', type: 'payment' },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            {isLoading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              value
            )}
          </h3>
          {!isLoading && trend && (
            <div className={`flex items-center mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend="+12% from last month"
          trendUp={true}
          color="bg-blue-500"
        />
        <StatCard 
          title="Total Doctors" 
          value={stats.totalDoctors}
          icon={Activity}
          trend="+3 new this week"
          trendUp={true}
          color="bg-purple-500"
        />
        <StatCard 
          title="Total Patients" 
          value={stats.totalPatients.toLocaleString()}
          icon={Users}
          trend="+45 today"
          trendUp={true}
          color="bg-green-500"
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend="+8% from last month"
          trendUp={true}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Today's Appointments" 
          value={stats.totalAppointments}
          icon={Calendar}
          trend="85% completion rate"
          trendUp={true}
          color="bg-orange-500"
        />
        <StatCard 
          title="Bed Occupancy" 
          value={`${stats.occupancyRate}%`}
          icon={Bed}
          trend="78% occupied"
          trendUp={false}
          color="bg-pink-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Details
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">User Distribution</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Manage Users
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {userDistribution.map((item) => (
              <div key={item.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mr-4
                    ${activity.type === 'patient' ? 'bg-blue-100 text-blue-600' : ''}
                    ${activity.type === 'appointment' ? 'bg-purple-100 text-purple-600' : ''}
                    ${activity.type === 'bed' ? 'bg-pink-100 text-pink-600' : ''}
                    ${activity.type === 'payment' ? 'bg-green-100 text-green-600' : ''}
                  `}>
                    {activity.type === 'patient' && <Users className="h-5 w-5" />}
                    {activity.type === 'appointment' && <Calendar className="h-5 w-5" />}
                    {activity.type === 'bed' && <Bed className="h-5 w-5" />}
                    {activity.type === 'payment' && <DollarSign className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
