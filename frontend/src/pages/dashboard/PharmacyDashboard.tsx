import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Truck,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Medicine {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  expiryDate: string;
  supplier: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  medicines: string[];
  date: string;
  status: 'pending' | 'dispensed' | 'cancelled';
}

const PharmacyDashboard: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Demo data
      setTimeout(() => {
        setMedicines([
          { id: '1', name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 150, minStock: 50, unit: 'tablets', expiryDate: '2025-12-31', supplier: 'MediCorp', status: 'in-stock' },
          { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', stock: 25, minStock: 30, unit: 'capsules', expiryDate: '2025-08-15', supplier: 'PharmaPlus', status: 'low-stock' },
          { id: '3', name: 'Insulin Glargine', category: 'Diabetes', stock: 0, minStock: 20, unit: 'vials', expiryDate: '2025-06-30', supplier: 'BioCare', status: 'out-of-stock' },
          { id: '4', name: 'Vitamin D3', category: 'Supplements', stock: 200, minStock: 100, unit: 'tablets', expiryDate: '2026-03-31', supplier: 'HealthFirst', status: 'in-stock' },
          { id: '5', name: 'Omeprazole 20mg', category: 'Gastrointestinal', stock: 45, minStock: 50, unit: 'capsules', expiryDate: '2025-10-31', supplier: 'MediCorp', status: 'low-stock' },
        ]);

        setPrescriptions([
          { id: '1', patientName: 'John Doe', doctorName: 'Dr. Smith', medicines: ['Paracetamol 500mg', 'Amoxicillin 250mg'], date: '2024-01-15', status: 'pending' },
          { id: '2', patientName: 'Jane Smith', doctorName: 'Dr. Johnson', medicines: ['Vitamin D3'], date: '2024-01-15', status: 'dispensed' },
          { id: '3', patientName: 'Mike Johnson', doctorName: 'Dr. Williams', medicines: ['Omeprazole 20mg'], date: '2024-01-14', status: 'pending' },
        ]);

        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'in-stock': 'bg-green-100 text-green-700',
      'low-stock': 'bg-yellow-100 text-yellow-700',
      'out-of-stock': 'bg-red-100 text-red-700',
      'pending': 'bg-blue-100 text-blue-700',
      'dispensed': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    totalMedicines: medicines.length,
    lowStock: medicines.filter(m => m.status === 'low-stock').length,
    outOfStock: medicines.filter(m => m.status === 'out-of-stock').length,
    pendingPrescriptions: prescriptions.filter(p => p.status === 'pending').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
          <p className="text-gray-600 mt-1">Medicine inventory and prescription management</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </button>
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Truck className="h-4 w-4 mr-2" />
            Order Stock
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <div className="flex-1">
            <p className="text-sm text-red-800">
              <strong>Stock Alert:</strong> {stats.lowStock} medicines are running low and {stats.outOfStock} are out of stock. Please reorder soon.
            </p>
          </div>
          <button className="text-sm text-red-600 hover:text-red-700 font-medium">
            View All
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Medicines</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMedicines}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingPrescriptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inventory' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Medicine Inventory
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'prescriptions' 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Prescriptions
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'inventory' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </button>
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Medicine</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Stock</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Expiry Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {medicines.map((medicine) => (
                      <tr key={medicine.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{medicine.name}</p>
                            <p className="text-sm text-gray-500">{medicine.supplier}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{medicine.category}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              medicine.stock <= medicine.minStock ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {medicine.stock} {medicine.unit}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">(min: {medicine.minStock})</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{medicine.expiryDate}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(medicine.status)}`}>
                            {medicine.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="divide-y divide-gray-100">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <Pill className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{prescription.patientName}</p>
                      <p className="text-sm text-gray-500">{prescription.doctorName} • {prescription.date}</p>
                      <p className="text-xs text-gray-400 mt-1">{prescription.medicines.join(', ')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(prescription.status)}`}>
                      {prescription.status}
                    </span>
                    
                    {prescription.status === 'pending' && (
                      <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                        Dispense
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
