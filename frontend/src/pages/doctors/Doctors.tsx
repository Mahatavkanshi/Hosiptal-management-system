import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  MapPin, 
  Calendar,
  Stethoscope,
  Award,
  Phone,
  Mail,
  ChevronRight,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  license_number?: string;
  available_days: string[];
  available_time_start: string;
  available_time_end: string;
  slot_duration: number;
  is_available: boolean;
  rating: number;
  total_reviews: number;
  about?: string;
  department?: string;
}

const demoDoctors: Doctor[] = [
  {
    id: '1',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    phone: '+91 98765 43210',
    specialization: 'Cardiology',
    department: 'Cardiology Department',
    qualification: 'MD, DM (Cardiology), FACC',
    experience_years: 15,
    consultation_fee: 1500,
    license_number: 'MCI-12345',
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    available_time_start: '09:00',
    available_time_end: '17:00',
    slot_duration: 30,
    is_available: true,
    rating: 4.8,
    total_reviews: 245,
    about: 'Dr. Sarah Johnson is a renowned cardiologist with over 15 years of experience in treating heart diseases and performing cardiac procedures.'
  },
  {
    id: '2',
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@hospital.com',
    phone: '+91 98765 43211',
    specialization: 'General Medicine',
    department: 'General Medicine',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience_years: 12,
    consultation_fee: 800,
    license_number: 'MCI-12346',
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    available_time_start: '10:00',
    available_time_end: '18:00',
    slot_duration: 20,
    is_available: true,
    rating: 4.6,
    total_reviews: 189,
    about: 'Dr. Michael Chen specializes in internal medicine and has expertise in managing chronic diseases and preventive healthcare.'
  },
  {
    id: '3',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@hospital.com',
    phone: '+91 98765 43212',
    specialization: 'Dermatology',
    department: 'Dermatology',
    qualification: 'MBBS, MD (Dermatology), FAGE',
    experience_years: 10,
    consultation_fee: 1200,
    license_number: 'MCI-12347',
    available_days: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    available_time_start: '11:00',
    available_time_end: '19:00',
    slot_duration: 25,
    is_available: true,
    rating: 4.9,
    total_reviews: 312,
    about: 'Dr. Emily Davis is an expert dermatologist specializing in skin conditions, cosmetic dermatology, and laser treatments.'
  },
  {
    id: '4',
    first_name: 'Rajesh',
    last_name: 'Sharma',
    email: 'rajesh.sharma@hospital.com',
    phone: '+91 98765 43213',
    specialization: 'Orthopedics',
    department: 'Orthopedics',
    qualification: 'MBBS, MS (Orthopedics), MCh',
    experience_years: 18,
    consultation_fee: 2000,
    license_number: 'MCI-12348',
    available_days: ['monday', 'wednesday', 'friday'],
    available_time_start: '09:30',
    available_time_end: '16:30',
    slot_duration: 45,
    is_available: true,
    rating: 4.7,
    total_reviews: 278,
    about: 'Dr. Rajesh Sharma is a senior orthopedic surgeon with expertise in joint replacement surgeries and sports medicine.'
  },
  {
    id: '5',
    first_name: 'Priya',
    last_name: 'Patel',
    email: 'priya.patel@hospital.com',
    phone: '+91 98765 43214',
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    qualification: 'MBBS, MD (Pediatrics), Fellowship in Neonatology',
    experience_years: 14,
    consultation_fee: 1000,
    license_number: 'MCI-12349',
    available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    available_time_start: '09:00',
    available_time_end: '18:00',
    slot_duration: 20,
    is_available: true,
    rating: 4.9,
    total_reviews: 423,
    about: 'Dr. Priya Patel is a compassionate pediatrician with expertise in child healthcare, vaccinations, and developmental pediatrics.'
  },
  {
    id: '6',
    first_name: 'David',
    last_name: 'Williams',
    email: 'david.williams@hospital.com',
    phone: '+91 98765 43215',
    specialization: 'Neurology',
    department: 'Neurology',
    qualification: 'MBBS, MD (Medicine), DM (Neurology)',
    experience_years: 20,
    consultation_fee: 2500,
    license_number: 'MCI-12350',
    available_days: ['monday', 'tuesday', 'thursday', 'friday'],
    available_time_start: '10:00',
    available_time_end: '16:00',
    slot_duration: 45,
    is_available: false,
    rating: 4.8,
    total_reviews: 156,
    about: 'Dr. David Williams is a leading neurologist specializing in brain disorders, stroke management, and neurological rehabilitation.'
  },
  {
    id: '7',
    first_name: 'Anjali',
    last_name: 'Gupta',
    email: 'anjali.gupta@hospital.com',
    phone: '+91 98765 43216',
    specialization: 'Gynecology',
    department: 'Gynecology & Obstetrics',
    qualification: 'MBBS, MD (Gynecology), Fellowship in Laparoscopic Surgery',
    experience_years: 13,
    consultation_fee: 1300,
    license_number: 'MCI-12351',
    available_days: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    available_time_start: '10:00',
    available_time_end: '18:00',
    slot_duration: 30,
    is_available: true,
    rating: 4.7,
    total_reviews: 334,
    about: 'Dr. Anjali Gupta is an experienced gynecologist providing comprehensive women\'s healthcare services including prenatal care and minimally invasive surgeries.'
  },
  {
    id: '8',
    first_name: 'Robert',
    last_name: 'Taylor',
    email: 'robert.taylor@hospital.com',
    phone: '+91 98765 43217',
    specialization: 'Ophthalmology',
    department: 'Ophthalmology',
    qualification: 'MBBS, MS (Ophthalmology), FRCS',
    experience_years: 16,
    consultation_fee: 1400,
    license_number: 'MCI-12352',
    available_days: ['monday', 'wednesday', 'friday', 'saturday'],
    available_time_start: '09:00',
    available_time_end: '17:00',
    slot_duration: 25,
    is_available: true,
    rating: 4.6,
    total_reviews: 198,
    about: 'Dr. Robert Taylor is a skilled ophthalmologist specializing in cataract surgery, LASIK, and treatment of various eye conditions.'
  }
];

