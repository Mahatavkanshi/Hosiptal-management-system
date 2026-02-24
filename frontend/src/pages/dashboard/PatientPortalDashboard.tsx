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
  Download
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface Appointment {
  id: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  type: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  doctor: string;
  diagnosis: string;
  prescription: string[];
  notes: string;
}

interface Bill {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

const PatientPortalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Demo data
      setTimeout(() => {
        setAppointments([
          { id: '1', doctorName: 'Dr. Sarah Johnson', department: 'Cardiology', date: '2024-02-28', time: '10:00 AM', status: 'upcoming', type: 'Follow-up' },
          { id: '2', doctorName: 'Dr. Michael Chen', department: 'General Medicine', date: '2024-02-15', time: '02:30 PM', status: 'completed', type: 'General Checkup' },
          { id: '3', doctorName: 'Dr. Emily Davis', department: 'Dermatology', date: '2024-01-20', time: '11:00 AM', status: 'completed', type: 'Consultation' },
        ]);

        setRecords([
          { 
            id: '1', 
            date: '2024-02-15', 
            doctor: 'Dr. Michael Chen', 
            diagnosis: 'Common Cold', 
            prescription: ['Paracetamol 500mg', 'Vitamin C'],
            notes: 'Patient advised rest and hydration. Follow up in 1 week if symptoms persist.'
          },
          { 
            id: '2', 
            date: '2024-01-20', 
            doctor: 'Dr. Emily Davis', 
            diagnosis: 'Eczema', 
            prescription: ['Hydrocortisone cream', 'Moisturizer'],
            notes: 'Apply cream twice daily. Avoid harsh soaps.'
          },
        ]);

        setBills([
          { id: '1', date: '2024-02-15', description: 'Consultation Fee', amount: 150, status: 'paid' },
          { id: '2', date: '2024-02-15', description: 'Lab Tests', amount: 250, status: 'paid' },
          { id: '3', date: '2024-01-20', description: 'Consultation Fee', amount: 200, status: 'paid' },
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
      'upcoming': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700',
      'paid': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'overdue': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const totalDue = bills.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.first_name || 'Patient'}
        </h1>
        <p className="text-gray-600 mt-1">Manage your health records and appointments</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button className="flex items-center justify-center p-4 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors">
          <Calendar className="h-5 w-5 mr-2" />
          Book Appointment
        </button>
        <button className="flex items-center justify-center p-4 bg-white border-2 border-teal-600 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors">
          <FileText className="h-5 w-5 mr-2" />
          View Records
        </button>
        <button className="flex items-center justify-center p-4 bg-white border-2 border-teal-600 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors">
          <CreditCard className="h-5 w-5 mr-2" />
          Pay Bills
        </button>
        <button className="flex items-center justify-center p-4 bg-white border-2 border-teal-600 text-teal-600 rounded-xl hover:bg-teal-50 transition-colors">
          <Activity className="h-5 w-5 mr-2" />
          Telemedicine
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{appointments.filter(a => a.status === 'upcoming').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {appointments.filter(a => a.status === 'upcoming').map((apt) => (
              <div key={apt.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="h-6 w-6 text-teal-600" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{apt.doctorName}</p>
                    <p className="text-sm text-gray-500">{apt.department} • {apt.type}</p>
                    
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{apt.date} at {apt.time}</span>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
            
            {appointments.filter(a => a.status === 'upcoming').length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming appointments</p>
                <button className="mt-3 text-teal-600 font-medium">Book an appointment</button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Medical Records */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Medical Records</h3>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View All
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {records.slice(0, 3).map((record) => (
              <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{record.diagnosis}</p>
                    <p className="text-sm text-gray-500">{record.doctor}</p>
                    
                    <p className="text-xs text-gray-400 mt-1">{record.date}</p>
                    
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Prescription: {record.prescription.join(', ')}</p>
                    </div>
                  </div>
                  
                  <button className="text-teal-600 hover:text-teal-700">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPortalDashboard;
