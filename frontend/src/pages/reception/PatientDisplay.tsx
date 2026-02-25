import React, { useState, useEffect } from 'react';
import { Clock, User, Stethoscope, AlertTriangle } from 'lucide-react';

// Dummy data - in real app, this would come from API/Socket
const dummyDoctors = [
  { id: '1', name: 'Dr. Smith', specialization: 'General Medicine', room: 'Room 1', status: 'available' },
  { id: '2', name: 'Dr. Johnson', specialization: 'Cardiology', room: 'Room 2', status: 'available' },
  { id: '3', name: 'Dr. Williams', specialization: 'Pediatrics', room: 'Room 3', status: 'busy' }
];

const dummyQueue = [
  { id: '1', token: '001', patientName: 'John Doe', doctorId: '1', status: 'with_doctor', type: 'regular' },
  { id: '2', token: '002', patientName: 'Jane Smith', doctorId: '3', status: 'with_doctor', type: 'regular' },
  { id: '3', token: '003', patientName: 'Mike Johnson', doctorId: '1', status: 'waiting', type: 'regular' },
  { id: '4', token: '001', patientName: 'Emergency Patient', doctorId: '2', status: 'emergency', type: 'emergency' },
  { id: '5', token: '002', patientName: 'Sarah Brown', doctorId: '2', status: 'waiting', type: 'priority' }
];

const PatientDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [doctors] = useState(dummyDoctors);
  const [queue] = useState(dummyQueue);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getDoctorQueue = (doctorId: string) => {
    return queue
      .filter(q => q.doctorId === doctorId)
      .sort((a, b) => {
        if (a.type === 'emergency' && b.type !== 'emergency') return -1;
        if (b.type === 'emergency' && a.type !== 'emergency') return 1;
        if (a.type === 'priority' && b.type === 'regular') return -1;
        if (b.type === 'priority' && a.type === 'regular') return 1;
        return parseInt(a.token) - parseInt(b.token);
      });
  };

  const getCurrentPatient = (doctorId: string) => {
    return queue.find(q => q.doctorId === doctorId && (q.status === 'with_doctor' || q.status === 'emergency'));
  };

  const getWaitingPatients = (doctorId: string) => {
    return getDoctorQueue(doctorId).filter(q => q.status === 'waiting').slice(0, 4);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'priority': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">City Hospital</h1>
            <p className="text-xl text-gray-600">Patient Queue Display</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-md">
          <Clock className="h-6 w-6 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="bg-red-500 text-white rounded-2xl p-4 mb-8 flex items-center justify-center gap-3 shadow-lg">
        <AlertTriangle className="h-6 w-6" />
        <p className="text-lg font-semibold">In case of emergency, please inform the reception immediately</p>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {doctors.map((doctor) => {
          const currentPatient = getCurrentPatient(doctor.id);
          const waitingPatients = getWaitingPatients(doctor.id);
          const doctorQueue = getDoctorQueue(doctor.id);

          return (
            <div key={doctor.id} className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Doctor Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{doctor.name}</h2>
                    <p className="text-blue-100 text-lg">{doctor.specialization}</p>
                    <p className="text-blue-200">{doctor.room}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    doctor.status === 'available' ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'
                  }`}>
                    {doctor.status === 'available' ? 'AVAILABLE' : 'WITH PATIENT'}
                  </div>
                </div>
              </div>

              {/* Current Token */}
              <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <p className="text-center text-gray-500 text-sm mb-4 tracking-widest uppercase">Now Serving</p>
                
                {currentPatient ? (
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-3xl shadow-lg mb-4 ${getTypeColor(currentPatient.type)}`}>
                      <span className="text-5xl font-bold">{currentPatient.token}</span>
                    </div>
                    <p className="text-xl font-semibold text-gray-800">{currentPatient.patientName}</p>
                    {currentPatient.type === 'emergency' && (
                      <p className="text-red-500 font-bold mt-1">⚡ EMERGENCY</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-32 h-32 bg-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl text-gray-400">--</span>
                    </div>
                    <p className="text-gray-500">Waiting for patient</p>
                  </div>
                )}
              </div>

              {/* Waiting Queue */}
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600 font-medium">Waiting Queue</p>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                    {waitingPatients.length} waiting
                  </span>
                </div>

                <div className="space-y-3">
                  {waitingPatients.map((patient, index) => (
                    <div 
                      key={patient.id}
                      className={`flex items-center justify-between p-4 rounded-2xl ${
                        index === 0 ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getTypeColor(patient.type)}`}>
                          {patient.token}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{patient.patientName}</p>
                          {patient.type !== 'regular' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              patient.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {patient.type.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {index === 0 && (
                        <span className="text-blue-600 font-bold text-sm">NEXT</span>
                      )}
                    </div>
                  ))}

                  {waitingPatients.length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      <p>No patients waiting</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Stats */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total today: {doctorQueue.length}</span>
                  <span>Est. wait: {waitingPatients.length > 0 ? `${waitingPatients.length * 15} mins` : 'No wait'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          Please wait for your token number to be called. Thank you for your patience.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Refreshing automatically • Last updated: {currentTime.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default PatientDisplay;
