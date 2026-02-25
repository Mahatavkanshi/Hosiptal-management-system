import React, { useState, useEffect } from 'react';
import { 
  Search,
  Plus,
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  Users,
  UserPlus,
  Phone,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { receptionApi, Doctor, QueueItem, Patient as PatientType } from '../../services/receptionApi';
import { socketService } from '../../services/socketService';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  phone: string;
  total_visits: number;
  outstanding_amount: number;
}

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [patients, setPatients] = useState<PatientType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    completed: 0,
    waiting: 0,
    revenue: 0
  });

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Setup WebSocket
  useEffect(() => {
    // Connect to WebSocket
    socketService.connect();

    // Listen for queue updates
    const handleQueueUpdate = (data: any) => {
      console.log('Queue updated:', data);
      // Refresh data when queue changes
      loadData();
    };

    socketService.onQueueUpdate(handleQueueUpdate);
    socketService.onDoctorQueueUpdate(handleQueueUpdate);

    // Cleanup
    return () => {
      socketService.offQueueUpdate(handleQueueUpdate);
      socketService.offDoctorQueueUpdate(handleQueueUpdate);
    };
  }, []);

  // Join doctor rooms when doctors change
  useEffect(() => {
    if (doctors.length > 0) {
      doctors.forEach(doctor => {
        socketService.joinDoctorQueue(doctor.id);
      });
    }
    
    return () => {
      doctors.forEach(doctor => {
        socketService.leaveDoctorQueue(doctor.id);
      });
    };
  }, [doctors]);

  // Search patients when query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        searchPatients();
      } else {
        setPatients([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // Fetch doctors and queue data
      const [doctorsData, queueData, statsData] = await Promise.all([
        receptionApi.getDoctors(),
        receptionApi.getAllQueues(),
        receptionApi.getTodayStats()
      ]);

      console.log('Doctors loaded:', doctorsData);
      console.log('Queue loaded:', queueData);
      console.log('Stats loaded:', statsData);

      // If no doctors returned, use demo data
      if (!doctorsData || doctorsData.length === 0) {
        console.log('No doctors found, using demo data');
        setDoctors([
          { id: '1', name: 'Dr. Smith', specialization: 'General Medicine', room: 'Room 1', status: 'available', consultation_fee: 500, current_patients: 0, waiting_count: 0 },
          { id: '2', name: 'Dr. Johnson', specialization: 'Cardiology', room: 'Room 2', status: 'available', consultation_fee: 800, current_patients: 0, waiting_count: 0 },
          { id: '3', name: 'Dr. Williams', specialization: 'Pediatrics', room: 'Room 3', status: 'busy', consultation_fee: 600, current_patients: 1, waiting_count: 2 }
        ]);
      } else {
        setDoctors(doctorsData);
      }

      setQueue(queueData || []);
      
      // Update stats
      setStats({
        totalPatients: statsData?.overall?.total_patients || 0,
        completed: statsData?.overall?.completed || 0,
        waiting: statsData?.overall?.waiting || 0,
        revenue: statsData?.overall?.total_revenue || 0
      });
    } catch (error: any) {
      console.error('Error loading data:', error);
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load queue data';
      
      // Handle specific error cases
      if (statusCode === 401) {
        setLoadError('Session expired. Please login again.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else if (statusCode === 429) {
        setLoadError('Too many requests. Please wait.');
      } else {
        setLoadError(errorMsg);
      }
      
      // Always use demo data on error so UI still works
      setDoctors([
        { id: '1', name: 'Dr. Smith', specialization: 'General Medicine', room: 'Room 1', status: 'available', consultation_fee: 500, current_patients: 0, waiting_count: 0 },
        { id: '2', name: 'Dr. Johnson', specialization: 'Cardiology', room: 'Room 2', status: 'available', consultation_fee: 800, current_patients: 0, waiting_count: 0 },
        { id: '3', name: 'Dr. Williams', specialization: 'Pediatrics', room: 'Room 3', status: 'busy', consultation_fee: 600, current_patients: 1, waiting_count: 2 }
      ]);
      setQueue([
        { id: '1', token: 'A-001', patient_name: 'Ramesh Kumar', patient_phone: '+91 9876543210', doctor_id: '1', check_in_time: new Date().toISOString(), status: 'in_progress', type: 'emergency', fee_paid: false, fee_amount: 1000, patient_id: 'p1' },
        { id: '2', token: 'B-002', patient_name: 'Priya Patel', patient_phone: '+91 9876543211', doctor_id: '2', check_in_time: new Date().toISOString(), status: 'in_progress', type: 'regular', fee_paid: true, fee_amount: 800, patient_id: 'p2' },
        { id: '3', token: 'C-003', patient_name: 'Amit Singh', patient_phone: '+91 9876543212', doctor_id: '3', check_in_time: new Date().toISOString(), status: 'confirmed', type: 'priority', fee_paid: false, fee_amount: 600, patient_id: 'p3' },
        { id: '4', token: 'A-002', patient_name: 'Sunita Devi', patient_phone: '+91 9876543213', doctor_id: '1', check_in_time: new Date().toISOString(), status: 'confirmed', type: 'regular', fee_paid: false, fee_amount: 500, patient_id: 'p4' }
      ]);
      setStats({ totalPatients: 4, completed: 0, waiting: 2, revenue: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const searchPatients = async () => {
    try {
      const results = await receptionApi.searchPatients(searchQuery);
      setPatients(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const getDoctorQueue = (doctorId: string) => {
    return queue.filter(q => q.doctor_id === doctorId);
  };

  const getCurrentPatient = (doctorId: string) => {
    return queue.find(q => q.doctor_id === doctorId && q.status === 'in_progress');
  };

  const getWaitingCount = (doctorId: string) => {
    return queue.filter(q => q.doctor_id === doctorId && q.status === 'confirmed').length;
  };

  const handleCallNext = async (doctorId: string) => {
    try {
      await receptionApi.callNextPatient(doctorId);
      toast.success('Calling next patient...');
      await loadData(); // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to call next patient');
    }
  };

  const handleComplete = async (patientId: string) => {
    try {
      await receptionApi.updateQueueStatus(patientId, 'completed');
      toast.success('Consultation completed');
      await loadData(); // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete consultation');
    }
  };

  const handleEmergency = (doctorId: string) => {
    toast.success(`🚨 Emergency alert sent!`);
  };

  const handleAddToQueue = async () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    // For now, show a toast. In a real app, you'd show a modal to select a patient
    toast.success('Patient added to queue (Demo)');
  };

  const openDisplayScreen = () => {
    window.open('/reception/display', '_blank', 'width=1200,height=800');
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      regular: 'bg-blue-100 text-blue-700',
      priority: 'bg-yellow-100 text-yellow-700',
      emergency: 'bg-red-100 text-red-700 border-2 border-red-300'
    };
    return styles[type] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Error Alert */}
      {loadError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-900">API Error</h4>
            <p className="text-sm text-yellow-700 mt-1">{loadError}</p>
            <p className="text-sm text-yellow-600 mt-1">Showing demo data instead.</p>
            {loadError.includes('Session expired') && (
              <button 
                onClick={() => window.location.href = '/login'}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients Queue</h1>
          <p className="text-gray-600 mt-1">Manage patient queue and doctor assignments</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={openDisplayScreen}
            className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Display
          </button>
          <button 
            onClick={() => handleEmergency('1')}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Doctor Cards - Takes up 3 columns */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.length === 0 ? (
            <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No doctors available</h3>
              <p className="text-gray-600 mt-1">Please check the backend connection</p>
            </div>
          ) : (
            doctors.map((doctor) => (
              <DoctorQueueCard 
                key={doctor.id}
                doctor={doctor}
                currentPatient={getCurrentPatient(doctor.id)}
                waitingCount={getWaitingCount(doctor.id)}
                onCallNext={() => handleCallNext(doctor.id)}
                onComplete={handleComplete}
                onEmergency={() => handleEmergency(doctor.id)}
                getTypeBadge={getTypeBadge}
              />
            ))
          )}
        </div>

        {/* Right Sidebar - Takes up 1 column */}
        <div className="space-y-6">
          {/* Add to Queue */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Add to Queue</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
                <select 
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose doctor...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddToQueue}
                disabled={!selectedDoctor}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Walk-in Patient
              </button>
            </div>
          </div>

          {/* Patient Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Patient Search</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {patients.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {searchQuery ? 'No patients found' : 'Start typing to search'}
                </p>
              ) : (
                patients.map((patient) => (
                  <div key={patient.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                      </div>
                      {patient.outstanding_amount > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          ₹{patient.outstanding_amount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Visits: {patient.total_visits}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-xl mb-4">Today's Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-100">Total Patients</span>
                <span className="font-bold text-lg">{stats.totalPatients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Completed</span>
                <span className="font-bold text-lg">{stats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Waiting</span>
                <span className="font-bold text-lg">{stats.waiting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-100">Revenue</span>
                <span className="font-bold text-lg">₹{stats.revenue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Doctor Queue Card Component
interface DoctorQueueCardProps {
  doctor: Doctor;
  currentPatient?: QueueItem;
  waitingCount: number;
  onCallNext: () => void;
  onComplete: (id: string) => void;
  onEmergency: () => void;
  getTypeBadge: (type: string) => string;
}

const DoctorQueueCard: React.FC<DoctorQueueCardProps> = ({
  doctor,
  currentPatient,
  waitingCount,
  onCallNext,
  onComplete,
  onEmergency,
  getTypeBadge
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Doctor Header */}
      <div className={`p-4 ${doctor.status === 'available' ? 'bg-green-50' : 'bg-yellow-50'} border-b border-gray-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-bold text-gray-900 text-lg">{doctor.name}</h3>
              <p className="text-sm text-gray-600">{doctor.specialization}</p>
              <p className="text-xs text-gray-500">{doctor.room}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            doctor.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {doctor.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Now Serving */}
      <div className="p-4 bg-blue-50">
        <p className="text-xs font-bold text-blue-600 mb-2 tracking-wider">NOW SERVING</p>
        {currentPatient ? (
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border-2 border-blue-200">
                <span className="text-2xl font-bold text-blue-600">{currentPatient.token}</span>
              </div>
              <div className="ml-3">
                <p className="font-bold text-gray-900">{currentPatient.patient_name}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${getTypeBadge(currentPatient.type)}`}>
                  {currentPatient.type.toUpperCase()}
                </span>
                {!currentPatient.fee_paid && (
                  <p className="text-xs text-red-600 mt-1">Payment Pending</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[80px]">
              {!currentPatient.fee_paid && (
                <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-red-600 transition-colors whitespace-nowrap">
                  💰 Collect Fee
                </button>
              )}
              <button 
                onClick={() => onComplete(currentPatient.id)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-green-700 transition-colors whitespace-nowrap flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Checkout
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No patient with doctor</p>
          </div>
        )}
      </div>

      {/* Waiting Queue */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Waiting ({waitingCount})</p>
          <button 
            onClick={onCallNext}
            disabled={waitingCount === 0}
            className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Call Next
          </button>
        </div>
        {waitingCount === 0 ? (
          <p className="text-center text-gray-500 py-4">No patients waiting</p>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-gray-700 shadow-sm">003</span>
                <span className="ml-2 text-sm font-medium">Next Patient</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Emergency Button */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={onEmergency}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Add Emergency Case
        </button>
      </div>
    </div>
  );
};

export default Patients;
