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

const GlassCard = ({ children, className = '', cardColors }: { children: React.ReactNode; className?: string; cardColors: any }) => (
  <div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${cardColors.bg} ${cardColors.border} ${className}`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${cardColors.inputBg} to-transparent pointer-events-none`} />
    <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${cardColors.inputBg} to-transparent rounded-full blur-3xl pointer-events-none`} />
    <div className="relative z-10">{children}</div>
  </div>
);

const BedManagement = ({ onBack, onAllocateBed }: BedManagementProps) => {
  const { user } = useAuth();
  const { cardColors } = useTheme();
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
      general: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      semi_private: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      private: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      icu: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      ccu: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      emergency: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    };
    return colors[wardType] || `${cardColors.inputBgClass} text-slate-400 ${cardColors.inputBorder}`;
  };

  const formatWardName = (wardType: string) => {
    return wardType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <GlassCard cardColors={cardColors}>
        <div className={`px-6 py-5 border-b ${cardColors.inputBorder}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Bed Management</h3>
          </div>
        </div>
        <div className="p-6 flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard cardColors={cardColors}>
      {/* Header */}
      <div className={`px-6 py-5 border-b ${cardColors.inputBorder}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/20">
              <BedDouble className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Bed Management</h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center text-sm text-emerald-400">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {availableBeds.length} Available
                </span>
                <span className="flex items-center text-sm text-blue-400">
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
              className={`px-4 py-2 rounded-xl font-semibold transition-all text-white/80 border ${cardColors.inputBgClass} ${cardColors.inputBorder} ${cardColors.hover}`}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className={`border-b ${cardColors.inputBorder}`}>
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveView('available')}
            className={`w-1/2 py-4 px-1 text-center border-b-2 font-semibold text-sm transition-all ${
              activeView === 'available'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-white/50 hover:text-white/70'
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
                : 'border-transparent text-white/50 hover:text-white/70'
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
              <h4 className="text-lg font-bold flex items-center text-white">
                <BedDouble className="h-5 w-5 mr-2 text-emerald-500" />
                Available Beds - Assign Patient
              </h4>
              {availableBeds.some((bed: Bed) => bed.id.startsWith('dummy-')) && (
                <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Demo Data - Real beds will appear here
                </span>
              )}
            </div>
            
            {availableBeds.length === 0 ? (
              <div className="text-center py-12">
                <BedDouble className="h-12 w-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/50">No available beds found</p>
                <p className="text-sm mt-1 text-white/40">All beds are currently occupied</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full ${cardColors.inputBg}`}>
                  <thead>
                    <tr className={cardColors.inputBg}>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Room Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Bed Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Patient Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Supervising Doctor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${cardColors.tableDivide}`}>
                    {availableBeds.map((bed) => (
                      <tr key={bed.id} className={`transition-colors ${cardColors.rowHover}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/20">
                              <BedDouble className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-white">
                                Room {bed.room_number}
                              </div>
                              <div className="text-xs text-white/50">
                                Floor {bed.floor_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            Bed {bed.bed_number}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getWardColor(bed.ward_type)}`}>
                            {formatWardName(bed.ward_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="Enter patient name"
                            className={`block w-full rounded-lg shadow-sm px-3 py-2 text-sm transition-all text-white placeholder-white/30 focus:border-blue-500 focus:ring-blue-500 ${cardColors.inputBgClass} ${cardColors.inputBorder}`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-medium text-white/70">
                            <UserCheck className="h-4 w-4 mr-2 text-white/50" />
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
            <h4 className="text-lg font-bold mb-4 flex items-center text-white">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Occupied Beds
            </h4>
            
            {occupiedBeds.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-white/30" />
                <p className="text-white/50">No occupied beds found</p>
                <p className="text-sm mt-1 text-white/40">No patients are currently admitted</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={`min-w-full ${cardColors.inputBg}`}>
                  <thead>
                    <tr className={cardColors.inputBg}>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Room / Bed
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Patient Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Ward Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Supervising Doctor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-white/50">
                        Admitted Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${cardColors.tableDivide}`}>
                    {occupiedBeds.map((bed) => (
                      <tr key={bed.id} className={`transition-colors ${cardColors.rowHover}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-blue-500/20">
                              <BedDouble className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-white">
                                Room {bed.room_number}
                              </div>
                              <div className="text-xs text-white/50">
                                Bed {bed.bed_number}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                          {bed.patient_first_name} {bed.patient_last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getWardColor(bed.ward_type)}`}>
                            {formatWardName(bed.ward_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white/70">
                          Dr. {user?.first_name} {user?.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/50">
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
    </GlassCard>
  );
};

export default BedManagement;