import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  Users,
  User,
  UserCheck,
  UserX,
  Stethoscope,
  Shield,
  ArrowLeft,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient' | 'pharmacist';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

const demoUsers: UserData[] = [
  {
    id: '1',
    first_name: 'Sajal',
    last_name: 'Saini',
    email: '22040690@coer.ac.in',
    phone: '+91 8171168686',
    role: 'admin',
    is_active: true,
    email_verified: true,
    created_at: '2024-01-15',
    last_login: '2024-02-24'
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    phone: '+91 98765 43210',
    role: 'doctor',
    is_active: true,
    email_verified: true,
    created_at: '2024-01-10',
    last_login: '2024-02-23'
  },
  {
    id: '3',
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'michael.chen@hospital.com',
    phone: '+91 98765 43211',
    role: 'doctor',
    is_active: true,
    email_verified: true,
    created_at: '2024-01-12',
    last_login: '2024-02-22'
  },
  {
    id: '4',
    first_name: 'Priya',
    last_name: 'Patel',
    email: 'priya.patel@hospital.com',
    phone: '+91 98765 43214',
    role: 'nurse',
    is_active: true,
    email_verified: true,
    created_at: '2024-01-20',
    last_login: '2024-02-24'
  },
  {
    id: '5',
    first_name: 'Rahul',
    last_name: 'Sharma',
    email: 'rahul.sharma@hospital.com',
    phone: '+91 98765 43220',
    role: 'receptionist',
    is_active: true,
    email_verified: true,
    created_at: '2024-01-25',
    last_login: '2024-02-21'
  },
  {
    id: '6',
    first_name: 'Anita',
    last_name: 'Gupta',
    email: 'anita.gupta@hospital.com',
    phone: '+91 98765 43225',
    role: 'pharmacist',
    is_active: true,
    email_verified: false,
    created_at: '2024-02-01',
    last_login: '2024-02-20'
  },
  {
    id: '7',
    first_name: 'Ramesh',
    last_name: 'Kumar',
    email: 'ramesh.kumar@email.com',
    phone: '+91 98765 43230',
    role: 'patient',
    is_active: true,
    email_verified: true,
    created_at: '2024-02-05',
    last_login: '2024-02-24'
  },
  {
    id: '8',
    first_name: 'Sunita',
    last_name: 'Devi',
    email: 'sunita.devi@email.com',
    phone: '+91 98765 43235',
    role: 'patient',
    is_active: true,
    email_verified: true,
    created_at: '2024-02-10',
    last_login: '2024-02-23'
  },
  {
    id: '9',
    first_name: 'Vikram',
    last_name: 'Singh',
    email: 'vikram.singh@hospital.com',
    phone: '+91 98765 43240',
    role: 'doctor',
    is_active: false,
    email_verified: true,
    created_at: '2024-01-05',
    last_login: '2024-01-30'
  },
  {
    id: '10',
    first_name: 'Neha',
    last_name: 'Verma',
    email: 'neha.verma@hospital.com',
    phone: '+91 98765 43245',
    role: 'nurse',
    is_active: true,
    email_verified: true,
    created_at: '2024-02-15',
    last_login: '2024-02-24'
  }
];

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-pink-100 text-pink-800',
  receptionist: 'bg-green-100 text-green-800',
  patient: 'bg-teal-100 text-teal-800',
  pharmacist: 'bg-orange-100 text-orange-800'
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  patient: 'Patient',
  pharmacist: 'Pharmacist'
};

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>(demoUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>(demoUsers);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let realUsers: UserData[] = [];
      
      try {
        const response = await api.get('/admin/users?limit=100');
        realUsers = response.data?.data?.users || [];
        
        if (realUsers.length > 0) {
          const realIds = new Set(realUsers.map(u => u.id));
          const uniqueDemoUsers = demoUsers.filter(u => !realIds.has(u.id));
          setUsers([...realUsers, ...uniqueDemoUsers]);
          toast(`Loaded ${realUsers.length} real users + ${uniqueDemoUsers.length} demo users`);
        } else {
          setUsers(demoUsers);
        }
      } catch (apiError) {
        console.log('API not available, using demo data only');
        setUsers(demoUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers(demoUsers);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search by name or email
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else if (selectedStatus === 'inactive') {
        filtered = filtered.filter(user => !user.is_active);
      } else if (selectedStatus === 'verified') {
        filtered = filtered.filter(user => user.email_verified);
      }
    }

    setFilteredUsers(filtered);
  };

  // Statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    verified: users.filter(u => u.email_verified).length,
    doctors: users.filter(u => u.role === 'doctor').length,
    patients: users.filter(u => u.role === 'patient').length,
    nurses: users.filter(u => u.role === 'nurse').length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    toast(`${action.charAt(0).toUpperCase() + action.slice(1)} user functionality coming soon! User ID: ${userId}`);
  };

  const handleDeleteUser = (userId: string) => {
    toast(`Delete user functionality coming soon! User ID: ${userId}`);
  };

  const handleEditUser = (userId: string) => {
    toast(`Edit user functionality coming soon! User ID: ${userId}`);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            {filteredUsers.length} users showing
            {users.length > demoUsers.length && (
              <span className="ml-2 text-sm text-blue-600">(includes real + demo data)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Back to Dashboard Button */}
          <Link
            to="/admin-dashboard"
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Doctors</p>
              <p className="text-xl font-bold text-gray-900">{stats.doctors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <User className="h-5 w-5 text-teal-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Patients</p>
              <p className="text-xl font-bold text-gray-900">{stats.patients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <User className="h-5 w-5 text-pink-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Nurses</p>
              <p className="text-xl font-bold text-gray-900">{stats.nurses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="receptionist">Receptionist</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="patient">Patient</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="verified">Email Verified</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchUsers}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((userData) => (
                <tr key={userData.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {getInitials(userData.first_name, userData.last_name)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {userData.first_name} {userData.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[userData.role]}`}>
                      {roleLabels[userData.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{userData.phone || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      Created: {userData.created_at}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        userData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userData.is_active ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                        )}
                      </span>
                      {userData.email_verified && (
                        <span className="text-xs text-green-600" title="Email Verified">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {userData.last_login || 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(userData.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(userData.id, userData.is_active)}
                        className={userData.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={userData.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {userData.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userData.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No users found</h3>
          <p className="text-gray-600 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Demo Data Notice */}
      {users.length === demoUsers.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Demo Mode</h4>
            <p className="text-sm text-blue-700 mt-1">
              Currently showing demo data (10 users). Connect to the backend API to see real user data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
