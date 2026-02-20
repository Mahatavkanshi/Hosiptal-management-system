import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, BedDouble, Pill, Plus, UserPlus, CreditCard, Activity, Clock, Bed, IndianRupee, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AddPatientModal from '../../components/modals/AddPatientModal';
import AllocateBedModal from '../../components/modals/AllocateBedModal';
import MedicineOrderModal from '../../components/modals/MedicineOrderModal';
import BookAppointmentModal from '../../components/modals/BookAppointmentModal';
import ProcessPaymentModal from '../../components/modals/ProcessPaymentModal';
import BedManagement from '../../components/beds/BedManagement';
import OutstandingPayments from '../../components/payments/OutstandingPayments';

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
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.first_name}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Here's what's happening with your patients today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Appointments */}
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            fetchPatients();
            setActiveTab('appointments');
          }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_appointments || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+12%</span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>

        {/* Active Patients */}
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            fetchPatients();
            setActiveTab('patients');
          }}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_patients || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">+5%</span>
            <span className="text-gray-500 ml-2">this month</span>
          </div>
        </div>

        {/* Available Beds */}
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('beds')}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <BedDouble className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Beds</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.beds?.available || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">{stats?.beds?.occupied || 0} occupied</span>
          </div>
        </div>

        {/* Medicine Alerts */}
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowMedicineOrder(true)}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Pill className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{medicineAlerts?.length || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium">Needs attention</span>
          </div>
        </div>

        {/* Payment History */}
        <div 
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('payments')}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <IndianRupee className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Payment History</p>
              <p className="text-2xl font-bold text-gray-900">{paymentHistory?.length || 0}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-600 font-medium">View payments</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {activity.type === 'payment' ? (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <IndianRupee className="h-4 w-4 text-green-600" />
                        </div>
                      ) : activity.type === 'patient_added' ? (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      ) : activity.type === 'bed_allocated' ? (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Bed className="h-4 w-4 text-purple-600" />
                        </div>
                      ) : activity.type === 'appointment' ? (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full mt-2 bg-green-500" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.patient_name}</p>
                        {activity.amount && (
                          <p className="text-xs font-medium text-green-600">
                            ₹{activity.amount.toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {activity.created_at}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {todayAppointments.length} total
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {todayAppointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {apt.patient_first_name} {apt.patient_last_name}
                          </p>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            apt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {apt.status}
                          </span>
                          {apt.id?.startsWith('apt-') && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                              Demo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {apt.patient_age} years • {apt.city}, {apt.state}
                        </p>
                        {apt.symptoms && (
                          <p className="text-xs text-gray-600 mt-1">Symptoms: {apt.symptoms}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(apt.appointment_time)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{apt.type}</p>
                      </div>
                    </div>
                  ))}
                  {todayAppointments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No appointments today</p>
                  )}
                </div>
              </div>
            </div>

            {/* Outstanding Payments */}
            <OutstandingPayments />
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setShowAddPatient(true)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-3 rounded-full bg-green-100 mb-3">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Add Patient</span>
              </button>

              <button 
                onClick={() => setShowAllocateBed(true)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-3 rounded-full bg-blue-100 mb-3">
                  <Bed className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Allocate Bed</span>
              </button>

              <button 
                onClick={() => setShowProcessPayment(true)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-3 rounded-full bg-purple-100 mb-3">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Process Payment</span>
              </button>

              <button 
                onClick={() => setShowBookAppointment(true)}
                className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-3 rounded-full bg-primary-100 mb-3">
                  <Plus className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Book Appointment</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">My Patients</h3>
              <button 
                onClick={() => setActiveTab('overview')}
                className="text-primary-600 hover:text-primary-700"
              >
                ← Back
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{patient.blood_group}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.age} years
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {patient.address}, {patient.city}, {patient.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.has_bed ? (
                          <span className="text-green-600">
                            {patient.bed_number} ({patient.ward_type})
                          </span>
                        ) : (
                          <span className="text-gray-400">Not allocated</span>
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
    </div>
  );
};

export default Dashboard;
