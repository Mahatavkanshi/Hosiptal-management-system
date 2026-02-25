import React, { useState } from 'react';
import { X, Search, User, Bed, CreditCard, CheckCircle, Loader2, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any;
  onSuccess: (checkInData: any) => void;
}

const demoBeds = [
  { id: '1', room: '101', type: 'General', status: 'available' },
  { id: '2', room: '102', type: 'General', status: 'available' },
  { id: '3', room: '103', type: 'ICU', status: 'available' },
  { id: '4', room: '104', type: 'Private', status: 'available' },
  { id: '5', room: '105', type: 'General', status: 'available' },
];

const CheckInModal: React.FC<CheckInModalProps> = ({ 
  isOpen, 
  onClose, 
  appointment,
  onSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [formData, setFormData] = useState({
    patient_id: appointment?.patient_id || '',
    patient_name: appointment?.patientName || '',
    admission_type: 'outpatient',
    bed_id: '',
    deposit_amount: '',
    emergency_contact: '',
    reason_for_visit: '',
    insurance_verified: false,
    id_proof_type: 'aadhar',
    id_proof_number: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleBedSelect = (bed: any) => {
    setSelectedBed(bed);
    setFormData(prev => ({ ...prev, bed_id: bed.id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_name) {
      toast.error('Patient name is required');
      return;
    }

    if (formData.admission_type === 'inpatient' && !formData.bed_id) {
      toast.error('Please select a bed for inpatient admission');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const checkInData = {
        id: Date.now().toString(),
        ...formData,
        bed_details: selectedBed,
        check_in_time: new Date().toISOString(),
        status: 'checked-in',
        appointment_id: appointment?.id
      };
      
      toast.success('Patient checked in successfully!');
      onSuccess(checkInData);
      onClose();
    } catch (error) {
      toast.error('Failed to check in patient');
    } finally {
      setIsLoading(false);
    }
  };

  const availableBeds = demoBeds.filter(bed => 
    bed.status === 'available' && 
    (searchQuery === '' || bed.room.includes(searchQuery) || bed.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Patient Check-In</h2>
              <p className="text-sm text-gray-600">Check in patient for their appointment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Info Display */}
          {appointment && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                  <p className="text-sm text-gray-600">{appointment.type} • {appointment.doctorName}</p>
                  <p className="text-sm text-gray-500">{appointment.time}</p>
                </div>
              </div>
            </div>
          )}

          {/* Admission Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Admission Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.admission_type === 'outpatient' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="admission_type"
                  value="outpatient"
                  checked={formData.admission_type === 'outpatient'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">Outpatient</p>
                  <p className="text-sm text-gray-600">No bed required</p>
                </div>
              </label>

              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.admission_type === 'inpatient' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="admission_type"
                  value="inpatient"
                  checked={formData.admission_type === 'inpatient'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <p className="font-medium text-gray-900">Inpatient</p>
                  <p className="text-sm text-gray-600">Bed assignment required</p>
                </div>
              </label>
            </div>
          </div>

          {/* Bed Selection - Only for Inpatient */}
          {formData.admission_type === 'inpatient' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Bed className="h-4 w-4 mr-2" />
                Select Bed
              </h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by room number or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableBeds.map((bed) => (
                  <button
                    key={bed.id}
                    type="button"
                    onClick={() => handleBedSelect(bed)}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${
                      selectedBed?.id === bed.id
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Room {bed.room}</p>
                    <p className="text-sm text-gray-600">{bed.type}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Available
                    </span>
                  </button>
                ))}
              </div>

              {availableBeds.length === 0 && (
                <p className="text-center text-gray-500 py-4">No available beds found</p>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Additional Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
              <textarea
                name="reason_for_visit"
                value={formData.reason_for_visit}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Brief description of patient's condition..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Emergency contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (if applicable)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    name="deposit_amount"
                    value={formData.deposit_amount}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Amount in INR"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
                <select
                  name="id_proof_type"
                  value={formData.id_proof_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="aadhar">Aadhar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Number</label>
                <input
                  type="text"
                  name="id_proof_number"
                  value={formData.id_proof_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="insurance_verified"
                name="insurance_verified"
                checked={formData.insurance_verified}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <label htmlFor="insurance_verified" className="ml-2 text-sm text-gray-700">
                Insurance verified and documents checked
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Check-In
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
