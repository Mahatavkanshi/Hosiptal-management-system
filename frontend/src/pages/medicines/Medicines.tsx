import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Filter, 
  Pill,
  Package,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Warehouse,
  ArrowLeft,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  category: string;
  description: string;
  dosage_form: string;
  strength: string;
  stock_quantity: number;
  unit_price: number;
  cost_price: number;
  expiry_date: string;
  batch_number: string;
  reorder_level: number;
  storage_conditions: string;
  prescription_required: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

const demoMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol',
    generic_name: 'Acetaminophen',
    manufacturer: 'Cipla Ltd',
    category: 'Pain Relief',
    description: 'Used to treat mild to moderate pain and fever',
    dosage_form: 'Tablet',
    strength: '500mg',
    stock_quantity: 850,
    unit_price: 25,
    cost_price: 18,
    expiry_date: '2025-12-31',
    batch_number: 'PCM-2024-001',
    reorder_level: 100,
    storage_conditions: 'Room temperature, dry place',
    prescription_required: false,
    status: 'in_stock'
  },
  {
    id: '2',
    name: 'Amoxicillin',
    generic_name: 'Amoxicillin Trihydrate',
    manufacturer: 'Sun Pharma',
    category: 'Antibiotics',
    description: 'Broad-spectrum antibiotic used to treat bacterial infections',
    dosage_form: 'Capsule',
    strength: '500mg',
    stock_quantity: 45,
    unit_price: 120,
    cost_price: 85,
    expiry_date: '2025-08-15',
    batch_number: 'AMX-2024-045',
    reorder_level: 50,
    storage_conditions: 'Room temperature',
    prescription_required: true,
    status: 'low_stock'
  },
  {
    id: '3',
    name: 'Insulin Glargine',
    generic_name: 'Insulin Glargine',
    manufacturer: 'Sanofi',
    category: 'Diabetes',
    description: 'Long-acting insulin for diabetes management',
    dosage_form: 'Injection',
    strength: '100 units/ml',
    stock_quantity: 0,
    unit_price: 850,
    cost_price: 650,
    expiry_date: '2025-06-30',
    batch_number: 'INS-2024-012',
    reorder_level: 20,
    storage_conditions: 'Refrigerator (2-8°C)',
    prescription_required: true,
    status: 'out_of_stock'
  },
  {
    id: '4',
    name: 'Vitamin D3',
    generic_name: 'Cholecalciferol',
    manufacturer: 'HealthFirst',
    category: 'Supplements',
    description: 'Vitamin D supplement for bone health',
    dosage_form: 'Tablet',
    strength: '60,000 IU',
    stock_quantity: 320,
    unit_price: 180,
    cost_price: 120,
    expiry_date: '2026-03-31',
    batch_number: 'VTD-2024-078',
    reorder_level: 50,
    storage_conditions: 'Room temperature',
    prescription_required: false,
    status: 'in_stock'
  },
  {
    id: '5',
    name: 'Omeprazole',
    generic_name: 'Omeprazole',
    manufacturer: 'Dr. Reddy\'s',
    category: 'Gastrointestinal',
    description: 'Proton pump inhibitor for acid reflux and ulcers',
    dosage_form: 'Capsule',
    strength: '20mg',
    stock_quantity: 38,
    unit_price: 95,
    cost_price: 65,
    expiry_date: '2025-10-31',
    batch_number: 'OMP-2024-033',
    reorder_level: 50,
    storage_conditions: 'Room temperature',
    prescription_required: true,
    status: 'low_stock'
  },
  {
    id: '6',
    name: 'Metformin',
    generic_name: 'Metformin Hydrochloride',
    manufacturer: 'Lupin Ltd',
    category: 'Diabetes',
    description: 'First-line medication for type 2 diabetes',
    dosage_form: 'Tablet',
    strength: '500mg',
    stock_quantity: 560,
    unit_price: 45,
    cost_price: 32,
    expiry_date: '2026-01-15',
    batch_number: 'MET-2024-089',
    reorder_level: 75,
    storage_conditions: 'Room temperature',
    prescription_required: true,
    status: 'in_stock'
  },
  {
    id: '7',
    name: 'Cetirizine',
    generic_name: 'Cetirizine Hydrochloride',
    manufacturer: 'Zydus Cadila',
    category: 'Antihistamine',
    description: 'Antihistamine for allergy relief',
    dosage_form: 'Tablet',
    strength: '10mg',
    stock_quantity: 420,
    unit_price: 35,
    cost_price: 22,
    expiry_date: '2025-11-20',
    batch_number: 'CTZ-2024-056',
    reorder_level: 60,
    storage_conditions: 'Room temperature',
    prescription_required: false,
    status: 'in_stock'
  },
  {
    id: '8',
    name: 'Aspirin',
    generic_name: 'Acetylsalicylic Acid',
    manufacturer: 'Bayer',
    category: 'Pain Relief',
    description: 'Pain reliever and blood thinner',
    dosage_form: 'Tablet',
    strength: '325mg',
    stock_quantity: 0,
    unit_price: 28,
    cost_price: 18,
    expiry_date: '2024-05-15',
    batch_number: 'ASP-2023-112',
    reorder_level: 80,
    storage_conditions: 'Room temperature',
    prescription_required: false,
    status: 'expired'
  },
  {
    id: '9',
    name: 'Salbutamol',
    generic_name: 'Albuterol',
    manufacturer: 'Cipla Ltd',
    category: 'Respiratory',
    description: 'Bronchodilator for asthma and COPD',
    dosage_form: 'Inhaler',
    strength: '100mcg',
    stock_quantity: 125,
    unit_price: 220,
    cost_price: 165,
    expiry_date: '2025-09-30',
    batch_number: 'SLB-2024-067',
    reorder_level: 30,
    storage_conditions: 'Room temperature',
    prescription_required: true,
    status: 'in_stock'
  },
  {
    id: '10',
    name: 'Atorvastatin',
    generic_name: 'Atorvastatin Calcium',
    manufacturer: 'Pfizer',
    category: 'Cardiology',
    description: 'Statin for cholesterol management',
    dosage_form: 'Tablet',
    strength: '20mg',
    stock_quantity: 280,
    unit_price: 150,
    cost_price: 105,
    expiry_date: '2026-02-28',
    batch_number: 'ATV-2024-091',
    reorder_level: 40,
    storage_conditions: 'Room temperature',
    prescription_required: true,
    status: 'in_stock'
  },
  {
    id: '11',
    name: 'Azithromycin',
    generic_name: 'Azithromycin',
    manufacturer: 'Alembic Pharma',
    category: 'Antibiotics',
    description: 'Antibiotic for bacterial infections',
    dosage_form: 'Tablet',
    strength: '500mg',
    stock_quantity: 15,
    unit_price: 180,
    cost_price: 125,
    expiry_date: '2025-07-20',
    batch_number: 'AZM-2024-028',
    reorder_level: 25,
    storage_conditions: 'Room temperature',
    prescription_required: true,
    status: 'low_stock'
  },
  {
    id: '12',
    name: 'Ibuprofen',
    generic_name: 'Ibuprofen',
    manufacturer: 'Abbott',
    category: 'Pain Relief',
    description: 'NSAID for pain and inflammation',
    dosage_form: 'Tablet',
    strength: '400mg',
    stock_quantity: 680,
    unit_price: 32,
    cost_price: 22,
    expiry_date: '2025-12-15',
    batch_number: 'IBU-2024-102',
    reorder_level: 100,
    storage_conditions: 'Room temperature',
    prescription_required: false,
    status: 'in_stock'
  }
];

