import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Users, Bed, FileText, ChevronLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeWrapper from '../../components/theme/ThemeWrapper';
import api from '../../services/api';
import ReportList from '../../components/reports/ReportList';
import ReportGenerator from '../../components/modals/ReportGenerator';
import AddPatientModal from '../../components/modals/AddPatientModal';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  address: string;
  city: string;
  state: string;
  blood_group: string;
  gender: string;
  phone: string;
  allergies: string;
  chronic_conditions: string;
  has_bed: boolean;
  bed_number?: string;
  room_number?: string;
  ward_type?: string;
  last_visit?: string;
}

// Demo patients data
const demoPatients: Patient[] = [
  {
    id: 'demo-patient-1',
    first_name: 'John',
    last_name: 'Doe',
    age: 45,
    address: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    blood_group: 'O+',
    gender: 'male',
    phone: '9876543210',
    allergies: 'Penicillin',
    chronic_conditions: 'Hypertension',
    has_bed: true,
    bed_number: 'A-101',
    room_number: '101',
    ward_type: 'General Ward',
    last_visit: '2026-02-21'
  },
  {
    id: 'demo-patient-2',
    first_name: 'Jane',
    last_name: 'Smith',
    age: 32,
    address: '456 Park Avenue',
    city: 'Delhi',
    state: 'Delhi',
    blood_group: 'A+',
    gender: 'female',
    phone: '9876543211',
    allergies: '',
    chronic_conditions: 'Diabetes Type 2',
    has_bed: false,
    last_visit: '2026-02-20'
  },
  {
    id: 'demo-patient-3',
    first_name: 'Michael',
    last_name: 'Brown',
    age: 28,
    address: '789 Oak Road',
    city: 'Bangalore',
    state: 'Karnataka',
    blood_group: 'B+',
    gender: 'male',
    phone: '9876543212',
    allergies: 'Dust',
    chronic_conditions: 'Asthma',
    has_bed: false,
    last_visit: '2026-02-19'
  },
  {
    id: 'demo-patient-4',
    first_name: 'Sarah',
    last_name: 'Wilson',
    age: 56,
    address: '321 Elm Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    blood_group: 'AB+',
    gender: 'female',
    phone: '9876543213',
    allergies: '',
    chronic_conditions: 'Arthritis',
    has_bed: true,
    bed_number: 'B-205',
    room_number: '205',
    ward_type: 'Private Room',
    last_visit: '2026-02-21'
  },
  {
    id: 'demo-patient-5',
    first_name: 'David',
    last_name: 'Lee',
    age: 67,
    address: '654 Pine Road',
    city: 'Hyderabad',
    state: 'Telangana',
    blood_group: 'O-',
    gender: 'male',
    phone: '9876543214',
    allergies: 'Sulfa drugs',
    chronic_conditions: 'Heart Disease',
    has_bed: true,
    bed_number: 'ICU-01',
    room_number: 'ICU',
    ward_type: 'ICU',
    last_visit: '2026-02-21'
  },
  {
    id: 'demo-patient-6',
    first_name: 'Emily',
    last_name: 'Johnson',
    age: 24,
    address: '987 Cedar Lane',
    city: 'Pune',
    state: 'Maharashtra',
    blood_group: 'A-',
    gender: 'female',
    phone: '9876543215',
    allergies: '',
    chronic_conditions: 'Migraine',
    has_bed: false,
    last_visit: '2026-02-18'
  },
  {
    id: 'demo-patient-7',
    first_name: 'Robert',
    last_name: 'Taylor',
    age: 41,
    address: '147 Maple Drive',
    city: 'Kolkata',
    state: 'West Bengal',
    blood_group: 'B-',
    gender: 'male',
    phone: '9876543216',
    allergies: '',
    chronic_conditions: 'Back Pain',
    has_bed: false,
    last_visit: '2026-02-17'
  },
  {
    id: 'demo-patient-8',
    first_name: 'Lisa',
    last_name: 'Anderson',
    age: 35,
    address: '258 Birch Boulevard',
    city: 'Ahmedabad',
    state: 'Gujarat',
    blood_group: 'O+',
    gender: 'female',
    phone: '9876543217',
    allergies: '',
    chronic_conditions: 'Thyroid',
    has_bed: false,
    last_visit: '2026-02-16'
  }
];

