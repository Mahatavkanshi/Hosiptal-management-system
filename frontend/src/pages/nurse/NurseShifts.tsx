import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  X,
  AlertTriangle,
  Users,
  FileText,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Shift {
  id: string;
  date: string;
  shift_type: 'day' | 'night' | 'rotating';
  department: string;
  start_time: string;
  end_time: string;
  floor_number: number;
  status: 'scheduled' | 'completed' | 'swapped';
}

interface SwapRequest {
  id: string;
  from_date: string;
  to_date: string;
  from_nurse: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

interface OvertimeRecord {
  id: string;
  date: string;
  hours: number;
  reason: string;
  approved: boolean;
}

interface Handover {
  id: string;
  patient_name: string;
  from_nurse: string;
  to_nurse: string;
  shift_date: string;
  critical_notes: string;
  acknowledged: boolean;
}

const demoShifts: Shift[] = [
  { id: '1', date: '2026-02-24', shift_type: 'day', department: 'General Ward', start_time: '07:00', end_time: '19:00', floor_number: 1, status: 'scheduled' },
  { id: '2', date: '2026-02-25', shift_type: 'night', department: 'ICU', start_time: '19:00', end_time: '07:00', floor_number: 2, status: 'scheduled' },
  { id: '3', date: '2026-02-26', shift_type: 'day', department: 'General Ward', start_time: '07:00', end_time: '19:00', floor_number: 1, status: 'scheduled' },
  { id: '4', date: '2026-02-22', shift_type: 'day', department: 'General Ward', start_time: '07:00', end_time: '19:00', floor_number: 1, status: 'completed' },
  { id: '5', date: '2026-02-23', shift_type: 'night', department: 'Emergency', start_time: '19:00', end_time: '07:00', floor_number: 0, status: 'completed' },
];

const demoSwapRequests: SwapRequest[] = [
  { id: '1', from_date: '2026-02-27', to_date: '2026-02-28', from_nurse: 'Sarah Johnson', status: 'pending', reason: 'Family emergency' },
];

const demoOvertime: OvertimeRecord[] = [
  { id: '1', date: '2026-02-20', hours: 3, reason: 'Short-staffed evening', approved: true },
  { id: '2', date: '2026-02-21', hours: 2, reason: 'Emergency admission', approved: true },
];

const demoHandovers: Handover[] = [
  { id: '1', patient_name: 'Michael Chen', from_nurse: 'Sarah Johnson', to_nurse: 'You', shift_date: '2026-02-24', critical_notes: 'High BP, needs monitoring every 2 hours', acknowledged: false },
];

const NurseShifts: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>(demoShifts);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(demoSwapRequests);
  const [overtime, setOvertime] = useState<OvertimeRecord[]>(demoOvertime);
  const [handovers, setHandovers] = useState<Handover[]>(demoHandovers);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'swaps' | 'overtime'>('calendar');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);

  useEffect(() => {
    fetchShiftData();
  }, [currentMonth]);

  const fetchShiftData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, swapsRes, overtimeRes] = await Promise.all([
        api.get(`/shifts/my-schedule?month=${currentMonth.toISOString().slice(0, 7)}`),
        api.get('/shifts/swaps'),
        api.get('/shifts/overtime')
      ]);
      
      if (shiftsRes.data?.data) setShifts(shiftsRes.data.data);
      if (swapsRes.data?.data) setSwapRequests(swapsRes.data.data);
      if (overtimeRes.data?.data) setOvertime(overtimeRes.data.data);
    } catch (error) {
      console.log('Using demo data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getShiftForDate = (date: number) => {
    const dateStr = `${currentMonth.toISOString().slice(0, 7)}-${String(date).padStart(2, '0')}`;
    return shifts.find(s => s.date === dateStr);
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case 'day': return <Sun className="h-4 w-4" />;
      case 'night': return <Moon className="h-4 w-4" />;
      case 'rotating': return <RefreshCw className="h-4 w-4" />;
      default: return null;
    }
  };

  const getShiftColor = (type: string, status: string) => {
    if (status === 'completed') return 'bg-gray-100 text-gray-500';
    switch (type) {
      case 'day': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'night': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'rotating': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayShift = shifts.find(s => s.date === today);

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-600 mt-1">Manage your schedule, swaps, and overtime</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSwapModal(true)}
            className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Swap
          </button>
          <button
            onClick={() => setShowOvertimeModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Clock className="h-4 w-4 mr-2" />
            Log Overtime
          </button>
        </div>
      </div>

      {/* Today's Shift Card */}
      {todayShift && (
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium">Today's Shift</p>
              <h2 className="text-2xl font-bold mt-1 capitalize">{todayShift.shift_type} Shift</h2>
              <p className="text-pink-100 mt-2">
                {todayShift.start_time} - {todayShift.end_time}
              </p>
              <p className="text-pink-100">
                {todayShift.department} • Floor {todayShift.floor_number}
              </p>
            </div>
            <div className="text-right">
              <div className="p-4 bg-white/20 rounded-full">
                {getShiftIcon(todayShift.shift_type)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['calendar', 'swaps', 'overtime'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white p-4 min-h-[100px]" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = i + 1;
                const shift = getShiftForDate(date);
                const isToday = `${currentMonth.toISOString().slice(0, 7)}-${String(date).padStart(2, '0')}` === today;
                
                return (
                  <div
                    key={date}
                    className={`bg-white p-2 min-h-[100px] border-b border-r border-gray-100 ${
                      isToday ? 'bg-pink-50' : ''
                    }`}
                  >
                    <span className={`text-sm font-medium ${isToday ? 'text-pink-600' : 'text-gray-700'}`}>
                      {date}
                    </span>
                    {shift && (
                      <div className={`mt-1 p-2 rounded-lg text-xs ${getShiftColor(shift.shift_type, shift.status)}`}>
                        <div className="flex items-center gap-1">
                          {getShiftIcon(shift.shift_type)}
                          <span className="capitalize">{shift.shift_type}</span>
                        </div>
                        <div className="mt-1">{shift.department}</div>
                        <div className="text-gray-500">{shift.start_time}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Handovers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-pink-600" />
                Pending Handovers
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {handovers.filter(h => !h.acknowledged).map((handover) => (
                <div key={handover.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{handover.patient_name}</p>
                      <p className="text-sm text-gray-500">From: {handover.from_nurse}</p>
                      <p className="text-sm text-red-600 mt-1">{handover.critical_notes}</p>
                    </div>
                    <button
                      onClick={() => toast.success('Handover acknowledged!')}
                      className="px-3 py-1 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
              {handovers.filter(h => !h.acknowledged).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No pending handovers</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <Link
                to="/nurse/shifts/handovers"
                className="flex items-center justify-center text-pink-600 hover:text-pink-700 font-medium"
              >
                View All Handovers <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Swap Requests */}
      {activeTab === 'swaps' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">My Swap Requests</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {swapRequests.map((swap) => (
              <div key={swap.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <RefreshCw className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Swap {swap.from_date} → {swap.to_date}
                      </p>
                      <p className="text-sm text-gray-500">Request from: {swap.from_nurse}</p>
                      <p className="text-sm text-gray-600 mt-1">Reason: {swap.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      swap.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      swap.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                    </span>
                    {swap.status === 'pending' && (
                      <>
                        <button
                          onClick={() => toast.success('Swap request approved!')}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => toast.error('Swap request rejected')}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {swapRequests.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No swap requests</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overtime Records */}
      {activeTab === 'overtime' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Overtime Records</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {overtime.map((record) => (
              <div key={record.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{record.date}</p>
                      <p className="text-sm text-gray-600">{record.hours} hours • {record.reason}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    record.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {record.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
            {overtime.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No overtime records</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Shift Swap</h3>
              <button onClick={() => setShowSwapModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Shift Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Enter reason for swap request..." />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Swap request submitted!');
                    setShowSwapModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overtime Modal */}
      {showOvertimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Log Overtime</h3>
              <button onClick={() => setShowOvertimeModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <input type="number" step="0.5" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter reason for overtime..." />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOvertimeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Overtime logged successfully!');
                    setShowOvertimeModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Log Overtime
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseShifts;
