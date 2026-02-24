import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Users, 
  UserCheck, 
  ClipboardList, 
  Pill, 
  User,
  Building2,
  ArrowRight
} from 'lucide-react';

interface DepartmentCard {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  gradient: string;
  role: string;
}

const departments: DepartmentCard[] = [
  {
    id: 'doctor',
    name: 'Doctors Portal',
    icon: Stethoscope,
    description: 'Manage patients, appointments, and medical records',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
    role: 'doctor'
  },
  {
    id: 'admin',
    name: 'Admin Portal',
    icon: Building2,
    description: 'System administration, users, and analytics',
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
    role: 'admin'
  },
  {
    id: 'nurse',
    name: 'Nursing Portal',
    icon: UserCheck,
    description: 'Patient care, vitals, and bed management',
    color: 'bg-pink-500',
    gradient: 'from-pink-500 to-pink-600',
    role: 'nurse'
  },
  {
    id: 'receptionist',
    name: 'Reception Portal',
    icon: ClipboardList,
    description: 'Appointments, check-in, and payments',
    color: 'bg-green-500',
    gradient: 'from-green-500 to-green-600',
    role: 'receptionist'
  },
  {
    id: 'pharmacist',
    name: 'Pharmacy Portal',
    icon: Pill,
    description: 'Medicine inventory and prescriptions',
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600',
    role: 'pharmacist'
  },
  {
    id: 'patient',
    name: 'Patient Portal',
    icon: User,
    description: 'Book appointments and view medical history',
    color: 'bg-teal-500',
    gradient: 'from-teal-500 to-teal-600',
    role: 'patient'
  }
];

const DepartmentPortal: React.FC = () => {
  const navigate = useNavigate();

  const handleDepartmentClick = (departmentId: string) => {
    navigate(`/login?dept=${departmentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Hospital Management System
          </h1>
          <p className="text-lg text-gray-600">
            Select your department to continue
          </p>
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.id}
                onClick={() => handleDepartmentClick(dept.id)}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 text-left"
              >
                {/* Gradient Top Bar */}
                <div className={`h-2 bg-gradient-to-r ${dept.gradient}`} />
                
                <div className="p-6">
                  {/* Icon and Arrow */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${dept.color} bg-opacity-10`}>
                      <Icon className={`h-8 w-8 ${dept.color.replace('bg-', 'text-')}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPortal;