const MyPatients = () => {
  const { isDark } = useTheme();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'patients' | 'reports'>('patients');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showAddPatient, setShowAddPatient] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctor-dashboard/my-patients?limit=100');
      const realPatients = response.data.data.patients || [];
      
      // Merge real patients with demo patients
      if (realPatients.length === 0) {
        setPatients(demoPatients);
      } else {
        // Add demo indicator to demo patients
        const markedDemoPatients = demoPatients.map(p => ({
          ...p,
          id: p.id // Keep demo prefix
        }));
        setPatients([...realPatients, ...markedDemoPatients]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Use demo patients on error
      setPatients(demoPatients);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm);
    
    if (filter === 'admitted') return matchesSearch && patient.has_bed;
    if (filter === 'outpatient') return matchesSearch && !patient.has_bed;
    return matchesSearch;
  });

  const handleViewReports = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('reports');
  };

  const handleGenerateReport = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowReportGenerator(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ThemeWrapper>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>My Patients</h1>
          <p className={`mt-1 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Manage and view all your patients</p>
        </div>
        <button 
          onClick={() => setShowAddPatient(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add Patient
        </button>
      </div>

      {/* Tabs */}
      <div className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('patients');
              setSelectedPatient(null);
            }}
            className={`py-4 px-1 border-b-2 font-medium text-base flex items-center ${
              activeTab === 'patients'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <Users className="h-5 w-5 mr-2" />
            Patient List
            {patients.some(p => p.id.startsWith('demo-')) && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                Demo
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-medium text-base flex items-center ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600'
                : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <FileText className="h-5 w-5 mr-2" />
            Medical Reports
            {selectedPatient && (
              <span className={`ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {selectedPatient.first_name} {selectedPatient.last_name}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Patient List Tab */}
      {activeTab === 'patients' && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Patients</option>
                <option value="admitted">Admitted</option>
                <option value="outpatient">Outpatients</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Bed className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Admitted</p>
                  <p className="text-2xl font-bold text-green-600">{filteredPatients.filter(p => p.has_bed).length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Outpatients</p>
                  <p className="text-2xl font-bold text-purple-600">{filteredPatients.filter(p => !p.has_bed).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age/Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-medium">
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {patient.first_name} {patient.last_name}
                              {patient.id.startsWith('demo-') && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  Demo
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{patient.blood_group}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.age} years</div>
                        <div className="text-sm text-gray-500 capitalize">{patient.gender}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{patient.address}</div>
                        <div className="text-sm text-gray-500">{patient.city}, {patient.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.has_bed ? (
                          <div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Admitted
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              Bed {patient.bed_number}, Room {patient.room_number}
                            </div>
                            <div className="text-xs text-gray-400">{patient.ward_type}</div>
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Outpatient
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewReports(patient)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View Reports
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleGenerateReport(patient)}
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            New Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredPatients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No patients found matching your criteria
              </div>
            )}
          </div>
        </>
      )}

      {/* Medical Reports Tab */}
      {activeTab === 'reports' && selectedPatient && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveTab('patients');
                setSelectedPatient(null);
              }}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Patient List
            </button>
            
            <button
              onClick={() => setShowReportGenerator(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileText className="h-5 w-5 mr-2" />
              Generate New Report
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Viewing reports for</p>
                <p className="text-lg font-bold text-blue-900">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                  {selectedPatient.id.startsWith('demo-') && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                      Demo Patient
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">{selectedPatient.age} years, {selectedPatient.gender}</p>
                <p className="text-sm text-blue-600">Blood Group: {selectedPatient.blood_group}</p>
              </div>
            </div>
          </div>

          <ReportList
            patientId={selectedPatient.id}
            patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
            onGenerateNew={() => setShowReportGenerator(true)}
          />
        </div>
      )}

      {/* Report Generator Modal */}
      {showReportGenerator && selectedPatient && (
        <ReportGenerator
          isOpen={showReportGenerator}
          onClose={() => setShowReportGenerator(false)}
          onSuccess={() => {
            setShowReportGenerator(false);
            // Refresh report list if on reports tab
            if (activeTab === 'reports') {
              // ReportList component will auto-refresh
            }
          }}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
          patientAge={selectedPatient.age}
          patientGender={selectedPatient.gender}
        />
      )}

      {/* Add Patient Modal */}
      {showAddPatient && (
        <AddPatientModal
          onClose={() => setShowAddPatient(false)}
          onSuccess={() => {
            setShowAddPatient(false);
            fetchPatients();
          }}
        />
      )}
    </div>
    </ThemeWrapper>
  );
};

export default MyPatients;
