import React from 'react';
import { Users, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Doctor, QueueItem } from '../../../services/receptionApi';

interface DoctorQueueCardProps {
  doctor?: Doctor;
  currentPatient?: QueueItem;
  waitingCount: number;
  onCallNext: () => void;
  onComplete: (id: string) => void;
  onEmergency: () => void;
  getTypeBadge: (type: string) => string;
}

const DoctorQueueCard: React.FC<DoctorQueueCardProps> = ({
  doctor,
  currentPatient,
  waitingCount,
  onCallNext,
  onComplete,
  onEmergency,
  getTypeBadge
}) => {
  if (!doctor) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Doctor Header */}
      <div className={`p-4 ${doctor.status === 'available' ? 'bg-green-50' : 'bg-yellow-50'} border-b border-gray-100`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-bold text-gray-900 text-lg">{doctor.name}</h3>
              <p className="text-sm text-gray-600">{doctor.specialization}</p>
              <p className="text-xs text-gray-500">{doctor.room}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            doctor.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {doctor.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Now Serving Section */}
      <div className="p-4 bg-blue-50">
        <p className="text-xs font-bold text-blue-600 mb-2 tracking-wider">NOW SERVING</p>
        
        {currentPatient ? (
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm border-2 border-blue-200">
                <span className="text-2xl font-bold text-blue-600">{currentPatient.token}</span>
              </div>
              <div className="ml-3">
                <p className="font-bold text-gray-900">{currentPatient.patient_name}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs ${getTypeBadge(currentPatient.type)}`}>
                  {currentPatient.type.toUpperCase()}
                </span>
                {!currentPatient.fee_paid && (
                  <p className="text-xs text-red-600 mt-1">Payment Pending</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {!currentPatient.fee_paid && (
                <button className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                  Collect Fee
                </button>
              )}
              <button 
                onClick={() => onComplete(currentPatient.id)}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200"
              >
                Complete
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No patient with doctor</p>
          </div>
        )}
      </div>

      {/* Waiting Queue Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Waiting ({waitingCount})</p>
          <button 
            onClick={onCallNext}
            disabled={waitingCount === 0}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Call Next
          </button>
        </div>

        {waitingCount === 0 ? (
          <p className="text-center text-gray-500 py-4">No patients waiting</p>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-gray-700 shadow-sm">003</span>
                <span className="ml-2 text-sm font-medium">Next Patient</span>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {/* Emergency Button */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={onEmergency}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Add Emergency Case
        </button>
      </div>
    </div>
  );
};

export default DoctorQueueCard;
