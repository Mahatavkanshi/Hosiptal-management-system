import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  Bed,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  ArrowLeft,
  BedDouble,
  MapPin,
  MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Bed {
  id: string;
  bed_number: string;
  room_number: string;
  ward_type: 'general' | 'semi_private' | 'private' | 'icu' | 'ccu' | 'emergency';
  floor_number: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
  daily_charge: number;
  patient_id?: string;
  patient_name?: string;
  assigned_date?: string;
  discharge_date?: string;
  amenities: string[];
  notes?: string;
}

const demoBeds: Bed[] = [
  {
    id: '1',
    bed_number: '101-A',
    room_number: '101',
    ward_type: 'general',
    floor_number: 1,
    status: 'occupied',
    daily_charge: 1500,
    patient_id: 'P001',
    patient_name: 'Rahul Sharma',
    assigned_date: '2024-02-20',
    discharge_date: '2024-02-25',
    amenities: ['TV', 'AC', 'WiFi'],
    notes: 'Post-surgery recovery'
  },
  {
    id: '2',
    bed_number: '101-B',
    room_number: '101',
    ward_type: 'general',
    floor_number: 1,
    status: 'available',
    daily_charge: 1500,
    amenities: ['TV', 'AC', 'WiFi']
  },
  {
    id: '3',
    bed_number: '102-A',
    room_number: '102',
    ward_type: 'semi_private',
    floor_number: 1,
    status: 'occupied',
    daily_charge: 2500,
    patient_id: 'P002',
    patient_name: 'Priya Patel',
    assigned_date: '2024-02-22',
    discharge_date: '2024-02-24',
    amenities: ['TV', 'AC', 'WiFi', 'Refrigerator'],
    notes: 'Maternity case'
  },
  {
    id: '4',
    bed_number: '201-A',
    room_number: '201',
    ward_type: 'private',
    floor_number: 2,
    status: 'available',
    daily_charge: 4000,
    amenities: ['TV', 'AC', 'WiFi', 'Refrigerator', 'Sofa']
  },
  {
    id: '5',
    bed_number: '201-B',
    room_number: '201',
    ward_type: 'private',
    floor_number: 2,
    status: 'occupied',
    daily_charge: 4000,
    patient_id: 'P003',
    patient_name: 'Amit Kumar',
    assigned_date: '2024-02-21',
    discharge_date: '2024-02-28',
    amenities: ['TV', 'AC', 'WiFi', 'Refrigerator', 'Sofa'],
    notes: 'Cardiac monitoring required'
  },
  {
    id: '6',
    bed_number: '301-A',
    room_number: '301',
    ward_type: 'icu',
    floor_number: 3,
    status: 'occupied',
    daily_charge: 8000,
    patient_id: 'P004',
    patient_name: 'Sunita Devi',
    assigned_date: '2024-02-23',
    discharge_date: '2024-02-26',
    amenities: ['Ventilator', 'Monitor', 'AC'],
    notes: 'Critical care'
  },
  {
    id: '7',
    bed_number: '301-B',
    room_number: '301',
    ward_type: 'icu',
    floor_number: 3,
    status: 'available',
    daily_charge: 8000,
    amenities: ['Ventilator', 'Monitor', 'AC']
  },
  {
    id: '8',
    bed_number: '302-A',
    room_number: '302',
    ward_type: 'ccu',
    floor_number: 3,
    status: 'maintenance',
    daily_charge: 7500,
    amenities: ['Monitor', 'AC'],
    notes: 'Equipment servicing'
  },
  {
    id: '9',
    bed_number: '401-A',
    room_number: '401',
    ward_type: 'private',
    floor_number: 4,
    status: 'cleaning',
    daily_charge: 3500,
    amenities: ['TV', 'AC', 'WiFi']
  },
  {
    id: '10',
    bed_number: '401-B',
    room_number: '401',
    ward_type: 'private',
    floor_number: 4,
    status: 'reserved',
    daily_charge: 3500,
    amenities: ['TV', 'AC', 'WiFi'],
    notes: 'Reserved for tomorrow'
  },
  {
    id: '11',
    bed_number: 'E-01',
    room_number: 'Emergency-01',
    ward_type: 'emergency',
    floor_number: 0,
    status: 'occupied',
    daily_charge: 2000,
    patient_id: 'P005',
    patient_name: 'Mohammad Ali',
    assigned_date: '2024-02-24',
    amenities: ['Monitor', 'AC'],
    notes: 'Accident case'
  },
  {
    id: '12',
    bed_number: 'E-02',
    room_number: 'Emergency-02',
    ward_type: 'emergency',
    floor_number: 0,
    status: 'available',
    daily_charge: 2000,
    amenities: ['Monitor', 'AC']
  }
];

