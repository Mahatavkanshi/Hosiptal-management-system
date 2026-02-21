import React from 'react';
import InteractiveBodyMap from '../../components/medical/InteractiveBodyMap';
import ThemeWrapper from '../../components/theme/ThemeWrapper';

const MedicalHistory: React.FC = () => {
  return (
    <ThemeWrapper>
      <div className="p-6">
        <InteractiveBodyMap />
      </div>
    </ThemeWrapper>
  );
};

export default MedicalHistory;
