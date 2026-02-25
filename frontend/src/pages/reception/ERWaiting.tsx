import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  Clock,
  User,
  Phone,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ERPatient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  triage_level: 'critical' | 'urgent' | 'moderate' | 'minor';
  chief_complaint: string;
  vital_signs: {
    bp?: string;
    pulse?: number;
    temperature?: number;
    spo2?: number;
  };
  arrival_time: string;
  status: 'waiting' | 'in_treatment' | 'under_observation' | 'discharged' | 'admitted';
  assigned_doctor?: string;
  estimated_wait_time: number;
}

const demoERPatients: ERPatient[] = [
  {
    id: 'ER001',
    name: 'Ramesh Kumar',
    age: 45,
    gender: 'male',
    phone: '+91 9876543210',
    triage_level: 'critical',
    chief_complaint: 'Chest pain, difficulty breathing',
    vital_signs: { bp: '180/110', pulse: 110, temperature: 37.2, spo2: 88 },
    arrival_time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'in_treatment',
    assigned_doctor: 'Dr. Sharma',
    estimated_wait_time: 0
  },
  {
    id: 'ER002',
    name: 'Priya Patel',
    age: 28,
    gender: 'female',
    phone: '+91 9876543211',
    triage_level: 'urgent',
    chief_complaint: 'Severe abdominal pain',
    vital_signs: { bp: '130/85', pulse: 95, temperature: 38.5 },
    arrival_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'waiting',
    estimated_wait_time: 15
  },
  {
    id: 'ER003',
    name: 'Amit Singh',
    age: 35,
    gender: 'male',
    phone: '+91 9876543212',
    triage_level: 'moderate',
    chief_complaint: 'Fractured arm from accident',
    vital_signs: { bp: '125/80', pulse: 85, temperature: 36.8 },
    arrival_time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'waiting',
    estimated_wait_time: 30
  },
  {
    id: 'ER004',
    name: 'Sunita Devi',
    age: 62,
    gender: 'female',
    phone: '+91 9876543213',
    triage_level: 'critical',
    chief_complaint: 'Stroke symptoms, facial drooping',
    vital_signs: { bp: '170/100', pulse: 105, temperature: 37.0 },
    arrival_time: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    status: 'in_treatment',
    assigned_doctor: 'Dr. Verma',
    estimated_wait_time: 0
  },
  {
    id: 'ER005',
    name: 'Rajesh Gupta',
    age: 52,
    gender: 'male',
    phone: '+91 9876543214',
    triage_level: 'minor',
    chief_complaint: 'Minor cut on hand',
    vital_signs: { bp: '120/80', pulse: 72, temperature: 36.6 },
    arrival_time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'waiting',
    estimated_wait_time: 45
  },
  {
    id: 'ER006',
    name: 'Anita Sharma',
    age: 30,
    gender: 'female',
    phone: '+91 9876543215',
    triage_level: 'urgent',
    chief_complaint: 'Allergic reaction, difficulty breathing',
    vital_signs: { bp: '140/90', pulse: 115, temperature: 37.8, spo2: 92 },
    arrival_time: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: 'under_observation',
    assigned_doctor: 'Dr. Patel',
    estimated_wait_time: 0
  }
];

const triageColors = {
  critical: 'bg-red-600 text-white',
  urgent: 'bg-orange-500 text-white',
  moderate: 'bg-yellow-500 text-white',
  minor: 'bg-green-500 text-white'
};

const statusColors = {
  waiting: 'bg-yellow-100 text-yellow-800',
  in_treatment: 'bg-blue-100 text-blue-800',
  under_observation: 'bg-purple-100 text-purple-800',
  discharged: 'bg-green-100 text-green-800',
  admitted: 'bg-indigo-100 text-indigo-800'
};