const wardTypes = [
  { value: 'all', label: 'All Wards', color: 'bg-gray-100' },
  { value: 'general', label: 'General', color: 'bg-green-100' },
  { value: 'semi_private', label: 'Semi-Private', color: 'bg-blue-100' },
  { value: 'private', label: 'Private', color: 'bg-purple-100' },
  { value: 'icu', label: 'ICU', color: 'bg-red-100' },
  { value: 'ccu', label: 'CCU', color: 'bg-orange-100' },
  { value: 'emergency', label: 'Emergency', color: 'bg-yellow-100' }
];

const statusColors = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  maintenance: 'bg-gray-500',
  cleaning: 'bg-yellow-500',
  reserved: 'bg-blue-500'
};

const statusLabels = {
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  cleaning: 'Cleaning',
  reserved: 'Reserved'
};

const BedManagement: React.FC = () => {
  const { user } = useAuth();
  const [beds, setBeds] = useState<Bed[]>(demoBeds);
  const [filteredBeds, setFilteredBeds] = useState<Bed[]>(demoBeds);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');

  useEffect(() => {
    fetchBeds();
  }, []);

  useEffect(() => {
    filterBeds();
  }, [beds, searchTerm, selectedWard, selectedStatus, selectedFloor]);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      let realBeds: Bed[] = [];
      
      try {
        const response = await api.get('/beds?limit=100');
        realBeds = response.data?.data?.beds || [];
        
        if (realBeds.length > 0) {
          const realIds = new Set(realBeds.map(b => b.id));
          const uniqueDemoBeds = demoBeds.filter(b => !realIds.has(b.id));
          setBeds([...realBeds, ...uniqueDemoBeds]);
          toast.success(`Loaded ${realBeds.length} real beds + ${uniqueDemoBeds.length} demo beds`);
        } else {
          setBeds(demoBeds);
        }
      } catch (apiError) {
        console.log('API not available, using demo data only');
        setBeds(demoBeds);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      setBeds(demoBeds);
    } finally {
      setLoading(false);
    }
  };

  const filterBeds = () => {
    let filtered = [...beds];

    // Search by bed number or patient name
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(bed =>
        bed.bed_number.toLowerCase().includes(search) ||
        bed.room_number.toLowerCase().includes(search) ||
        bed.patient_name?.toLowerCase().includes(search)
      );
    }

    // Filter by ward type
    if (selectedWard !== 'all') {
      filtered = filtered.filter(bed => bed.ward_type === selectedWard);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(bed => bed.status === selectedStatus);
    }

    // Filter by floor
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(bed => bed.floor_number === parseInt(selectedFloor));
    }

    setFilteredBeds(filtered);
  };

  // Statistics
  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'available').length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    maintenance: beds.filter(b => b.status === 'maintenance').length,
    cleaning: beds.filter(b => b.status === 'cleaning').length,
    reserved: beds.filter(b => b.status === 'reserved').length,
    occupancyRate: Math.round((beds.filter(b => b.status === 'occupied').length / beds.length) * 100)
  };

  const getWardColor = (wardType: string) => {
    return wardTypes.find(w => w.value === wardType)?.color || 'bg-gray-100';
  };

  const handleAllocateBed = (bedId: string) => {
    toast(`Allocate bed functionality coming soon! Bed ID: ${bedId}`);
  };

  const handleDischargePatient = (bedId: string) => {
    toast(`Discharge patient functionality coming soon! Bed ID: ${bedId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading beds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bed Management</h1>
          <p className="text-gray-600 mt-1">
            {filteredBeds.length} beds showing
            {beds.length > demoBeds.length && (
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

          <button
            onClick={() => toast('Add new bed functionality coming soon!')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bed
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BedDouble className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Beds</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-xl font-bold text-gray-900">{stats.available}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <User className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-xl font-bold text-gray-900">{stats.occupied}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RefreshCw className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Cleaning</p>
              <p className="text-xl font-bold text-gray-900">{stats.cleaning}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-xl font-bold text-gray-900">{stats.maintenance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bed className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Occupancy</p>
              <p className="text-xl font-bold text-gray-900">{stats.occupancyRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search beds or patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ward Type Filter */}
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {wardTypes.map(ward => (
              <option key={ward.value} value={ward.value}>{ward.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
            <option value="cleaning">Cleaning</option>
            <option value="reserved">Reserved</option>
          </select>

          {/* Floor Filter */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Floors</option>
            <option value="0">Ground Floor</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
            <option value="4">Floor 4</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchBeds}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => (
          <div 
            key={bed.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Status Indicator */}
            <div className={`h-2 ${statusColors[bed.status]}`} />
            
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{bed.bed_number}</h3>
                  <p className="text-sm text-gray-500">Room {bed.room_number}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWardColor(bed.ward_type)}`}>
                  {bed.ward_type.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  bed.status === 'available' ? 'bg-green-100 text-green-800' :
                  bed.status === 'occupied' ? 'bg-red-100 text-red-800' :
                  bed.status === 'maintenance' ? 'bg-gray-100 text-gray-800' :
                  bed.status === 'cleaning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {bed.status === 'available' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {bed.status === 'occupied' && <User className="h-3 w-3 mr-1" />}
                  {bed.status === 'maintenance' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {bed.status === 'cleaning' && <RefreshCw className="h-3 w-3 mr-1" />}
                  {bed.status === 'reserved' && <Calendar className="h-3 w-3 mr-1" />}
                  {statusLabels[bed.status]}
                </span>
              </div>

              {/* Patient Info (if occupied) */}
              {bed.status === 'occupied' && bed.patient_name && (
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-900">{bed.patient_name}</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Admitted: {bed.assigned_date}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Discharge: {bed.discharge_date}
                    </div>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>Floor {bed.floor_number}</span>
                </div>
                <div className="flex items-center">
                  <Bed className="h-4 w-4 mr-2 text-gray-400" />
                  <span>₹{bed.daily_charge}/day</span>
                </div>
                {bed.amenities && bed.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bed.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {bed.notes && (
                <p className="mt-3 text-xs text-gray-500 italic">
                  Note: {bed.notes}
                </p>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {bed.status === 'available' && (
                  <button
                    onClick={() => handleAllocateBed(bed.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Allocate
                  </button>
                )}
                
                {bed.status === 'occupied' && (
                  <button
                    onClick={() => handleDischargePatient(bed.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Discharge
                  </button>
                )}

                {(bed.status === 'maintenance' || bed.status === 'cleaning') && (
                  <button
                    onClick={() => toast('Mark as available coming soon!')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark Available
                  </button>
                )}

                <button
                  onClick={() => toast('View details coming soon!')}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredBeds.length === 0 && (
        <div className="text-center py-12">
          <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No beds found</h3>
          <p className="text-gray-600 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Demo Data Notice */}
      {beds.length === demoBeds.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Demo Mode</h4>
            <p className="text-sm text-blue-700 mt-1">
              Currently showing demo data (12 beds). Connect to the backend API to see real bed data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagement;
