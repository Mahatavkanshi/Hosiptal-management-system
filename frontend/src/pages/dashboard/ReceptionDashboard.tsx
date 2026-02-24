import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  UserPlus, 
  Bed,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  Mail,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  time: string;
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled';
  type: string;
}

interface BedInfo {
  id: string;
  room: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance';
  patientName?: string;
}

const ReceptionDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [beds, setBeds] = useState<BedInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Demo data
      setTimeout(() => {
        setAppointments([
          { id: '1', patientName: 'John Doe', doctorName: 'Dr. Smith', time: '09:00 AM', status: 'checked-in', type: 'General Checkup' },
          { id: '2', patientName: 'Jane Smith', doctorName: 'Dr. Johnson', time: '09:30 AM', status: 'scheduled', type: 'Follow-up' },
          { id: '3', patientName: 'Mike Johnson', doctorName: 'Dr. Williams', time: '10:00 AM', status: 'completed', type: 'Consultation' },
          { id: '4', patientName: 'Sarah Brown', doctorName: 'Dr. Davis', time: '10:30 AM', status: 'scheduled', type: 'General Checkup' },
          { id: '5', patientName: 'Tom Wilson', doctorName: 'Dr. Smith', time: '11:00 AM', status: 'cancelled', type: 'Review' },
        ]);

        setBeds([
          { id: '1', room: '101', type: 'General', status: 'occupied', patientName: 'John Doe' },
          { id: '2', room: '102', type: 'General', status: 'available' },
          { id: '3', room: '103', type: 'ICU', status: 'occupied', patientName: 'Sarah Brown' },
          { id: '4', room: '104', type: 'General', status: 'maintenance' },
          { id: '5', room: '105', type: 'Private', status: 'available' },
          { id: '6', room: '106', type: 'General', status: 'available' },
        ]);

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700',
      'checked-in': 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      available: 'bg-green-100 text-green-700',
      occupied: 'bg-red-100 text-red-700',
      maintenance: 'bg-yellow-100 text-yellow-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    totalAppointments: appointments.length,
    checkedIn: appointments.filter(a => a.status === 'checked-in').length,
    availableBeds: beds.filter(b => b.status === 'available').length,
    occupiedBeds: beds.filter(b => b.status === 'occupied').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage appointments, check-ins, and bed allocation</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <UserPlus className="h-4 w-4 mr-2" />
            Check In
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Calendar className="h-4 w-4 mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Checked In</p>
              <p className="text-2xl font-bold text-gray-900">{stats.checkedIn}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Bed className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Available Beds</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableBeds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$2,450</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                  Filter
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-green-600 font-semibold">{apt.patientName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{apt.patientName}</p>
                      <p className="text-sm text-gray-500">{apt.type} • {apt.doctorName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{apt.time}</p>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                    
                    {apt.status === 'scheduled' && (
                      <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bed Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bed Status</h3>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Manage Beds
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.availableBeds}</p>
                <p className="text-xs text-green-700">Available</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.occupiedBeds}</p>
                <p className="text-xs text-red-700">Occupied</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{beds.filter(b => b.status === 'maintenance').length}</p>
                <p className="text-xs text-yellow-700">Maintenance</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {beds.map((bed) => (
                <div 
                  key={bed.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Bed className={`h-4 w-4 mr-2 ${
                      bed.status === 'available' ? 'text-green-500' : 
                      bed.status === 'occupied' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Room {bed.room}</p>
                      <p className="text-xs text-gray-500">{bed.type}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(bed.status)}`}>
                    {bed.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