const categories = [
  'All',
  'Pain Relief',
  'Antibiotics',
  'Diabetes',
  'Supplements',
  'Gastrointestinal',
  'Antihistamine',
  'Cardiology',
  'Respiratory'
];

const Medicines: React.FC = () => {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>(demoMedicines);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>(demoMedicines);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showPrescriptionOnly, setShowPrescriptionOnly] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchTerm, selectedCategory, selectedStatus, showPrescriptionOnly]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      let realMedicines: Medicine[] = [];
      
      try {
        const response = await api.get('/medicines?limit=100');
        realMedicines = response.data?.data?.medicines || [];
        
        if (realMedicines.length > 0) {
          const realIds = new Set(realMedicines.map(m => m.id));
          const uniqueDemoMedicines = demoMedicines.filter(m => !realIds.has(m.id));
          setMedicines([...realMedicines, ...uniqueDemoMedicines]);
          toast(`Loaded ${realMedicines.length} real medicines + ${uniqueDemoMedicines.length} demo medicines`);
        } else {
          setMedicines(demoMedicines);
        }
      } catch (apiError) {
        console.log('API not available, using demo data only');
        setMedicines(demoMedicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setMedicines(demoMedicines);
    } finally {
      setLoading(false);
    }
  };

  const filterMedicines = () => {
    let filtered = [...medicines];

    // Search by name or generic name
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(search) ||
        medicine.generic_name.toLowerCase().includes(search) ||
        medicine.manufacturer.toLowerCase().includes(search)
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(medicine => medicine.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(medicine => medicine.status === selectedStatus);
    }

    // Filter by prescription requirement
    if (showPrescriptionOnly) {
      filtered = filtered.filter(medicine => medicine.prescription_required);
    }

    setFilteredMedicines(filtered);
  };

  // Statistics
  const stats = {
    total: medicines.length,
    inStock: medicines.filter(m => m.status === 'in_stock').length,
    lowStock: medicines.filter(m => m.status === 'low_stock').length,
    outOfStock: medicines.filter(m => m.status === 'out_of_stock').length,
    expired: medicines.filter(m => m.status === 'expired').length,
    prescriptionRequired: medicines.filter(m => m.prescription_required).length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading medicines...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicine Inventory</h1>
          <p className="text-gray-600 mt-1">
            {filteredMedicines.length} medicines showing
            {medicines.length > demoMedicines.length && (
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

          {user?.role === 'admin' || user?.role === 'pharmacist' ? (
            <button
              onClick={() => toast('Add medicine functionality coming soon!')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </button>
          ) : null}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pill className="h-5 w-5 text-blue-600" />
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
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.inStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Expired</p>
              <p className="text-xl font-bold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Warehouse className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Rx Required</p>
              <p className="text-xl font-bold text-gray-900">{stats.prescriptionRequired}</p>
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
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="expired">Expired</option>
          </select>

          {/* Prescription Filter */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPrescriptionOnly}
              onChange={(e) => setShowPrescriptionOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Prescription only</span>
          </label>

          {/* Refresh Button */}
          <button
            onClick={fetchMedicines}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMedicines.map((medicine) => (
          <div 
            key={medicine.id} 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{medicine.name}</h3>
                  <p className="text-sm text-gray-500">{medicine.generic_name}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(medicine.status)}`}>
                  {getStatusLabel(medicine.status)}
                </span>
              </div>

              {/* Category & Manufacturer */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {medicine.category}
                </span>
                {medicine.prescription_required && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                    Rx Required
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Pill className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{medicine.dosage_form} • {medicine.strength}</span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-400" />
                  <span className={medicine.stock_quantity <= medicine.reorder_level ? 'text-red-600 font-medium' : ''}>
                    Stock: {medicine.stock_quantity} units
                  </span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                  <span>₹{medicine.unit_price} (Cost: ₹{medicine.cost_price})</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span className={isExpiringSoon(medicine.expiry_date) ? 'text-orange-600 font-medium' : ''}>
                    Exp: {medicine.expiry_date}
                  </span>
                </div>
              </div>

              {/* Batch & Storage */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Batch:</span> {medicine.batch_number}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">Storage:</span> {medicine.storage_conditions}
                </p>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs text-gray-600 line-clamp-2">
                {medicine.description}
              </p>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => toast(`Edit medicine: ${medicine.name}`)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toast(`View details: ${medicine.name}`)}
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
      {filteredMedicines.length === 0 && (
        <div className="text-center py-12">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No medicines found</h3>
          <p className="text-gray-600 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Demo Data Notice */}
      {medicines.length === demoMedicines.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Demo Mode</h4>
            <p className="text-sm text-blue-700 mt-1">
              Currently showing demo data (12 medicines). Connect to the backend API to see real medicine data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
