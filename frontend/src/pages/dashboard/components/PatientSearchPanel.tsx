import React from 'react';
import { Search } from 'lucide-react';
import type { Patient } from '../../../services/receptionApi';

interface PatientSearchPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  patients: Patient[];
}

const PatientSearchPanel: React.FC<PatientSearchPanelProps> = ({
  searchQuery,
  onSearchChange,
  patients
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="font-bold text-gray-900 mb-4 text-lg">Patient Search</h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Name or phone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {patients.length > 0 ? (
          patients.map(patient => (
            <div key={patient.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">{patient.phone}</p>
                </div>
                {patient.outstanding_amount > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                    ₹{patient.outstanding_amount}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Visits: {patient.total_visits}</p>
            </div>
          ))
        ) : (
          <>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600">+91 9876543210</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Visits: 5</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">Mike Johnson</p>
                  <p className="text-sm text-gray-600">+91 9876543212</p>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">₹500</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Visits: 3</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientSearchPanel;
