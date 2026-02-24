import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  User,
  Activity,
  Brain,
  Eye,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GCSAssessment {
  eye_response: number;
  verbal_response: number;
  motor_response: number;
  total_score: number;
}

const eyeOptions = [
  { value: 4, label: '4 - Spontaneous', description: 'Eyes open spontaneously' },
  { value: 3, label: '3 - To Speech', description: 'Eyes open to speech' },
  { value: 2, label: '2 - To Pain', description: 'Eyes open to pain' },
  { value: 1, label: '1 - None', description: 'No eye opening' },
];

const verbalOptions = [
  { value: 5, label: '5 - Oriented', description: 'Oriented to time, place, person' },
  { value: 4, label: '4 - Confused', description: 'Confused conversation' },
  { value: 3, label: '3 - Inappropriate', description: 'Inappropriate words' },
  { value: 2, label: '2 - Incomprehensible', description: 'Incomprehensible sounds' },
  { value: 1, label: '1 - None', description: 'No verbal response' },
];

const motorOptions = [
  { value: 6, label: '6 - Obeys Commands', description: 'Obeys commands' },
  { value: 5, label: '5 - Localizes Pain', description: 'Localizes pain' },
  { value: 4, label: '4 - Withdrawal', description: 'Withdrawal from pain' },
  { value: 3, label: '3 - Flexion', description: 'Flexion to pain (decorticate)' },
  { value: 2, label: '2 - Extension', description: 'Extension to pain (decerebrate)' },
  { value: 1, label: '1 - None', description: 'No motor response' },
];

const NurseGCSAssessment: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [assessment, setAssessment] = useState<GCSAssessment>({
    eye_response: 4,
    verbal_response: 5,
    motor_response: 6,
    total_score: 15
  });

  const calculateTotal = (eye: number, verbal: number, motor: number) => {
    return eye + verbal + motor;
  };

  const updateAssessment = (field: keyof GCSAssessment, value: number) => {
    const newAssessment = { ...assessment, [field]: value };
    newAssessment.total_score = calculateTotal(
      field === 'eye_response' ? value : newAssessment.eye_response,
      field === 'verbal_response' ? value : newAssessment.verbal_response,
      field === 'motor_response' ? value : newAssessment.motor_response
    );
    setAssessment(newAssessment);
  };

  const getSeverityLevel = (score: number) => {
    if (score >= 13) return { level: 'Mild', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 9) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'Severe', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const severity = getSeverityLevel(assessment.total_score);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('GCS Assessment saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link to="/nurse-dashboard" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GCS Assessment</h1>
              <p className="text-gray-600">Glasgow Coma Scale assessment tool</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter patient name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., P-12345"
              />
            </div>
          </div>

          {/* Eye Response */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <Eye className="h-4 w-4 mr-2 text-blue-600" />
              Eye Response (E)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eyeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    assessment.eye_response === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="eye_response"
                    value={option.value}
                    checked={assessment.eye_response === option.value}
                    onChange={() => updateAssessment('eye_response', option.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Verbal Response */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
              Verbal Response (V)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {verbalOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    assessment.verbal_response === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="verbal_response"
                    value={option.value}
                    checked={assessment.verbal_response === option.value}
                    onChange={() => updateAssessment('verbal_response', option.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Motor Response */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <Brain className="h-4 w-4 mr-2 text-orange-600" />
              Motor Response (M)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {motorOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    assessment.motor_response === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="motor_response"
                    value={option.value}
                    checked={assessment.motor_response === option.value}
                    onChange={() => updateAssessment('motor_response', option.value)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Total Score Display */}
          <div className={`p-6 rounded-xl ${severity.bg} border-2 ${severity.color.replace('text', 'border')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Total GCS Score</p>
                <p className="text-4xl font-bold">{assessment.total_score}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">Severity Level</p>
                <p className={`text-2xl font-bold ${severity.color}`}>{severity.level}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-current border-opacity-20">
              <p className="text-sm">
                E{assessment.eye_response} V{assessment.verbal_response} M{assessment.motor_response} = {assessment.total_score}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter any additional observations or notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
            <Link
              to="/nurse-dashboard"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NurseGCSAssessment;
