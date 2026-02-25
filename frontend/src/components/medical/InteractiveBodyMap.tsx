import { useState, useEffect } from 'react';
import { 
  User, 
  Heart, 
  Activity, 
  Thermometer, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Stethoscope,
  Plus,
  ArrowLeft
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSelector from '../theme/ThemeSelector';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

// Body parts configuration with their positions and related medical keywords
interface BodyPart {
  id: string;
  name: string;
  keywords: string[];
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  recordCount: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  blood_group: string;
}

interface MedicalRecord {
  id: string;
  patient_id: string;
  diagnosis: string;
  chief_complaint: string;
  examination_notes: string;
  visit_date: string;
  follow_up_date?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  doctor_specialization?: string;
}

const bodyParts: Omit<BodyPart, 'status' | 'recordCount'>[] = [
  { id: 'head', name: 'Head & Brain', keywords: ['headache', 'migraine', 'brain', 'concussion', 'stroke', 'neurological'], position: { x: 50, y: 9 }, size: 'medium' },
  { id: 'eyes', name: 'Eyes', keywords: ['eye', 'vision', 'cataract', 'glaucoma', 'retina', 'ophthalmology'], position: { x: 45, y: 8 }, size: 'small' },
  { id: 'ears', name: 'Ears', keywords: ['ear', 'hearing', 'tinnitus', 'otitis', 'ENT'], position: { x: 55, y: 8 }, size: 'small' },
  { id: 'nose', name: 'Nose & Throat', keywords: ['nose', 'sinus', 'throat', 'tonsil', 'respiratory'], position: { x: 50, y: 14 }, size: 'small' },
  { id: 'chest', name: 'Chest & Lungs', keywords: ['chest', 'lung', 'pneumonia', 'asthma', 'COPD', 'tuberculosis', 'respiratory'], position: { x: 50, y: 30 }, size: 'large' },
  { id: 'heart', name: 'Heart', keywords: ['heart', 'cardiac', 'hypertension', 'blood pressure', 'cardiovascular', 'arrhythmia'], position: { x: 43, y: 32 }, size: 'medium' },
  { id: 'stomach', name: 'Stomach & Digestive', keywords: ['stomach', 'gastric', 'ulcer', 'digestive', 'liver', 'gallbladder', 'pancreas'], position: { x: 47, y: 45 }, size: 'medium' },
  { id: 'abdomen', name: 'Abdomen & Intestines', keywords: ['abdomen', 'intestine', 'bowel', 'appendicitis', 'hernia', 'colitis'], position: { x: 50, y: 53 }, size: 'large' },
  { id: 'kidneys', name: 'Kidneys & Urinary', keywords: ['kidney', 'urinary', 'bladder', 'renal', 'UTI', 'prostate'], position: { x: 38, y: 52 }, size: 'medium' },
  { id: 'spine', name: 'Spine & Back', keywords: ['spine', 'back', 'vertebrae', 'disc', 'scoliosis', 'back pain'], position: { x: 50, y: 40 }, size: 'large' },
  { id: 'hips', name: 'Hips & Pelvis', keywords: ['hip', 'pelvis', 'joint', 'fracture', 'orthopedic'], position: { x: 50, y: 58 }, size: 'medium' },
  { id: 'legs', name: 'Legs & Feet', keywords: ['leg', 'foot', 'knee', 'ankle', 'hip', 'fracture', 'varicose', 'circulation'], position: { x: 35, y: 75 }, size: 'large' },
  { id: 'skin', name: 'Skin & Dermatology', keywords: ['skin', 'dermatitis', 'rash', 'eczema', 'psoriasis', 'acne', 'wound'], position: { x: 62, y: 35 }, size: 'medium' },
  { id: 'bones', name: 'Bones & Joints', keywords: ['bone', 'joint', 'arthritis', 'osteoporosis', 'fracture', 'orthopedic'], position: { x: 65, y: 50 }, size: 'medium' },
];

// Generate demo medical records for visualization
const generateDemoRecords = (patientId: string): MedicalRecord[] => [
  {
    id: 'demo-record-1',
    patient_id: patientId,
    diagnosis: 'Hypertension - Stage 1',
    chief_complaint: 'Headache and dizziness',
    examination_notes: 'Blood pressure elevated at 140/90. Patient reports frequent headaches.',
    visit_date: '2026-02-15',
    follow_up_date: '2026-03-15',
    doctor_first_name: 'Sarah',
    doctor_last_name: 'Johnson',
    doctor_specialization: 'Cardiology'
  },
  {
    id: 'demo-record-2',
    patient_id: patientId,
    diagnosis: 'Type 2 Diabetes',
    chief_complaint: 'Increased thirst and frequent urination',
    examination_notes: 'Fasting glucose: 180 mg/dL. HbA1c: 8.2%. Started on Metformin.',
    visit_date: '2026-01-20',
    follow_up_date: '2026-02-20',
    doctor_first_name: 'Michael',
    doctor_last_name: 'Chen',
    doctor_specialization: 'Endocrinology'
  },
  {
    id: 'demo-record-3',
    patient_id: patientId,
    diagnosis: 'Lower Back Pain',
    chief_complaint: 'Chronic lower back pain',
    examination_notes: 'MRI shows mild disc herniation at L4-L5. Physical therapy recommended.',
    visit_date: '2026-02-10',
    doctor_first_name: 'Emily',
    doctor_specialization: 'Orthopedics'
  },
  {
    id: 'demo-record-4',
    patient_id: patientId,
    diagnosis: 'Seasonal Allergies',
    chief_complaint: 'Sneezing and nasal congestion',
    examination_notes: 'Allergic rhinitis. Prescribed antihistamines.',
    visit_date: '2026-02-18',
    doctor_first_name: 'David',
    doctor_last_name: 'Wilson',
    doctor_specialization: 'ENT'
  }
];

const InteractiveBodyMap = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  // Single patient - current logged in user
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [bodyPartStats, setBodyPartStats] = useState<BodyPart[]>([]);

  // Set current user as patient on mount and load demo data
  useEffect(() => {
    const currentPatient: Patient = {
      id: user?.id || 'demo-1',
      first_name: user?.first_name || 'John',
      last_name: user?.last_name || 'Doe',
      age: 45,
      gender: 'male',
      blood_group: 'O+'
    };
    setSelectedPatient(currentPatient);
    
    // Load demo records immediately
    const demoRecords = generateDemoRecords(currentPatient.id);
    setMedicalRecords(demoRecords);
    setLoading(false);
  }, [user]);

  // Fetch medical records when patient is set
  useEffect(() => {
    if (selectedPatient) {
      fetchMedicalRecords(selectedPatient.id);
    }
  }, [selectedPatient]);

  // Update body part stats when records change
  useEffect(() => {
    if (medicalRecords.length > 0) {
      updateBodyPartStats();
    }
  }, [medicalRecords]);

  const fetchMedicalRecords = async (patientId: string) => {
    try {
      setLoading(true);
      
      if (patientId.startsWith('demo-')) {
        // Use demo records for demo patients
        const demoRecords = generateDemoRecords(patientId);
        setMedicalRecords(demoRecords);
      } else {
        // Fetch real records
        const response = await api.get(`/patients/medical-history`);
        const records = response.data.data || [];
        setMedicalRecords(records);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      // Fallback to demo records
      const demoRecords = generateDemoRecords(patientId);
      setMedicalRecords(demoRecords);
    } finally {
      setLoading(false);
    }
  };

  const updateBodyPartStats = () => {
    const stats = bodyParts.map(part => {
      const matchingRecords = medicalRecords.filter(record => {
        const searchText = `${record.diagnosis} ${record.chief_complaint} ${record.examination_notes}`.toLowerCase();
        return part.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });

      let status: BodyPart['status'] = 'healthy';
      if (matchingRecords.length > 0) {
        const hasRecent = matchingRecords.some(r => {
          const visitDate = new Date(r.visit_date);
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return visitDate > threeMonthsAgo;
        });
        
        const hasSerious = matchingRecords.some(r => {
          const seriousKeywords = ['surgery', 'critical', 'severe', 'chronic', 'emergency'];
          const text = `${r.diagnosis} ${r.chief_complaint}`.toLowerCase();
          return seriousKeywords.some(k => text.includes(k));
        });

        if (hasSerious) status = 'critical';
        else if (hasRecent) status = 'warning';
        else status = 'healthy';
      }

      return {
        ...part,
        status,
        recordCount: matchingRecords.length
      };
    });

    setBodyPartStats(stats);
  };

  const getStatusColor = (status: BodyPart['status']) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'critical': return 'bg-rose-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBorderColor = (status: BodyPart['status']) => {
    switch (status) {
      case 'healthy': return 'border-emerald-500';
      case 'warning': return 'border-amber-500';
      case 'critical': return 'border-rose-500';
      default: return 'border-gray-300';
    }
  };

  const getSizeClasses = (size: BodyPart['size']) => {
    switch (size) {
      case 'small': return 'w-4 h-4';
      case 'medium': return 'w-6 h-6';
      case 'large': return 'w-8 h-8';
    }
  };

  const getFilteredRecords = () => {
    if (!selectedBodyPart) return medicalRecords;
    
    const part = bodyPartStats.find(p => p.id === selectedBodyPart);
    if (!part) return medicalRecords;

    return medicalRecords.filter(record => {
      const searchText = `${record.diagnosis} ${record.chief_complaint} ${record.examination_notes}`.toLowerCase();
      return part.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
  };

  const filteredRecords = getFilteredRecords();

  if (loading && !selectedPatient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Dynamic styles based on theme
  const getThemeStyles = () => {
    if (isDark) {
      return {
        container: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900',
        card: 'bg-slate-800/80 border-slate-700',
        text: 'text-white',
        subtext: 'text-slate-300',
        bodyBg: 'from-slate-900 via-blue-900 to-slate-900',
      };
    }
    // Premium Light Theme (default)
    return {
      container: 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20',
      card: 'bg-white/90 backdrop-blur-sm border-white/50 shadow-lg shadow-blue-100/50',
      text: 'text-slate-800',
      subtext: 'text-slate-500',
      bodyBg: 'from-blue-100/80 via-cyan-100/60 to-blue-100/80',
    };
  };

  const styles = getThemeStyles();

  return (
    <div className={`min-h-screen p-6 space-y-6 ${styles.container}`}>
      {/* Back Button */}
      <Link 
        to="/patient-portal"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Medical History
          </h1>
          <p className={`mt-1 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Visualize your health by body system
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Theme Selector */}
          <ThemeSelector />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Body Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info Card - Theme Aware */}
          {selectedPatient && (
            <div className={`rounded-2xl p-6 ${isDark ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' : 'bg-gradient-to-r from-blue-400/90 to-cyan-400/90 backdrop-blur-sm text-white shadow-lg shadow-blue-200/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </h2>
                    <p className="text-blue-100">
                      {selectedPatient.age} years • {selectedPatient.gender} • Blood Group {selectedPatient.blood_group}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{medicalRecords.length}</div>
                  <div className="text-blue-100 text-sm">Total Records</div>
                </div>
              </div>
            </div>
          )}

          {/* Body Map Visualization - Theme Aware */}
          <div className={`rounded-2xl p-6 ${styles.card}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${styles.text} flex items-center`}>
                <Activity className="h-5 w-5 mr-2 text-blue-500" />
                Body System Overview
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-200"></div>
                  <span className={styles.subtext}>Healthy</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2 shadow-sm shadow-amber-200"></div>
                  <span className={styles.subtext}>Monitor</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-rose-500 mr-2 shadow-sm shadow-rose-200"></div>
                  <span className={styles.subtext}>Critical</span>
                </div>
              </div>
            </div>

            {/* Interactive Body Map - Premium Design */}
            <div className="relative w-full max-w-sm mx-auto">
              {/* Main Container with Glassmorphism - Theme Aware */}
              <div className={`relative aspect-[2/3] rounded-3xl border shadow-2xl overflow-hidden ${
                isDark 
                  ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-blue-400/30' 
                  : 'bg-gradient-to-br from-blue-100/90 via-cyan-100/80 to-blue-100/90 border-white/60 backdrop-blur-md shadow-blue-200/50'
              }`}>
                {/* Animated Background Effects */}
                <div className="absolute inset-0">
                  {/* Gradient Orbs */}
                  <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                  
                  {/* Grid Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `
                      linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                  }}></div>
                  
                  {/* Scan Line Effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-[scan_4s_linear_infinite]"></div>
                  </div>
                </div>
                
                {/* Corner Decorations */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-400/50 rounded-tl-lg"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-400/50 rounded-tr-lg"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-400/50 rounded-bl-lg"></div>
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-400/50 rounded-br-lg"></div>
                
                {/* Body Image Container - Enhanced Visibility */}
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  {/* Multi-layer Glow Behind Body */}
                  <div className="absolute inset-4 bg-gradient-to-t from-cyan-500/30 via-blue-500/20 to-transparent rounded-3xl blur-3xl"></div>
                  <div className="absolute inset-8 bg-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>
                  
                  {/* Body Image with Enhanced Filters */}
                  <img 
                    src="/images/body-diagram.png"
                    alt="Human Body Medical Diagram"
                    className="relative w-full h-full object-contain z-10 transition-all duration-500"
                    style={{ 
                      filter: `
                        brightness(1.4) 
                        contrast(1.3) 
                        saturate(1.5) 
                        drop-shadow(0 0 40px rgba(6, 182, 212, 0.6)) 
                        drop-shadow(0 0 80px rgba(59, 130, 246, 0.4))
                        drop-shadow(0 0 120px rgba(147, 197, 253, 0.3))
                      `,
                    }}
                  />
                  
                  {/* Shine/Highlight Effect Overlay */}
                  <div 
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
                      borderRadius: '1.5rem'
                    }}
                  ></div>
                </div>

                {/* Interactive Hotspots - Enhanced */}
                {bodyPartStats.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => setSelectedBodyPart(selectedBodyPart === part.id ? null : part.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      selectedBodyPart === part.id 
                        ? 'z-30 scale-125' 
                        : 'z-10 hover:scale-110'
                    }`}
                    style={{
                      left: `${part.position.x}%`,
                      top: `${part.position.y}%`,
                    }}
                    title={`${part.name} (${part.recordCount} records)`}
                  >
                    {/* Outer Glow Ring */}
                    <div className={`absolute inset-0 rounded-full ${getStatusColor(part.status)} opacity-30 animate-ping`} style={{ transform: 'scale(1.5)' }}></div>
                    
                    {/* Main Dot */}
                    <div className={`relative ${getSizeClasses(part.size)} ${getStatusColor(part.status)} rounded-full shadow-lg border-2 border-white/80 flex items-center justify-center transition-all duration-300`}
                      style={{
                        boxShadow: `0 0 20px ${part.status === 'critical' ? 'rgba(244, 63, 94, 0.6)' : part.status === 'warning' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`
                      }}
                    >
                      {/* Inner Pulse */}
                      {part.recordCount > 0 && (
                        <div className={`absolute inset-0 rounded-full animate-pulse ${getStatusColor(part.status)} opacity-40`}></div>
                      )}
                      
                      {/* Count Badge */}
                      {part.recordCount > 0 && (
                        <span className="relative text-white text-[10px] font-bold z-10 drop-shadow-md">
                          {part.recordCount}
                        </span>
                      )}
                    </div>
                    
                    {/* Selection Indicator */}
                    {selectedBodyPart === part.id && (
                      <div className="absolute inset-0 rounded-full ring-4 ring-cyan-400 ring-offset-2 ring-offset-transparent -m-2"></div>
                    )}
                  </button>
                ))}
                
                {/* Status Labels on Image - Enhanced */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 shadow-lg ${isDark ? 'bg-emerald-500/20 border-emerald-400/50 shadow-emerald-500/20' : 'bg-emerald-100 border-emerald-300 shadow-emerald-200/50'}`}>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                    <span className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{bodyPartStats.filter(p => p.status === 'healthy' && p.recordCount > 0).length} Healthy</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 shadow-lg ${isDark ? 'bg-amber-500/20 border-amber-400/50 shadow-amber-500/20' : 'bg-amber-100 border-amber-300 shadow-amber-200/50'}`}>
                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
                    <span className={`text-sm font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{bodyPartStats.filter(p => p.status === 'warning').length} Monitor</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 shadow-lg ${isDark ? 'bg-rose-500/20 border-rose-400/50 shadow-rose-500/20' : 'bg-rose-100 border-rose-300 shadow-rose-200/50'}`}>
                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></div>
                    <span className={`text-sm font-bold ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{bodyPartStats.filter(p => p.status === 'critical').length} Critical</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements Below */}
              <div className="flex justify-center mt-4 gap-2">
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full opacity-50"></div>
              </div>
            </div>

            {/* Body Part Details - Enhanced Highlighting */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {bodyPartStats.filter(p => p.recordCount > 0).map(part => (
                <button
                  key={part.id}
                  onClick={() => setSelectedBodyPart(selectedBodyPart === part.id ? null : part.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300 transform hover:scale-105 ${
                    selectedBodyPart === part.id 
                      ? `ring-2 ring-offset-2 ${isDark ? 'ring-offset-slate-800 ring-blue-400' : 'ring-offset-white ring-blue-500'} ${getStatusBorderColor(part.status)} ${isDark ? 'bg-slate-700' : 'bg-blue-50'}` 
                      : `${isDark ? 
                          `bg-slate-800 border-slate-600 hover:border-${part.status === 'critical' ? 'rose' : part.status === 'warning' ? 'amber' : 'emerald'}-400 hover:shadow-lg hover:shadow-${part.status === 'critical' ? 'rose' : part.status === 'warning' ? 'amber' : 'emerald'}-500/20` 
                          : `bg-white border-gray-200 hover:border-${part.status === 'critical' ? 'rose' : part.status === 'warning' ? 'amber' : 'emerald'}-300 shadow-md hover:shadow-lg hover:shadow-${part.status === 'critical' ? 'rose' : part.status === 'warning' ? 'amber' : 'emerald'}-100/50`}`
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(part.status)} ${part.status === 'critical' ? 'animate-pulse' : ''}`}></div>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{part.name}</span>
                  </div>
                  <p className={`text-sm mt-2 font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{part.recordCount} records</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Records & Stats - Theme Aware */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white' : 'bg-white/90 backdrop-blur-sm border border-rose-100 shadow-lg shadow-rose-100/30'}`}>
              <AlertCircle className={`h-6 w-6 mb-2 ${isDark ? 'text-white' : 'text-rose-500'}`} />
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-rose-600'}`}>
                {bodyPartStats.filter(p => p.status === 'critical').length}
              </div>
              <div className={`text-sm ${isDark ? 'text-rose-100' : 'text-rose-500/70'}`}>Critical Areas</div>
            </div>
            
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' : 'bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg shadow-amber-100/30'}`}>
              <Thermometer className={`h-6 w-6 mb-2 ${isDark ? 'text-white' : 'text-amber-500'}`} />
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-amber-600'}`}>
                {bodyPartStats.filter(p => p.status === 'warning').length}
              </div>
              <div className={`text-sm ${isDark ? 'text-amber-100' : 'text-amber-500/70'}`}>Monitor Areas</div>
            </div>
            
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' : 'bg-white/90 backdrop-blur-sm border border-emerald-100 shadow-lg shadow-emerald-100/30'}`}>
              <CheckCircle className={`h-6 w-6 mb-2 ${isDark ? 'text-white' : 'text-emerald-500'}`} />
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-emerald-600'}`}>
                {bodyPartStats.filter(p => p.status === 'healthy' && p.recordCount > 0).length}
              </div>
              <div className={`text-sm ${isDark ? 'text-emerald-100' : 'text-emerald-500/70'}`}>Healthy Areas</div>
            </div>
            
            <div className={`rounded-xl p-4 ${isDark ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-white/90 backdrop-blur-sm border border-blue-100 shadow-lg shadow-blue-100/30'}`}>
              <Heart className={`h-6 w-6 mb-2 ${isDark ? 'text-white' : 'text-blue-500'}`} />
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-blue-600'}`}>{medicalRecords.length}</div>
              <div className={`text-sm ${isDark ? 'text-blue-100' : 'text-blue-500/70'}`}>Total Visits</div>
            </div>
          </div>

          {/* Medical Records List - Theme Aware */}
          <div className={`rounded-2xl shadow-sm ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  {selectedBodyPart ? 
                    `${bodyPartStats.find(p => p.id === selectedBodyPart)?.name} Records` : 
                    'Recent Medical Records'
                  }
                </h3>
                {selectedBodyPart && (
                  <button
                    onClick={() => setSelectedBodyPart(null)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {filteredRecords.length === 0 ? (
                <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Stethoscope className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className="text-lg">No medical records found</p>
                  <p className="text-base mt-1">
                    {selectedBodyPart ? 'for this body system' : 'for this patient'}
                  </p>
                </div>
              ) : (
                <div className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                  {filteredRecords.map((record) => (
                    <div key={record.id} className={`p-4 transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {new Date(record.visit_date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            {record.doctor_specialization && (
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {record.doctor_specialization}
                              </span>
                            )}
                          </div>
                          <h4 className={`font-medium text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{record.diagnosis}</h4>
                          <p className={`text-base line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{record.chief_complaint}</p>
                          
                          {record.doctor_first_name && (
                            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Dr. {record.doctor_first_name} {record.doctor_last_name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                      
                      {record.follow_up_date && (
                        <div className="mt-2 flex items-center text-xs text-amber-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          Follow-up: {new Date(record.follow_up_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Record Button */}
            <div className="p-4 border-t border-gray-200">
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-5 w-5 mr-2" />
                Add New Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveBodyMap;
