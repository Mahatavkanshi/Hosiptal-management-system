import React from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';

interface ReceptionHeaderProps {
  onOpenDisplay: () => void;
  onEmergency: () => void;
}

const ReceptionHeader: React.FC<ReceptionHeaderProps> = ({ onOpenDisplay, onEmergency }) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Reception Dashboard</h1>
        <p className="text-white/80 mt-1">Manage patient queue and doctor assignments</p>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={onOpenDisplay}
          className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Display
        </button>
        <button 
          onClick={onEmergency}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Emergency
        </button>
      </div>
    </div>
  );
};

export default ReceptionHeader;
