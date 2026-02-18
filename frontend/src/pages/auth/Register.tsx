import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Eye, EyeOff, User, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    // Patient fields
    date_of_birth: '',
    blood_group: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    // Doctor fields
    specialization: '',
    qualification: '',
    experience_years: '',
    consultation_fee: '',
    license_number: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      const userData: any = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        role: userType
      };

      if (userType === 'patient') {
        userData.date_of_birth = formData.date_of_birth;
        userData.blood_group = formData.blood_group;
        userData.gender = formData.gender;
        userData.address = formData.address;
        userData.city = formData.city;
        userData.state = formData.state;
        userData.emergency_contact_name = formData.emergency_contact_name;
        userData.emergency_contact_phone = formData.emergency_contact_phone;
      } else {
        userData.specialization = formData.specialization;
        userData.qualification = formData.qualification;
        userData.experience_years = parseInt(formData.experience_years) || 0;
        userData.consultation_fee = parseFloat(formData.consultation_fee) || 0;
        userData.license_number = formData.license_number;
      }

      await register(userData);
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h2>
      
      {/* User Type Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setUserType('patient')}
          className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
            userType === 'patient' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <User className={`h-8 w-8 mb-2 ${userType === 'patient' ? 'text-primary-600' : 'text-gray-400'}`} />
          <span className={`font-medium ${userType === 'patient' ? 'text-primary-700' : 'text-gray-600'}`}>Patient</span>
        </button>
        
        <button
          type="button"
          onClick={() => setUserType('doctor')}
          className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
            userType === 'doctor' 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Stethoscope className={`h-8 w-8 mb-2 ${userType === 'doctor' ? 'text-primary-600' : 'text-gray-400'}`} />
          <span className={`font-medium ${userType === 'doctor' ? 'text-primary-700' : 'text-gray-600'}`}>Doctor</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="label">First Name *</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="input"
              placeholder="John"
            />
          </div>
          
          <div>
            <label htmlFor="last_name" className="label">Last Name *</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="input"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Email address *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="input"
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Password *</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="input pr-10"
              placeholder="At least 6 characters"
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

        {/* Patient-specific fields */}
        {userType === 'patient' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date_of_birth" className="label">Date of Birth</label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              
              <div>
                <label htmlFor="blood_group" className="label">Blood Group</label>
                <select
                  id="blood_group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="label">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="address" className="label">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="input"
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="label">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="input"
                  placeholder="City"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="label">State</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  className="input"
                  placeholder="State"
                />
              </div>
            </div>
          </>
        )}

        {/* Doctor-specific fields */}
        {userType === 'doctor' && (
          <>
            <div>
              <label htmlFor="specialization" className="label">Specialization *</label>
              <input
                id="specialization"
                name="specialization"
                type="text"
                required
                value={formData.specialization}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Cardiologist"
              />
            </div>

            <div>
              <label htmlFor="qualification" className="label">Qualification *</label>
              <input
                id="qualification"
                name="qualification"
                type="text"
                required
                value={formData.qualification}
                onChange={handleChange}
                className="input"
                placeholder="e.g., MBBS, MD"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="experience_years" className="label">Experience (Years)</label>
                <input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={handleChange}
                  className="input"
                  placeholder="5"
                />
              </div>
              
              <div>
                <label htmlFor="consultation_fee" className="label">Consultation Fee (₹)</label>
                <input
                  id="consultation_fee"
                  name="consultation_fee"
                  type="number"
                  min="0"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  className="input"
                  placeholder="500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="license_number" className="label">License Number</label>
              <input
                id="license_number"
                name="license_number"
                type="text"
                value={formData.license_number}
                onChange={handleChange}
                className="input"
                placeholder="Medical license number"
              />
            </div>
          </>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
