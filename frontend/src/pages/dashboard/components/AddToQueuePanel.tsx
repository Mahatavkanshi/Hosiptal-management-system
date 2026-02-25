import React from 'react';
import { Plus } from 'lucide-react';
import type { Doctor } from '../../../services/receptionApi';

interface AddToQueuePanelProps {
  doctors: Doctor[];
  selectedDoctor: string;
  onDoctorChange: (doctorId: string) => void;
  onAddPatient: () => void;
}

const AddToQueuePanel: React.FC<AddToQueuePanelProps> = ({
  doctors,
  selectedDoctor,
  onDoctorChange,
  onAddPatient
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="font-bold text-gray-900 mb-4 text-lg">Add to Queue</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
          <select 
            value={selectedDoctor}
            onChange={(e) => onDoctorChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose doctor...</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} - {d.specialization}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddPatient}
          disabled={!selectedDoctor}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Walk-in Patient
        </button>
      </div>
    </div>
  );
};

export default AddToQueuePanel;