const ERWaiting: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<ERPatient[]>(demoERPatients);
  const [filteredPatients, setFilteredPatients] = useState<ERPatient[]>(demoERPatients);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTriage, setSelectedTriage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, selectedTriage, selectedStatus]);

  const filterPatients = () => {
    let filtered = [...patients];

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(search) ||
        patient.phone.includes(search) ||
        patient.id.toLowerCase().includes(search)
      );
    }

    if (selectedTriage !== 'all') {
      filtered = filtered.filter(patient => patient.triage_level === selectedTriage);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(patient => patient.status === selectedStatus);
    }

    // Sort by triage level priority and arrival time
    filtered.sort((a, b) => {
      const triagePriority = { critical: 0, urgent: 1, moderate: 2, minor: 3 };
      if (triagePriority[a.triage_level] !== triagePriority[b.triage_level]) {
        return triagePriority[a.triage_level] - triagePriority[b.triage_level];
      }
      return new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime();
    });

    setFilteredPatients(filtered);
  };

  const getWaitTimeDisplay = (arrivalTime: string) => {
    const diff = Math.floor((Date.now() - new Date(arrivalTime).getTime()) / 1000 / 60);
    if (diff < 60) return `${diff}m`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  const handleStatusChange = (patientId: string, newStatus: string) => {
    setPatients(prev => prev.map(patient =>
      patient.id === patientId ? { ...patient, status: newStatus as any } : patient
    ));
    toast.success(`Patient status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleAddPatient = () => {
    toast.success('Add patient modal would open here');
  };

  const handleRefresh = () => {
    toast.success('Data refreshed');
  };

  // Statistics
  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.triage_level === 'critical').length,
    urgent: patients.filter(p => p.triage_level === 'urgent').length,
    waiting: patients.filter(p => p.status === 'waiting').length,
    inTreatment: patients.filter(p => p.status === 'in_treatment').length,
    avgWaitTime: Math.round(
      patients.reduce((acc, p) => acc + p.estimated_wait_time, 0) / patients.length
    )
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ER Waiting</h1>
            <p className="text-gray-600 mt-1">Emergency Department Patient Tracking</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button 
            onClick={handleAddPatient}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-gray-900">{stats.critical}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-xl">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Waiting</p>
              <p className="text-2xl font-bold text-gray-900">{stats.waiting}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Treatment</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inTreatment}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Wait</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgWaitTime}m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={selectedTriage}
            onChange={(e) => setSelectedTriage(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="all">All Triage Levels</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="moderate">Moderate</option>
            <option value="minor">Minor</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="in_treatment">In Treatment</option>
            <option value="under_observation">Under Observation</option>
            <option value="discharged">Discharged</option>
            <option value="admitted">Admitted</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTriage('all');
              setSelectedStatus('all');
            }}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
            <p className="text-gray-600 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div 
              key={patient.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                {/* Triage Level */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold uppercase ${triageColors[patient.triage_level]}`}>
                    {patient.triage_level}
                  </span>
                </div>

                {/* Patient Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                    <span className="text-sm text-gray-500">{patient.age} yrs • {patient.gender}</span>
                    <span className="text-sm text-gray-400">ID: {patient.id}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Chief Complaint</p>
                      <p className="text-gray-600">{patient.chief_complaint}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Vital Signs</p>
                      <div className="flex flex-wrap gap-2">
                        {patient.vital_signs.bp && (
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">BP: {patient.vital_signs.bp}</span>
                        )}
                        {patient.vital_signs.pulse && (
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">Pulse: {patient.vital_signs.pulse}</span>
                        )}
                        {patient.vital_signs.temperature && (
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">Temp: {patient.vital_signs.temperature}°C</span>
                        )}
                        {patient.vital_signs.spo2 && (
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-sm">SpO2: {patient.vital_signs.spo2}%</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Wait: {getWaitTimeDisplay(patient.arrival_time)}</span>
                    </div>
                    {patient.assigned_doctor && (
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        <span>{patient.assigned_doctor}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex-shrink-0 flex flex-col items-end gap-3">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${statusColors[patient.status]}`}>
                    {patient.status.replace('_', ' ').toUpperCase()}
                  </span>

                  <div className="flex gap-2">
                    <select
                      value={patient.status}
                      onChange={(e) => handleStatusChange(patient.id, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="waiting">Waiting</option>
                      <option value="in_treatment">In Treatment</option>
                      <option value="under_observation">Under Observation</option>
                      <option value="discharged">Discharged</option>
                      <option value="admitted">Admitted</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Triage Guidelines */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-gray-900 mb-4">Triage Guidelines</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-sm text-gray-700"><strong>Critical:</strong> Immediate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm text-gray-700"><strong>Urgent:</strong> 15 min</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700"><strong>Moderate:</strong> 30-60 min</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700"><strong>Minor:</strong> 60+ min</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERWaiting;
