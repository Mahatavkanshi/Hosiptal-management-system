import { useState, useEffect } from 'react';
import { BedDouble, Users, ArrowLeft, Plus, CheckCircle, Clock, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Bed {
  id: string;
  bed_number: string;
  room_number: string;
  ward_type: string;
  floor_number: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  daily_charge: number;
  patient_first_name?: string;
  patient_last_name?: string;
  blood_group?: string;
  assigned_date?: string;
}

interface BedManagementProps {
  onBack: () => void;
  onAllocateBed: () => void;
}

const BedManagement = ({ onBack, onAllocateBed }: BedManagementProps) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'available' | 'occupied'>('available');
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [occupiedBeds, setOccupiedBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBeds();
  }, []);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      
      // Fetch available beds
      const availableRes = await api.get('/beds?status=available&limit=100');
      const fetchedAvailableBeds = availableRes.data.data.beds;
      
      // Fetch occupied beds
      const occupiedRes = await api.get('/beds?status=occupied&limit=100');
      const fetchedOccupiedBeds = occupiedRes.data.data.beds;
      
      // If no available beds from API, add dummy data for display
      let finalAvailableBeds = fetchedAvailableBeds;
      if (fetchedAvailableBeds.length === 0) {
        finalAvailableBeds = [
          { id: 'dummy-1', bed_number: 'A1', room_number: '101', ward_type: 'general', floor_number: 1, status: 'available', daily_charge: 1500 },
          { id: 'dummy-2', bed_number: 'B1', room_number: '102', ward_type: 'semi_private', floor_number: 1, status: 'available', daily_charge: 2500 },
          { id: 'dummy-3', bed_number: 'A1', room_number: '201', ward_type: 'private', floor_number: 2, status: 'available', daily_charge: 5000 },
          { id: 'dummy-4', bed_number: 'ICU-1', room_number: 'ICU-01', ward_type: 'icu', floor_number: 0, status: 'available', daily_charge: 8000 },
        ];
      }
      
      setAvailableBeds(finalAvailableBeds);
      setOccupiedBeds(fetchedOccupiedBeds);
    } catch (error) {
      console.error('Error fetching beds:', error);
      toast.error('Failed to load beds data');
    } finally {
      setLoading(false);
    }
  };

  const getWardColor = (wardType: string) => {
    const colors: { [key: string]: string } = {
      general: 'bg-green-100 text-green-800',
      semi_private: 'bg-blue-100 text-blue-800',
      private: 'bg-purple-100 text-purple-800',
      icu: 'bg-red-100 text-red-800',
      ccu: 'bg-orange-100 text-orange-800',
      emergency: 'bg-yellow-100 text-yellow-800'
    };
    return colors[wardType] || 'bg-gray-100 text-gray-800';
  };

  const formatWardName = (wardType: string) => {
    return wardType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Bed Management</h3>
            <button onClick={onBack} className="text-primary-600 hover:text-primary-700">
              ← Back
            </button>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Bed Management</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                {availableBeds.length} Available
              </span>
              <span className="flex items-center">
                <Users className="h-4 w-4 text-blue-500 mr-1" />
                {occupiedBeds.length} Occupied
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onAllocateBed}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Allocate Bed
            </button>
            <button onClick={onBack} className="text-primary-600 hover:text-primary-700">
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveView('available')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeView === 'available'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <BedDouble className="h-5 w-5 mr-2" />
              Available Beds ({availableBeds.length})
            </div>
          </button>
          <button
            onClick={() => setActiveView('occupied')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
              activeView === 'occupied'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <Users className="h-5 w-5 mr-2" />
              Occupied Beds ({occupiedBeds.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeView === 'available' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <BedDouble className="h-5 w-5 mr-2 text-green-500" />
                Available Beds - Assign Patient
              </h4>
              {availableBeds.some((bed: Bed) => bed.id.startsWith('dummy-')) && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Demo Data - Real beds will appear here
                </span>
              )}
            </div>
            
            {availableBeds.length === 0 ? (
              <div className="text-center py-12">
                <BedDouble className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No available beds found</p>
                <p className="text-sm text-gray-400 mt-1">All beds are currently occupied</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bed Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supervising Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {availableBeds.map((bed) => (
                      <tr key={bed.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <BedDouble className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Room {bed.room_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                Floor {bed.floor_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Bed {bed.bed_number}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getWardColor(bed.ward_type)}`}>
                            {formatWardName(bed.ward_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="Enter patient name"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                            Dr. {user?.first_name} {user?.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={onAllocateBed}
                            className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-md transition-colors"
                          >
                            Allocate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Occupied Beds
            </h4>
            
            {occupiedBeds.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No occupied beds found</p>
                <p className="text-sm text-gray-400 mt-1">No patients are currently admitted</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room / Bed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ward Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supervising Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admitted Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {occupiedBeds.map((bed) => (
                      <tr key={bed.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <BedDouble className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                Room {bed.room_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                Bed {bed.bed_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-700 font-medium text-sm">
                                {bed.patient_first_name?.[0]}{bed.patient_last_name?.[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {bed.patient_first_name} {bed.patient_last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Blood: {bed.blood_group || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWardColor(bed.ward_type)}`}>
                            {formatWardName(bed.ward_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                            Dr. {user?.first_name} {user?.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {bed.assigned_date 
                              ? new Date(bed.assigned_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BedManagement;
