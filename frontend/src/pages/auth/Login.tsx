import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  Stethoscope, 
  Building2, 
  UserCheck, 
  ClipboardList, 
  Pill, 
  User,
  ArrowLeft,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DepartmentConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
  bgGradient: string;
  welcomeMessage: string;
}

const departments: Record<string, DepartmentConfig> = {
  doctor: {
    id: 'doctor',
    name: 'Doctors Portal',
    icon: Stethoscope,
    description: 'Access patient records, appointments, and medical tools',
    color: 'blue',
    bgGradient: 'from-blue-50 to-blue-100',
    welcomeMessage: 'Welcome back, Doctor'
  },
  admin: {
    id: 'admin',
    name: 'Admin Portal',
    icon: Building2,
    description: 'System administration and management',
    color: 'purple',
    bgGradient: 'from-purple-50 to-purple-100',
    welcomeMessage: 'Welcome back, Administrator'
  },
  nurse: {
    id: 'nurse',
    name: 'Nursing Portal',
    icon: UserCheck,
    description: 'Patient care and medical assistance',
    color: 'pink',
    bgGradient: 'from-pink-50 to-pink-100',
    welcomeMessage: 'Welcome back, Nurse'
  },
  receptionist: {
    id: 'receptionist',
    name: 'Reception Portal',
    icon: ClipboardList,
    description: 'Front desk and patient services',
    color: 'green',
    bgGradient: 'from-green-50 to-green-100',
    welcomeMessage: 'Welcome back'
  },
  pharmacist: {
    id: 'pharmacist',
    name: 'Pharmacy Portal',
    icon: Pill,
    description: 'Medicine inventory and prescriptions',
    color: 'orange',
    bgGradient: 'from-orange-50 to-orange-100',
    welcomeMessage: 'Welcome back, Pharmacist'
  },
  patient: {
    id: 'patient',
    name: 'Patient Portal',
    icon: User,
    description: 'Your health records and appointments',
    color: 'teal',
    bgGradient: 'from-teal-50 to-teal-100',
    welcomeMessage: 'Welcome back'
  }
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get department from URL
  const deptId = searchParams.get('dept') || '';
  const department = departments[deptId];
  
  // Determine if we're in portal mode or regular login
  const isPortalMode = !!department;

  useEffect(() => {
    // If user is already logged in, redirect to appropriate dashboard
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case 'doctor':
        navigate('/dashboard');
        break;
      case 'admin':
      case 'super_admin':
        navigate('/admin-dashboard');
        break;
      case 'nurse':
        navigate('/nurse-dashboard');
        break;
      case 'receptionist':
        navigate('/reception-dashboard');
        break;
      case 'pharmacist':
        navigate('/pharmacy-dashboard');
        break;
      case 'patient':
        navigate('/patient-portal');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      
      // Redirect based on user's actual role after successful login
      // The role will be available after login completes
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; hover: string; ring: string; text: string; border: string }> = {
      blue: { 
        bg: 'bg-blue-600', 
        hover: 'hover:bg-blue-700', 
        ring: 'focus:ring-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-600'
      },
      purple: { 
        bg: 'bg-purple-600', 
        hover: 'hover:bg-purple-700', 
        ring: 'focus:ring-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-600'
      },
      pink: { 
        bg: 'bg-pink-600', 
        hover: 'hover:bg-pink-700', 
        ring: 'focus:ring-pink-500',
        text: 'text-pink-600',
        border: 'border-pink-600'
      },
      green: { 
        bg: 'bg-green-600', 
        hover: 'hover:bg-green-700', 
        ring: 'focus:ring-green-500',
        text: 'text-green-600',
        border: 'border-green-600'
      },
      orange: { 
        bg: 'bg-orange-600', 
        hover: 'hover:bg-orange-700', 
        ring: 'focus:ring-orange-500',
        text: 'text-orange-600',
        border: 'border-orange-600'
      },
      teal: { 
        bg: 'bg-teal-600', 
        hover: 'hover:bg-teal-700', 
        ring: 'focus:ring-teal-500',
        text: 'text-teal-600',
        border: 'border-teal-600'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const colors = department ? getColorClasses(department.color) : getColorClasses('blue');
  const Icon = department ? department.icon : Building;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isPortalMode && department ? `bg-gradient-to-br ${department.bgGradient}` : 'bg-gray-50'}`}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        {isPortalMode && (
          <button
            onClick={() => navigate('/portal')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Portal
          </button>
        )}

        {/* Department Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {isPortalMode && department ? (
            <div className={`${colors.bg} p-6 text-center`}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {department.name}
              </h2>
              <p className="text-white/80 text-sm">
                {department.description}
              </p>
            </div>
          ) : (
            <div className="bg-gray-900 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Building className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Hospital Management
              </h2>
              <p className="text-gray-400 text-sm">
                Sign in to your account
              </p>
            </div>
          )}

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent text-gray-900 bg-white`}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 ${colors.ring} focus:border-transparent text-gray-900 bg-white pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className={`h-4 w-4 ${colors.bg} ${colors.ring} border-gray-300 rounded`}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link 
                    to="/forgot-password" 
                    className={`font-semibold ${colors.text} hover:underline`}
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-bold text-white ${colors.bg} ${colors.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${colors.ring} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Don't have an account?
                  </span>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-4">
              <Link
                to={`/register${deptId ? `?dept=${deptId}` : ''}`}
                className={`w-full flex justify-center items-center py-3 px-4 border-2 ${colors.border} rounded-lg ${colors.text} font-bold hover:bg-gray-50 transition-colors bg-white`}
              >
                Create new account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
