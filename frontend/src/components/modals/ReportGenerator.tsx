import { useState, useEffect } from 'react';
import { X, FileText, Save, Download, Plus, Trash2, Loader2, Calendar, Stethoscope, Pill, Clipboard, Activity } from 'lucide-react';
import api from '../../services/api';
import reportService, { ReportData, PrescriptionItem } from '../../services/reportService';
import toast from 'react-hot-toast';

interface ReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  defaultType?: 'medical' | 'prescription' | 'discharge' | 'lab';
}

const ReportGenerator = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
  patientName,
  patientAge,
  patientGender,
  defaultType = 'prescription'
}: ReportGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'preview'>('report');
  
  // Form state
  const [reportType, setReportType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [examinationNotes, setExaminationNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  // Set default title based on type
  useEffect(() => {
    const titles: { [key: string]: string } = {
      'prescription': 'Medical Prescription',
      'medical': 'Medical Examination Report',
      'discharge': 'Discharge Summary',
      'lab': 'Laboratory Test Report'
    };
    if (!title) {
      setTitle(titles[reportType] || '');
    }
  }, [reportType]);

  if (!isOpen) return null;

  const reportTypes = [
    { value: 'prescription', label: 'Prescription', icon: Pill },
    { value: 'medical', label: 'Medical Report', icon: Clipboard },
    { value: 'discharge', label: 'Discharge Summary', icon: FileText },
    { value: 'lab', label: 'Lab Report', icon: Activity }
  ];

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index: number, field: keyof PrescriptionItem, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast.error('Please enter a report title');
      return false;
    }
    if (!diagnosis.trim()) {
      toast.error('Please enter a diagnosis');
      return false;
    }
    
    // Validate medicines for prescription type
    if (reportType === 'prescription' || (medicines.length > 0 && medicines[0].name)) {
      const validMedicines = medicines.filter(m => m.name.trim() && m.dosage.trim());
      if (validMedicines.length === 0 && reportType === 'prescription') {
        toast.error('Please add at least one medicine');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const reportData: ReportData = {
        patient_id: patientId || '',
        type: reportType as any,
        title: title.trim(),
        diagnosis: diagnosis.trim(),
        chief_complaint: chiefComplaint.trim() || undefined,
        examination_notes: examinationNotes.trim() || undefined,
        prescriptions: medicines.filter(m => m.name.trim()),
        follow_up_date: followUpDate || undefined,
        additional_notes: additionalNotes.trim() || undefined
      };
      
      const result = await reportService.createReport(reportData);
      
      if (result.success) {
        toast.success('Report created successfully!');
        
        // Download PDF automatically
        if (result.data.id) {
          const downloadSuccess = await reportService.downloadAndSavePDF(
            result.data.id,
            `${reportType}-report-${patientName || 'patient'}.pdf`
          );
          
          if (downloadSuccess) {
            toast.success('PDF downloaded!');
          }
        }
        
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.message || 'Failed to create report');
      }
    } catch (error: any) {
      console.error('Error creating report:', error);
      toast.error(error.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    return (
      <div className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setReportType(type.value as any)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    reportType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Patient Info Display */}
        {patientName && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Patient</p>
                <p className="text-lg font-bold text-blue-900">{patientName}</p>
              </div>
              <div className="text-right">
                {patientAge && (
                  <p className="text-sm text-blue-700">{patientAge} years</p>
                )}
                {patientGender && (
                  <p className="text-sm text-blue-700 capitalize">{patientGender}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Report Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter report title..."
          />
        </div>

        {/* Chief Complaint */}
        {(reportType === 'medical' || reportType === 'discharge') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chief Complaint
            </label>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Patient's main complaints..."
            />
          </div>
        )}

        {/* Examination Notes */}
        {(reportType === 'medical' || reportType === 'discharge') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Examination Findings
            </label>
            <textarea
              value={examinationNotes}
              onChange={(e) => setExaminationNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Physical examination findings..."
            />
          </div>
        )}

        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis *
          </label>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter diagnosis..."
            />
          </div>
        </div>

        {/* Medicines Section */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Pill className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-gray-900">Prescribed Medicines</h3>
            </div>
            <button
              onClick={addMedicine}
              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {medicines.map((medicine, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name</label>
                    <input
                      type="text"
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., Paracetamol"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., 3 times daily"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                    <input
                      type="text"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., 5 days"
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                    <input
                      type="text"
                      value={medicine.instructions}
                      onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="e.g., After food, Morning only, etc."
                    />
                  </div>
                </div>
                
                {medicines.length > 1 && (
                  <button
                    onClick={() => removeMedicine(index)}
                    className="mt-2 flex items-center text-red-600 text-sm hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any additional instructions or notes..."
          />
        </div>

        {/* Follow-up Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Follow-up Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="flex items-center text-white">
            <FileText className="h-6 w-6 mr-3" />
            <div>
              <h2 className="text-xl font-bold">Generate Report</h2>
              <p className="text-sm text-blue-100">Create and download medical reports</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-[calc(90vh-80px)]">
          {/* Form Section */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderForm()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save & Download PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
