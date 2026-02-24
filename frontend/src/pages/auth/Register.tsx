import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Eye, EyeOff, User, Stethoscope, Building2, Shield, ArrowLeft, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, user, getDashboardRoute } = useAuth();
  const [userType, setUserType] = useState<'patient' | 'doctor' | 'admin' | 'nurse'>('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if coming from specific department portal
  const deptFromUrl = searchParams.get('dept');
  
  useEffect(() => {
    if (deptFromUrl) {
      if (deptFromUrl === 'admin') setUserType('admin');
      else if (deptFromUrl === 'doctor') setUserType('doctor');
      else if (deptFromUrl === 'nurse') setUserType('nurse');
      else if (deptFromUrl === 'patient') setUserType('patient');
    }
  }, [deptFromUrl]);

  useEffect(() => {
    // If user is already logged in, redirect to appropriate dashboard
    if (user) {
      navigate(getDashboardRoute(user.role));
    }
  }, [user, navigate, getDashboardRoute]);
  
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
    license_number: '',
    department: '',
    about: '',
    available_time_start: '09:00',
    available_time_end: '17:00',
    slot_duration: '30',
    // Admin fields
    employee_id: '',
    admin_code: '',
    // Nurse fields
    nurse_department: '',
    nursing_license: '',
    nursing_experience: '',
    shift_preference: ''
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

    // Validate admin code for admin registration
    if (userType === 'admin' && formData.admin_code !== 'ADMIN123') {
      toast.error('Invalid admin registration code');
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
      } else if (userType === 'doctor') {
        userData.specialization = formData.specialization;
        userData.qualification = formData.qualification;
        userData.department = formData.department;
        userData.experience_years = parseInt(formData.experience_years) || 0;
        userData.consultation_fee = parseFloat(formData.consultation_fee) || 0;
        userData.license_number = formData.license_number;
        userData.about = formData.about;
        userData.available_time_start = formData.available_time_start;
        userData.available_time_end = formData.available_time_end;
        userData.slot_duration = parseInt(formData.slot_duration) || 30;
      } else if (userType === 'admin') {
        userData.department = formData.department;
        userData.employee_id = formData.employee_id;
      } else if (userType === 'nurse') {
        userData.nurse_department = formData.nurse_department;
        userData.nursing_license = formData.nursing_license;
        userData.nursing_experience = parseInt(formData.nursing_experience) || 0;
        userData.shift_preference = formData.shift_preference;
      }

      await register(userData);
      toast.success('Registration successful!');
      
      // Redirect based on user role
      const dashboardRoute = getDashboardRoute(userType);
      navigate(dashboardRoute);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // If coming from a department portal, hide role selection and show specific form
  const isPortalMode = !!deptFromUrl;

  const getTitle = () => {
    if (deptFromUrl === 'admin') return 'Create Admin Account';
    if (deptFromUrl === 'doctor') return 'Create Doctor Account';
    if (deptFromUrl === 'nurse') return 'Create Nurse Account';
    if (deptFromUrl === 'patient') return 'Create Patient Account';
    
    switch (userType) {
      case 'admin': return 'Create Admin Account';
      case 'doctor': return 'Create Doctor Account';
      case 'nurse': return 'Create Nurse Account';
      default: return 'Create Patient Account';
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Back Button - only show in portal mode */}
      {isPortalMode && (
        <button
          onClick={() => navigate('/portal')}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Portal
        </button>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
      <p className="text-gray-600 mb-6">Fill in your details to get started</p>
      
      {/* User Type Selection - only show if NOT coming from a portal */}
      {!isPortalMode && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setUserType('patient')}
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
              userType === 'patient' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <User className={`h-6 w-6 mb-2 ${userType === 'patient' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${userType === 'patient' ? 'text-blue-700' : 'text-gray-600'}`}>Patient</span>
          </button>
          
          <button
            type="button"
            onClick={() => setUserType('doctor')}
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
              userType === 'doctor' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Stethoscope className={`h-6 w-6 mb-2 ${userType === 'doctor' ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${userType === 'doctor' ? 'text-blue-700' : 'text-gray-600'}`}>Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
              userType === 'admin' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Shield className={`h-6 w-6 mb-2 ${userType === 'admin' ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${userType === 'admin' ? 'text-purple-700' : 'text-gray-600'}`}>Admin</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              value={formData.first_name}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John"
            />
          </div>
          
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              value={formData.last_name}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address *</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
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
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  id="blood_group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>
              
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State"
                />
              </div>
            </div>
          </>
        )}

        {/* Doctor-specific fields */}
        {userType === 'doctor' && (
          <>
            {/* Specialization Dropdown */}
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
              <select
                id="specialization"
                name="specialization"
                required
                value={formData.specialization}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Specialization</option>
                <option value="Cardiology">Cardiology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT">ENT</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Urology">Urology</option>
                <option value="Nephrology">Nephrology</option>
                <option value="Oncology">Oncology</option>
                <option value="Radiology">Radiology</option>
                <option value="Pathology">Pathology</option>
                <option value="Anesthesiology">Anesthesiology</option>
                <option value="Surgery">General Surgery</option>
              </select>
            </div>

            {/* Qualification/Degree */}
            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Degree/Qualification *</label>
              <input
                id="qualification"
                name="qualification"
                type="text"
                required
                value={formData.qualification}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MBBS, MD (Cardiology), DM, FACC"
              />
              <p className="text-xs text-gray-500 mt-1">Enter all degrees separated by commas</p>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select Department</option>
                <option value="Cardiology Department">Cardiology Department</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Neurology">Neurology</option>
                <option value="Gynecology & Obstetrics">Gynecology & Obstetrics</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT Department">ENT Department</option>
                <option value="Dental Department">Dental Department</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Urology">Urology</option>
                <option value="Nephrology">Nephrology</option>
                <option value="Oncology">Oncology</option>
                <option value="Radiology">Radiology</option>
                <option value="Pathology">Pathology</option>
                <option value="Anesthesiology">Anesthesiology</option>
                <option value="Surgery Department">Surgery Department</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-1">Experience (Years) *</label>
                <input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={formData.experience_years}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 10"
                />
              </div>
              
              <div>
                <label htmlFor="consultation_fee" className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) *</label>
                <input
                  id="consultation_fee"
                  name="consultation_fee"
                  type="number"
                  min="0"
                  required
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000"
                />
              </div>
            </div>

            {/* License Number */}
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">Medical License Number *</label>
              <input
                id="license_number"
                name="license_number"
                type="text"
                required
                value={formData.license_number}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MCI-12345 or state medical council number"
              />
            </div>

            {/* About/Description */}
            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-1">About Doctor</label>
              <textarea
                id="about"
                name="about"
                rows={3}
                value={formData.about}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Brief description about doctor's expertise, achievements, and approach to patient care..."
              />
            </div>

            {/* Availability Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Availability Schedule</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="available_time_start" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    id="available_time_start"
                    name="available_time_start"
                    type="time"
                    value={formData.available_time_start}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="available_time_end" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    id="available_time_end"
                    name="available_time_end"
                    type="time"
                    value={formData.available_time_end}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="slot_duration" className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
                <select
                  id="slot_duration"
                  name="slot_duration"
                  value={formData.slot_duration}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Admin-specific fields */}
        {userType === 'admin' && (
          <>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-900">Admin Registration</span>
              </div>
              <p className="text-sm text-purple-700">
                Admin accounts require a special registration code for security purposes.
              </p>
            </div>

            <div>
              <label htmlFor="admin_code" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Registration Code *
              </label>
              <input
                id="admin_code"
                name="admin_code"
                type="password"
                required
                value={formData.admin_code}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter admin code"
              />
              <p className="text-xs text-gray-500 mt-1">Use code: ADMIN123 (for demo purposes)</p>
            </div>

            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                id="employee_id"
                name="employee_id"
                type="text"
                value={formData.employee_id}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="EMP001"
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Department</option>
                <option value="it">IT & Systems</option>
                <option value="hr">Human Resources</option>
                <option value="operations">Operations</option>
                <option value="finance">Finance</option>
                <option value="management">Management</option>
              </select>
            </div>
          </>
        )}

        {/* Nurse-specific fields */}
        {userType === 'nurse' && (
          <>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <span className="font-medium text-pink-900">Nurse Registration</span>
              </div>
              <p className="text-sm text-pink-700">
                Register as a nursing staff member. You will be able to manage patient care, vitals, and bed assignments.
              </p>
            </div>

            <div>
              <label htmlFor="nurse_department" className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                id="nurse_department"
                name="nurse_department"
                required
                value={formData.nurse_department}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              >
                <option value="">Select Department</option>
                <option value="general_ward">General Ward</option>
                <option value="icu">ICU</option>
                <option value="ccu">CCU</option>
                <option value="emergency">Emergency</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="ot">Operation Theater</option>
                <option value="opd">OPD</option>
              </select>
            </div>

            <div>
              <label htmlFor="nursing_license" className="block text-sm font-medium text-gray-700 mb-1">Nursing License Number *</label>
              <input
                id="nursing_license"
                name="nursing_license"
                type="text"
                required
                value={formData.nursing_license}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g., NCI-12345 or state nursing council number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nursing_experience" className="block text-sm font-medium text-gray-700 mb-1">Experience (Years) *</label>
                <input
                  id="nursing_experience"
                  name="nursing_experience"
                  type="number"
                  min="0"
                  max="50"
                  required
                  value={formData.nursing_experience}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label htmlFor="shift_preference" className="block text-sm font-medium text-gray-700 mb-1">Shift Preference</label>
                <select
                  id="shift_preference"
                  name="shift_preference"
                  value={formData.shift_preference}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                >
                  <option value="">Select Shift</option>
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                  <option value="rotating">Rotating</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white transition-colors ${
              userType === 'admin' 
                ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' 
                : userType === 'nurse'
                ? 'bg-pink-600 hover:bg-pink-700 focus:ring-pink-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
          <Link to={`/login${deptFromUrl ? `?dept=${deptFromUrl}` : ''}`} className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
