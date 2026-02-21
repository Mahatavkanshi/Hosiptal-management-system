import { useState, useEffect, useRef } from 'react';
import { X, Brain, Upload, Mic, MicOff, FileText, Loader2, Save, History, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

interface AISymptomCheckerProps {
  onClose: () => void;
  preselectedPatientId?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  disease?: string;
}

interface DiagnosisResult {
  diagnosis_id: string;
  ai_response: string;
  patient_id?: string;
  created_at: string;
}

interface DiagnosisHistory {
  id: string;
  symptoms: string;
  ai_response: string;
  created_at: string;
}

const AISymptomChecker = ({ onClose, preselectedPatientId }: AISymptomCheckerProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatientId || '');
  const [symptoms, setSymptoms] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setSymptoms(prev => prev + ' ' + finalTranscript);
        }
      };
      
      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Voice input error. Please try again.');
      };
      
      rec.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(rec);
    }
  }, []);

  // Fetch history when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      fetchHistory(selectedPatient);
    }
  }, [selectedPatient]);

  // Demo patients for testing - will merge with real data
  const demoPatients: Patient[] = [
    { id: 'demo-patient-1', first_name: 'John', last_name: 'Doe', age: 45, disease: 'Hypertension' },
    { id: 'demo-patient-2', first_name: 'Jane', last_name: 'Smith', age: 32, disease: 'Diabetes Type 2' },
    { id: 'demo-patient-3', first_name: 'Michael', last_name: 'Brown', age: 28, disease: 'Asthma' },
    { id: 'demo-patient-4', first_name: 'Sarah', last_name: 'Wilson', age: 56, disease: 'Arthritis' },
    { id: 'demo-patient-5', first_name: 'David', last_name: 'Lee', age: 67, disease: 'Heart Disease' },
    { id: 'demo-patient-6', first_name: 'Emily', last_name: 'Johnson', age: 24, disease: 'Migraine' },
    { id: 'demo-patient-7', first_name: 'Robert', last_name: 'Taylor', age: 41, disease: 'Back Pain' },
    { id: 'demo-patient-8', first_name: 'Lisa', last_name: 'Anderson', age: 35, disease: 'Thyroid' },
  ];

  const fetchPatients = async () => {
    try {
      const response = await api.get('/doctor-dashboard/my-patients?limit=50');
      const patientData = response.data?.data?.patients || [];
      
      // Merge real patients with demo patients
      // If no real patients, show demo patients
      if (patientData.length === 0) {
        console.log('No real patients found, using demo patients');
        setPatients(demoPatients);
      } else {
        // Combine real and demo patients
        const combinedPatients = [...patientData, ...demoPatients];
        setPatients(combinedPatients);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Use demo patients if API fails
      console.log('API failed, using demo patients');
      setPatients(demoPatients);
    }
  };

  const fetchHistory = async (patientId: string) => {
    try {
      const data = await aiService.getPatientHistory(patientId);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      toast.success('Voice input started. Speak now...');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalFiles = [...files, ...newFiles];
      
      if (totalFiles.length > 5) {
        toast.error('Maximum 5 files allowed');
        return;
      }
      
      // Check file sizes (10MB limit)
      const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('Files must be less than 10MB each');
        return;
      }
      
      setFiles(totalFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter symptoms');
      return;
    }

    setLoading(true);
    try {
      const response = await aiService.analyzeSymptoms({
        symptoms,
        patient_id: selectedPatient || undefined,
        files: files.length > 0 ? files : undefined
      });

      if (response.success && response.data) {
        setResult(response.data);
        toast.success('AI analysis complete!');
        
        // Refresh history if patient is selected
        if (selectedPatient) {
          fetchHistory(selectedPatient);
        }
      } else {
        toast.error(response.message || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      if (error.response?.status === 503) {
        toast.error('AI service unavailable, please proceed manually');
      } else {
        toast.error(error.response?.data?.message || 'Failed to analyze symptoms');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToRecord = async () => {
    if (!result || !selectedPatient) {
      toast.error('Please select a patient and analyze first');
      return;
    }

    try {
      // Save AI diagnosis reference to patient's medical record
      await api.post('/medical-records', {
        patient_id: selectedPatient,
        diagnosis: 'AI-Assisted Analysis',
        notes: `AI Analysis:\n${result.ai_response}`,
        ai_diagnosis_id: result.diagnosis_id
      });

      toast.success('Saved to patient medical record!');
    } catch (error) {
      console.error('Error saving to record:', error);
      toast.error('Failed to save to medical record');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center text-white">
            <Brain className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">AI Medical Assistant</h2>
              <p className="text-sm text-blue-100">Get AI-powered diagnostic suggestions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(90vh-80px)]">
          {/* Left Panel - Input Form */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200">
            <div className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>Select Patient (Optional)</span>
                  {patients.some(p => p.id.startsWith('demo-')) && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Demo patients available
                    </span>
                  )}
                </label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a patient...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name} ({patient.age} years)
                      {patient.disease ? ` - ${patient.disease}` : ''}
                      {patient.id.startsWith('demo-') ? ' [Demo]' : ''}
                    </option>
                  ))}
                </select>
                {patients.some(p => p.id.startsWith('demo-')) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Demo patients are shown for testing. Real patient data will appear when available.
                  </p>
                )}
              </div>

              {/* Symptoms Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Symptoms *
                </label>
                <div className="relative">
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={6}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-12"
                    placeholder="Describe the patient's symptoms in detail. Example: Patient has fever for 3 days, headache, body ache, loss of appetite..."
                  />
                  <button
                    onClick={toggleVoiceInput}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start voice input'}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
                {isRecording && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <span className="animate-pulse mr-2">●</span>
                    Recording... Click microphone to stop
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Reports (Optional)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag files here</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB (Max 5 files)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History Toggle */}
              {selectedPatient && history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  <History className="h-4 w-4 mr-1" />
                  {showHistory ? 'Hide' : 'Show'} AI Analysis History ({history.length})
                  {showHistory ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </button>
              )}

              {/* History List */}
              {showHistory && history.length > 0 && (
                <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                  <h4 className="font-medium text-gray-900">Previous AI Analyses</h4>
                  {history.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">{formatDate(item.created_at)}</p>
                      <p className="text-sm text-gray-700 mb-2"><strong>Symptoms:</strong> {item.symptoms.substring(0, 100)}...</p>
                      <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                        {item.ai_response.substring(0, 150)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={loading || !symptoms.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Analyze Symptoms
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                <Brain className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">AI Analysis Results</p>
                <p className="text-sm mt-2">Enter symptoms and click "Analyze" to get AI suggestions</p>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-sm">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      This AI assistant provides suggestions only. Final diagnosis and treatment decisions must be made by a qualified doctor.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">AI Analysis Results</h3>
                  <span className="text-xs text-gray-500">{formatDate(result.created_at)}</span>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {result.ai_response}
                  </pre>
                </div>

                {selectedPatient && (
                  <button
                    onClick={handleSaveToRecord}
                    className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save to Patient Medical Record
                  </button>
                )}

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> This is AI-generated assistance. Final diagnosis by a qualified doctor is required.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISymptomChecker;
