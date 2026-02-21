import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeWrapper from '../../components/theme/ThemeWrapper';

const Appointments: React.FC = () => {
  const { isDark } = useTheme();
  
  return (
    <ThemeWrapper>
      <div className="p-6">
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Appointments
        </h1>
        <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Appointments list will be displayed here.
          </p>
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default Appointments;