const specializations = [
  'All',
  'Cardiology',
  'General Medicine',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Neurology',
  'Gynecology',
  'Ophthalmology'
];

const Doctors: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>(demoDoctors);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(demoDoctors);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'fee'>('rating');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, selectedSpecialization, showAvailableOnly, sortBy]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let realDoctors: Doctor[] = [];
      
      try {
        const response = await api.get('/doctors?limit=100');
        realDoctors = response.data?.data?.doctors || [];
        
        if (realDoctors.length > 0) {
          // Merge real doctors with demo doctors, avoiding duplicates
          const realIds = new Set(realDoctors.map(d => d.id));
          const uniqueDemoDoctors = demoDoctors.filter(d => !realIds.has(d.id));
          setDoctors([...realDoctors, ...uniqueDemoDoctors]);
          toast.success(`Loaded ${realDoctors.length} real doctors + ${uniqueDemoDoctors.length} demo doctors`);
        } else {
          setDoctors(demoDoctors);
        }
      } catch (apiError) {
        console.log('API not available, using demo data only');
        setDoctors(demoDoctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors(demoDoctors);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    // Search by name
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor =>
        `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(search) ||
        doctor.specialization.toLowerCase().includes(search)
      );
    }

    // Filter by specialization
    if (selectedSpecialization !== 'All') {
      filtered = filtered.filter(doctor =>
        doctor.specialization === selectedSpecialization
      );
    }

    // Filter by availability
    if (showAvailableOnly) {
      filtered = filtered.filter(doctor => doctor.is_available);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience_years - a.experience_years;
        case 'fee':
          return a.consultation_fee - b.consultation_fee;
        default:
          return 0;
      }
    });

    setFilteredDoctors(filtered);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDays = (days: string[]) => {
    if (days.length === 7) return 'Mon-Sun';
    if (days.length === 5 && days.includes('monday') && days.includes('friday')) {
      return 'Mon-Fri';
    }
    return days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading doctors...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Our Doctors</h1>
          <p className="text-gray-600 mt-1">
            {filteredDoctors.length} doctors available
            {doctors.length > demoDoctors.length && (
              <span className="ml-2 text-sm text-blue-600">(includes real + demo data)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Back to Dashboard Button */}
          <Link
            to={user?.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/register?dept=doctor"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Add New Doctor
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Specialization Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rating' | 'experience' | 'fee')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="rating">Sort by Rating</option>
            <option value="experience">Sort by Experience</option>
            <option value="fee">Sort by Fee (Low to High)</option>
          </select>

          {/* Available Only Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Available only</span>
          </label>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => (
          <div 
            key={doctor.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Card Header */}
            <div className="p-6">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {doctor.avatar_url ? (
                    <img 
                      src={doctor.avatar_url} 
                      alt={`${doctor.first_name} ${doctor.last_name}`}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600">
                        {getInitials(doctor.first_name, doctor.last_name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      doctor.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {doctor.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-blue-600 font-medium mt-1">
                    {doctor.specialization}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center mt-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {doctor.rating}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">
                      ({doctor.total_reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              <div className="mt-4 flex items-start space-x-2">
                <Award className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">{doctor.qualification}</p>
              </div>

              {/* Details */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{doctor.experience_years} years experience</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  <span>₹{doctor.consultation_fee} consultation fee</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{formatDays(doctor.available_days)}</span>
                </div>

                {doctor.license_number && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                    <span>License: {doctor.license_number}</span>
                  </div>
                )}

                {doctor.department && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{doctor.department}</span>
                  </div>
                )}
              </div>

              {/* About */}
              {doctor.about && (
                <p className="mt-4 text-sm text-gray-600 line-clamp-2">
                  {doctor.about}
                </p>
              )}

              {/* Actions */}
              <div className="mt-6 flex space-x-3">
                <Link
                  to={`/doctors/${doctor.id}`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  View Profile
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
                
                {doctor.is_available && user?.role === 'patient' && (
                  <Link
                    to={`/appointments/book?doctor=${doctor.id}`}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Book Appointment
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <button
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    onClick={() => toast('Edit functionality coming soon!')}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredDoctors.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No doctors found</h3>
          <p className="text-gray-600 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Demo Data Notice */}
      {doctors.length === demoDoctors.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Demo Mode</h4>
            <p className="text-sm text-blue-700 mt-1">
              Currently showing demo data. Connect to the backend API to see real doctors.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
