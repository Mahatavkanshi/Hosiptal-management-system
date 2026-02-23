import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Users, Bed, FileText, ChevronLeft } from 'lucide-react';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';
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
  const { theme, isDark } = useTheme();
  const themeColors = getThemeColors(theme);
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
      <div className={`flex items-center justify-center h-64 ${isDark ? 'bg-slate-900/50 rounded-2xl' : ''}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
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
          className={`mt-4 md:mt-0 inline-flex items-center px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
            isDark 
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-600' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add Patient
        </button>
      </div>

      {/* Tabs - Dark Theme */}
      <div className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('patients');
              setSelectedPatient(null);
            }}
            className={`py-4 px-1 border-b-2 font-bold text-base flex items-center transition-colors ${
              activeTab === 'patients'
                ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-500 text-blue-600')
                : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <div className={`p-1.5 rounded-lg mr-2 ${activeTab === 'patients' && isDark ? 'bg-blue-500/20' : ''}`}>
              <Users className="h-5 w-5" />
            </div>
            Patient List
            {patients.some(p => p.id.startsWith('demo-')) && (
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
                isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-800'
              }`}>
                Demo
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-1 border-b-2 font-bold text-base flex items-center transition-colors ${
              activeTab === 'reports'
                ? (isDark ? 'border-blue-500 text-blue-400' : 'border-blue-500 text-blue-600')
                : `border-transparent ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`
            }`}
          >
            <div className={`p-1.5 rounded-lg mr-2 ${activeTab === 'reports' && isDark ? 'bg-blue-500/20' : ''}`}>
              <FileText className="h-5 w-5" />
            </div>
            Medical Reports
            {selectedPatient && (
              <span className={`ml-2 font-normal ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
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
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search patients by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all ${
                  isDark 
                    ? 'bg-slate-800 border border-slate-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                    : 'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <Filter className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`rounded-xl px-4 py-3 transition-all ${
                  isDark 
                    ? 'bg-slate-800 border border-slate-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                    : 'border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                }`}
              >
                <option value="all" className={isDark ? 'bg-slate-800' : ''}>All Patients</option>
                <option value="admitted" className={isDark ? 'bg-slate-800' : ''}>Admitted</option>
                <option value="outpatient" className={isDark ? 'bg-slate-800' : ''}>Outpatients</option>
              </select>
            </div>
          </div>

          {/* Stats - Dark Theme Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-blue-500/50 shadow-lg' 
                : 'bg-white border border-gray-200 shadow-md'
            }`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Users className={`h-7 w-7 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Patients</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredPatients.length}</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-emerald-500/50 shadow-lg' 
                : 'bg-white border border-gray-200 shadow-md'
            }`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-green-100'}`}>
                  <Bed className={`h-7 w-7 ${isDark ? 'text-emerald-400' : 'text-green-600'}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Admitted</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-green-600'}`}>{filteredPatients.filter(p => p.has_bed).length}</p>
                </div>
              </div>
            </div>
            
            <div className={`rounded-2xl p-5 transition-all duration-300 hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 hover:border-purple-500/50 shadow-lg' 
                : 'bg-white border border-gray-200 shadow-md'
            }`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <FileText className={`h-7 w-7 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Outpatients</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{filteredPatients.filter(p => !p.has_bed).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patients Table - Dark Theme */}
          <div className={`rounded-2xl overflow-hidden border shadow-xl ${
            isDark 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y">
                <thead className={`${isDark ? 'bg-slate-800/80' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Patient</th>
                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Age/Gender</th>
                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Contact</th>
                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Address</th>
                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bed Status</th>
                    <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'bg-slate-900/50 divide-slate-700/50' : 'bg-white divide-gray-200'}`}>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                            <span className={`font-bold text-lg ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`text-base font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {patient.first_name} {patient.last_name}
                              {patient.id.startsWith('demo-') && (
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded font-semibold ${
                                  isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  Demo
                                </span>
                              )}
                            </div>
                            <div className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{patient.blood_group}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{patient.age} years</div>
                        <div className={`text-sm capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{patient.gender}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{patient.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{patient.address}</div>
                        <div className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{patient.city}, {patient.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.has_bed ? (
                          <div>
                            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isDark 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              Admitted
                            </span>
                            <div className={`text-xs mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Bed {patient.bed_number}, Room {patient.room_number}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{patient.ward_type}</div>
                          </div>
                        ) : (
                          <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isDark 
                              ? 'bg-gray-700 text-gray-400 border border-gray-600' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            Outpatient
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewReports(patient)}
                            className={`font-bold transition-colors ${
                              isDark 
                                ? 'text-blue-400 hover:text-blue-300' 
                                : 'text-blue-600 hover:text-blue-900'
                            }`}
                          >
                            View Reports
                          </button>
                          <span className={isDark ? 'text-slate-600' : 'text-gray-300'}>|</span>
                          <button
                            onClick={() => handleGenerateReport(patient)}
                            className={`font-bold transition-colors ${
                              isDark 
                                ? 'text-emerald-400 hover:text-emerald-300' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
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
              <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No patients found matching your criteria
              </div>
            )}
          </div>
        </>
      )}

      {/* Medical Reports Tab */}
      {activeTab === 'reports' && selectedPatient && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveTab('patients');
                setSelectedPatient(null);
              }}
              className={`flex items-center font-bold transition-colors ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <div className={`p-2 rounded-lg mr-2 ${isDark ? 'bg-blue-500/20' : ''}`}>
                <ChevronLeft className="h-5 w-5" />
              </div>
              Back to Patient List
            </button>
            
            <button
              onClick={() => setShowReportGenerator(true)}
              className={`flex items-center px-5 py-2.5 rounded-xl font-bold transition-all ${
                isDark 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              Generate New Report
            </button>
          </div>

          <div className={`rounded-xl border p-6 ${
            isDark 
              ? 'bg-gradient-to-r from-blue-900/20 to-slate-800 border-blue-500/30' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl mr-4 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Users className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Viewing reports for</p>
                  <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                    {selectedPatient.first_name} {selectedPatient.last_name}
                    {selectedPatient.id.startsWith('demo-') && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded font-semibold ${
                        isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-800'
                      }`}>
                        Demo Patient
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-blue-700'}`}>
                  {selectedPatient.age} years, <span className="capitalize">{selectedPatient.gender}</span>
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  Blood Group: {selectedPatient.blood_group}
                </p>
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
