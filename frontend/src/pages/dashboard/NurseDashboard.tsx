import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Bed,
  Clock,
  Pill,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Plus,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  age: number;
  room: string;
  status: 'stable' | 'critical' | 'recovering';
  vitals: {
    bp: string;
    hr: number;
    temp: number;
    spo2: number;
  };
  lastChecked: string;
}

interface Task {
  id: string;
  patientName: string;
  task: string;
  time: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

const NurseDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Demo data
      setTimeout(() => {
        setPatients([
          {
            id: '1',
            name: 'Alice Johnson',
            age: 45,
            room: '101-A',
            status: 'stable',
            vitals: { bp: '120/80', hr: 72, temp: 98.6, spo2: 98 },
            lastChecked: '10 mins ago'
          },
          {
            id: '2',
            name: 'Bob Smith',
            age: 62,
            room: '102-B',
            status: 'recovering',
            vitals: { bp: '135/85', hr: 78, temp: 99.2, spo2: 96 },
            lastChecked: '25 mins ago'
          },
          {
            id: '3',
            name: 'Carol Williams',
            age: 28,
            room: '103-A',
            status: 'stable',
            vitals: { bp: '110/70', hr: 68, temp: 98.4, spo2: 99 },
            lastChecked: '1 hour ago'
          },
          {
            id: '4',
            name: 'David Brown',
            age: 55,
            room: '104-C',
            status: 'critical',
            vitals: { bp: '160/95', hr: 95, temp: 101.2, spo2: 92 },
            lastChecked: '5 mins ago'
          }
        ]);

        setTasks([
          { id: '1', patientName: 'Alice Johnson', task: 'Administer medication', time: '09:00 AM', completed: false, priority: 'high' },
          { id: '2', patientName: 'Bob Smith', task: 'Check vitals', time: '09:30 AM', completed: true, priority: 'medium' },
          { id: '3', patientName: 'Carol Williams', task: 'Change dressing', time: '10:00 AM', completed: false, priority: 'medium' },
          { id: '4', patientName: 'David Brown', task: 'Emergency monitoring', time: 'Now', completed: false, priority: 'high' },
        ]);

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'bg-green-100 text-green-700';
      case 'critical': return 'bg-red-100 text-red-700';
      case 'recovering': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.room.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nursing Dashboard</h1>
          <p className="text-gray-600 mt-1">Patient care and monitoring center</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Bed className="h-4 w-4 mr-2" />
            Allocate Bed
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-2xl font-bold text-gray-900">{patients.filter(p => p.status === 'critical').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => !t.completed).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.completed).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">My Patients</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-pink-600 font-semibold">{patient.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">Room {patient.room} • Age {patient.age}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                    {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                  </span>
                </div>
                
                {/* Vitals */}
                <div className="grid grid-cols-4 gap-4 mt-4 ml-14">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-gray-600">{patient.vitals.hr} bpm</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">{patient.vitals.bp}</span>
                  </div>
                  <div className="flex items-center">
                    <Thermometer className="h-4 w-4 text-orange-500 mr-2" />
                    <span className="text-sm text-gray-600">{patient.vitals.temp}°F</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-green-600 font-medium">SpO2 {patient.vitals.spo2}%</span>
                  </div>
                </div>
                
                <div className="mt-3 ml-14">
                  <p className="text-xs text-gray-400">Last checked: {patient.lastChecked}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${task.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-colors ${
                      task.completed 
                        ? 'bg-pink-500 border-pink-500' 
                        : 'border-gray-300 hover:border-pink-500'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>
                  
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.task}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{task.patientName}</p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{task.time}</span>
                      <span className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${task.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                        ${task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${task.priority === 'low' ? 'bg-green-100 text-green-700' : ''}
                      `}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
