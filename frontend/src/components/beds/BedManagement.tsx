import { useState, useEffect } from 'react';
import { BedDouble, Users, Plus, CheckCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { isDark } = useTheme();
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
    if (isDark) {
      const colors: { [key: string]: string } = {
        general: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        semi_private: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        private: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        icu: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        ccu: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        emergency: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      };
      return colors[wardType] || 'bg-gray-700 text-gray-400 border border-gray-600';
    }
    const colors: { [key: string]: string } = {
      general: 'bg-emerald-100 text-emerald-800',
      semi_private: 'bg-blue-100 text-blue-800',
      private: 'bg-purple-100 text-purple-800',
      icu: 'bg-rose-100 text-rose-800',
      ccu: 'bg-orange-100 text-orange-800',
      emergency: 'bg-amber-100 text-amber-800'
    };
    return colors[wardType] || 'bg-gray-100 text-gray-800';
  };

  const formatWardName = (wardType: string) => {
    return wardType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className={`rounded-2xl overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl' 
          : 'bg-white border border-gray-200 shadow-xl'
      }`}>
        <div className={`px-6 py-5 border-b ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bed Management</h3>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl' 
        : 'bg-white border border-gray-200 shadow-xl'
    }`}>
      {/* Header */}
      <div className={`px-6 py-5 border-b ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`p-2.5 rounded-xl ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
              <BedDouble className={`h-6 w-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Bed Management</h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`flex items-center text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {availableBeds.length} Available
                </span>
                <span className={`flex items-center text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  <Users className="h-4 w-4 mr-1" />
                  {occupiedBeds.length} Occupied
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onAllocateBed}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Allocate Bed
            </button>
            <button 
              onClick={onBack} 
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                isDark 
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className={`border-b ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveView('available')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-semibold text-sm transition-all ${
              activeView === 'available'
                ? 'border-blue-500 text-blue-500'
                : isDark 
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center">
              <BedDouble className="h-5 w-5 mr-2" />
              Available Beds ({availableBeds.length})
            </div>
          </button>
          <button
            onClick={() => setActiveView('occupied')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-semibold text-sm transition-all ${
              activeView === 'occupied'
                ? 'border-blue-500 text-blue-500'
                : isDark 
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
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
              <h4 className={`text-lg font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <BedDouble className="h-5 w-5 mr-2 text-emerald-500" />
                Available Beds - Assign Patient
              </h4>
              {availableBeds.some((bed: Bed) => bed.id.startsWith('dummy-')) && (
                <span className={`text-xs px-3 py-1 rounded-full ${
                  isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-800'
                }`}>
                  Demo Data - Real beds will appear here
                </span>
              )}
            </div>
            
            {availableBeds.length === 0 ? (
              <div className="text-center py-12">
                <BedDouble className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No available beds found</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>All beds are currently occupied</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full ${isDark ? 'bg-slate-900/30' : 'bg-white'}`}>
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800/80' : 'bg-gray-50'}`}>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Room Number
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Bed Details
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Patient Name
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Supervising Doctor
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                    {availableBeds.map((bed) => (
                      <tr key={bed.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                              <BedDouble className={`h-5 w-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Room {bed.room_number}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Floor {bed.floor_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Bed {bed.bed_number}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold mt-1 ${getWardColor(bed.ward_type)}`}>
                            {formatWardName(bed.ward_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="Enter patient name"
                            className={`block w-full rounded-lg shadow-sm px-3 py-2 text-sm transition-all ${
                              isDark 
                                ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500' 
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            <UserCheck className={`h-4 w-4 mr-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            Dr. {user?.first_name} {user?.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={onAllocateBed}
                            className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
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
            <h4 className={`text-lg font-bold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Occupied Beds
            </h4>
            
            {occupiedBeds.length === 0 ? (
              <div className="text-center py-12">
                <Users className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No occupied beds found</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No patients are currently admitted</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full ${isDark ? 'bg-slate-900/30' : 'bg-white'}`}>
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800/80' : 'bg-gray-50'}`}>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Room / Bed
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Patient Name
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ward Type
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Supervising Doctor
                      </th>
                      <th className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Admitted Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                    {occupiedBeds.map((bed) => (
                      <tr key={bed.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                              <BedDouble className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Room {bed.room_number}
                              </div>
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                Bed {bed.bed_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {bed.patient_first_name} {bed.patient_last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getWardColor(bed.ward_type)}`}>
                            {formatWardName(bed.ward_type)}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Dr. {user?.first_name} {user?.last_name}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {bed.assigned_date ? new Date(bed.assigned_date).toLocaleDateString() : 'N/A'}
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
