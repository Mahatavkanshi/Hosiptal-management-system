import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AllocateBedModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
}

interface Bed {
  id: string;
  bed_number: string;
  room_number: string;
  ward_type: string;
  floor_number: number;
}

const AllocateBedModal = ({ onClose, onSuccess }: AllocateBedModalProps) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedBed, setSelectedBed] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch patients without beds (only from the same doctor)
      const patientsRes = await api.get('/doctor-dashboard/my-patients?limit=50');
      let patientsWithoutBeds = patientsRes.data.data.patients.filter(
        (p: any) => !p.has_bed
      );
      
      // If no patients found, add demo patients for the current doctor
      if (patientsWithoutBeds.length === 0) {
        patientsWithoutBeds = [
          { id: 'demo-patient-1', first_name: 'John', last_name: 'Doe', age: 45 },
          { id: 'demo-patient-2', first_name: 'Jane', last_name: 'Smith', age: 32 },
          { id: 'demo-patient-3', first_name: 'Michael', last_name: 'Johnson', age: 28 },
          { id: 'demo-patient-4', first_name: 'Sarah', last_name: 'Williams', age: 56 },
        ];
      }
      setPatients(patientsWithoutBeds);

      // Fetch available beds
      const bedsRes = await api.get('/beds?status=available');
      let beds = bedsRes.data.data.beds || [];
      
      // If no beds found, add demo beds
      if (beds.length === 0) {
        beds = [
          { id: 'demo-bed-1', bed_number: 'A1', room_number: '101', ward_type: 'General', floor_number: 1 },
          { id: 'demo-bed-2', bed_number: 'B1', room_number: '102', ward_type: 'Semi-Private', floor_number: 1 },
          { id: 'demo-bed-3', bed_number: 'A1', room_number: '201', ward_type: 'Private', floor_number: 2 },
          { id: 'demo-bed-4', bed_number: 'ICU-1', room_number: 'ICU-01', ward_type: 'ICU', floor_number: 0 },
          { id: 'demo-bed-5', bed_number: 'C2', room_number: '103', ward_type: 'General', floor_number: 1 },
        ];
      }
      setAvailableBeds(beds);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !selectedBed) {
      toast.error('Please select both patient and bed');
      return;
    }

    setLoading(true);

    try {
      await api.post('/beds/allocate', {
        bed_id: selectedBed,
        patient_id: selectedPatient,
        notes
      });
      
      // Get patient name for activity
      const selectedPatientObj = patients.find(p => p.id === selectedPatient);
      const selectedBedObj = availableBeds.find(b => b.id === selectedBed);
      
      // Save activity to localStorage for recent activity section
      const newActivity = {
        id: 'activity-' + Date.now(),
        type: 'bed_allocated',
        patient_name: selectedPatientObj ? `${selectedPatientObj.first_name} ${selectedPatientObj.last_name}` : 'Patient',
        description: `Bed allocated: ${selectedBedObj ? `Bed ${selectedBedObj.bed_number}, Room ${selectedBedObj.room_number}` : selectedBed}`,
        created_at: new Date().toISOString(),
      };
      
      const existingActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
      localStorage.setItem('payment_activities', JSON.stringify([newActivity, ...existingActivities]));
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to allocate bed');
    } finally {
      setLoading(false);
    }
  };

  const selectedBedDetails = availableBeds.find(b => b.id === selectedBed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Allocate Bed</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Select Patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient *</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 bg-white"
              required
            >
              <option value="">Choose a patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id} className="text-gray-900">
                  {patient.first_name} {patient.last_name} ({patient.age} years)
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">No patients without beds found</p>
            )}
            {patients.length > 0 && patients[0].id.startsWith('demo-') && (
              <p className="text-xs text-amber-600 mt-1">Demo: Showing sample patients</p>
            )}
          </div>

          {/* Select Bed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Bed *</label>
            <select
              value={selectedBed}
              onChange={(e) => setSelectedBed(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 bg-white"
              required
            >
              <option value="">Choose a bed...</option>
              {availableBeds.map((bed) => (
                <option key={bed.id} value={bed.id} className="text-gray-900">
                  Bed {bed.bed_number} - Room {bed.room_number} ({bed.ward_type}) - Floor {bed.floor_number}
                </option>
              ))}
            </select>
            {availableBeds.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No beds available</p>
            )}
            {availableBeds.length > 0 && availableBeds[0].id.startsWith('demo-') && (
              <p className="text-xs text-amber-600 mt-1">Demo: Showing sample beds</p>
            )}
          </div>

          {/* Bed Details Preview */}
          {selectedBedDetails && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Selected Bed Details:</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Bed Number:</strong> {selectedBedDetails.bed_number}</p>
                <p><strong>Room:</strong> {selectedBedDetails.room_number}</p>
                <p><strong>Ward Type:</strong> {selectedBedDetails.ward_type}</p>
                <p><strong>Floor:</strong> {selectedBedDetails.floor_number}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 bg-white"
              placeholder="Any special instructions or notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedPatient || !selectedBed}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold shadow-lg"
            >
              {loading ? 'Allocating...' : 'Allocate Bed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocateBedModal;
