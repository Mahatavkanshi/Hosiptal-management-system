import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Minus,
  History,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Download,
  Truck,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Building2,
  BarChart3
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface StockMovement {
  id: string;
  medicineId: string;
  medicineName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string;
  performedBy: string;
  date: string;
  notes?: string;
}

interface LowStockItem {
  id: string;
  name: string;
  genericName: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  supplier: string;
  lastOrderDate?: string;
}

interface ExpiryAlert {
  id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  daysUntilExpiry: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  items: number;
  totalAmount: number;
  orderDate: string;
  expectedDate: string;
}

const demoStockMovements: StockMovement[] = [
  {
    id: '1',
    medicineId: 'm1',
    medicineName: 'Paracetamol 500mg',
    type: 'in',
    quantity: 500,
    previousStock: 350,
    currentStock: 850,
    reason: 'Purchase Order #PO-2024-001',
    performedBy: 'Admin',
    date: '2024-01-15'
  },
  {
    id: '2',
    medicineId: 'm2',
    medicineName: 'Amoxicillin 250mg',
    type: 'out',
    quantity: 25,
    previousStock: 70,
    currentStock: 45,
    reason: 'Patient Sale - Bill #BILL-2024-0002',
    performedBy: 'Pharmacist',
    date: '2024-01-15'
  },
  {
    id: '3',
    medicineId: 'm3',
    medicineName: 'Insulin Glargine',
    type: 'adjustment',
    quantity: -5,
    previousStock: 5,
    currentStock: 0,
    reason: 'Damaged/Expired Stock',
    performedBy: 'Admin',
    date: '2024-01-14'
  }
];

const demoLowStockItems: LowStockItem[] = [
  {
    id: '1',
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin Trihydrate',
    currentStock: 45,
    reorderLevel: 50,
    unit: 'capsules',
    supplier: 'Sun Pharma',
    lastOrderDate: '2024-01-01'
  },
  {
    id: '2',
    name: 'Omeprazole 20mg',
    genericName: 'Omeprazole',
    currentStock: 38,
    reorderLevel: 50,
    unit: 'capsules',
    supplier: 'Dr. Reddy\'s',
    lastOrderDate: '2023-12-20'
  },
  {
    id: '3',
    name: 'Azithromycin 500mg',
    genericName: 'Azithromycin',
    currentStock: 15,
    reorderLevel: 25,
    unit: 'tablets',
    supplier: 'Alembic Pharma',
    lastOrderDate: '2023-12-15'
  }
];

const demoExpiryAlerts: ExpiryAlert[] = [
  {
    id: '1',
    name: 'Aspirin 325mg',
    batchNumber: 'ASP-2023-112',
    expiryDate: '2024-05-15',
    quantity: 120,
    daysUntilExpiry: 15
  },
  {
    id: '2',
    name: 'Insulin Glargine',
    batchNumber: 'INS-2024-012',
    expiryDate: '2025-06-30',
    quantity: 8,
    daysUntilExpiry: 125
  },
  {
    id: '3',
    name: 'Amoxicillin 250mg',
    batchNumber: 'AMX-2024-045',
    expiryDate: '2025-08-15',
    quantity: 45,
    daysUntilExpiry: 182
  }
];

const demoPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2024-001',
    supplier: 'Sun Pharma',
    status: 'received',
    items: 5,
    totalAmount: 12500,
    orderDate: '2024-01-10',
    expectedDate: '2024-01-15'
  },
  {
    id: '2',
    orderNumber: 'PO-2024-002',
    supplier: 'Cipla Ltd',
    status: 'ordered',
    items: 8,
    totalAmount: 18500,
    orderDate: '2024-01-14',
    expectedDate: '2024-01-20'
  },
  {
    id: '3',
    orderNumber: 'PO-2024-003',
    supplier: 'Dr. Reddy\'s',
    status: 'pending',
    items: 3,
    totalAmount: 8200,
    orderDate: '2024-01-15',
    expectedDate: '2024-01-22'
  }
];

const MedicineInventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(demoStockMovements);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>(demoLowStockItems);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>(demoExpiryAlerts);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(demoPurchaseOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustStockModal, setShowAdjustStockModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in': return 'bg-green-100 text-green-700';
      case 'out': return 'bg-blue-100 text-blue-700';
      case 'adjustment': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'ordered': return 'bg-blue-100 text-blue-700';
      case 'received': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const stats = {
    totalStockIn: stockMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0),
    totalStockOut: stockMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0),
    lowStockCount: lowStockItems.length,
    expiryAlertsCount: expiryAlerts.filter(e => e.daysUntilExpiry <= 30).length,
    pendingOrders: purchaseOrders.filter(o => o.status === 'pending' || o.status === 'ordered').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/medicines"
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Medicines
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Track stock movements, manage orders, and monitor alerts</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAdjustStockModal(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Adjust Stock
          </button>
          <button
            onClick={() => setShowCreateOrderModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Truck className="h-4 w-4 mr-2" />
            Create Order
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Stock In (Today)</p>
              <p className="text-xl font-bold text-gray-900">+{stats.totalStockIn}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Stock Out (Today)</p>
              <p className="text-xl font-bold text-gray-900">-{stats.totalStockOut}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Low Stock Alert</p>
              <p className="text-xl font-bold text-gray-900">{stats.lowStockCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-xl font-bold text-gray-900">{stats.expiryAlertsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Truck className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-100">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'movements', label: 'Stock Movements', icon: History },
              { id: 'lowstock', label: 'Low Stock Alerts', icon: AlertTriangle },
              { id: 'expiry', label: 'Expiry Alerts', icon: Calendar },
              { id: 'orders', label: 'Purchase Orders', icon: Package }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Movements */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Recent Stock Movements
                  </h3>
                  <div className="space-y-3">
                    {stockMovements.slice(0, 5).map((movement) => (
                      <div key={movement.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{movement.medicineName}</p>
                          <p className="text-sm text-gray-500">{movement.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(movement.type)}`}>
                            {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}
                            {movement.quantity}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{movement.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Alerts */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Critical Alerts
                  </h3>
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Low Stock
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Current: {item.currentStock} {item.unit} (Reorder: {item.reorderLevel})
                        </p>
                        <p className="text-sm text-gray-500">Supplier: {item.supplier}</p>
                      </div>
                    ))}
                    {expiryAlerts.filter(e => e.daysUntilExpiry <= 30).slice(0, 2).map((alert) => (
                      <div key={alert.id} className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">{alert.name}</p>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            Expires in {alert.daysUntilExpiry} days
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Batch: {alert.batchNumber} • Qty: {alert.quantity}
                        </p>
                        <p className="text-sm text-gray-500">Expiry: {alert.expiryDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stock Movements Tab */}
          {activeTab === 'movements' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">All Stock Movements</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search movements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Medicine</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Type</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantity</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Stock</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Reason</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockMovements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-600">{movement.date}</td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{movement.medicineName}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(movement.type)}`}>
                            {getStatusLabel(movement.type)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}
                          {movement.quantity}
                        </td>
                        <td className="py-4 px-4 text-center text-sm text-gray-600">
                          {movement.previousStock} → {movement.currentStock}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{movement.reason}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{movement.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Low Stock Tab */}
          {activeTab === 'lowstock' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Low Stock Items</h3>
                <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  <Truck className="h-4 w-4 mr-2" />
                  Reorder All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">{item.genericName}</p>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Low Stock
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="font-medium text-red-600">{item.currentStock} {item.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reorder Level:</span>
                        <span className="font-medium">{item.reorderLevel} {item.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium">{item.supplier}</span>
                      </div>
                      {item.lastOrderDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Order:</span>
                          <span className="font-medium">{item.lastOrderDate}</span>
                        </div>
                      )}
                    </div>
                    <button className="w-full mt-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium">
                      Reorder Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiry Alerts Tab */}
          {activeTab === 'expiry' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Expiry Alerts</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Medicine</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Batch #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Expiry Date</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Days Left</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantity</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiryAlerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{alert.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{alert.batchNumber}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{alert.expiryDate}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alert.daysUntilExpiry <= 30 ? 'bg-red-100 text-red-700' :
                            alert.daysUntilExpiry <= 90 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {alert.daysUntilExpiry} days
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">{alert.quantity}</td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                            Mark Expired
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchase Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Purchase Orders</h3>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Supplier</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Items</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Expected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchaseOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900">{order.orderNumber}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{order.supplier}</td>
                        <td className="py-4 px-4 text-center text-sm text-gray-600">{order.items}</td>
                        <td className="py-4 px-4 text-right font-medium">₹{order.totalAmount.toLocaleString()}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{order.orderDate}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{order.expectedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Placeholder Modals */}
      {showAdjustStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Adjust Stock</h2>
            <p className="text-gray-600 mb-4">
              This feature allows you to manually adjust stock levels for medicines.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Add incoming stock from suppliers</li>
              <li>Remove damaged or expired items</li>
              <li>Correct inventory discrepancies</li>
              <li>Track all adjustments with reasons</li>
            </ul>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAdjustStockModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAdjustStockModal(false);
                  toast.success('Stock adjustment feature coming soon!');
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Purchase Order</h2>
            <p className="text-gray-600 mb-4">
              This feature allows you to create new purchase orders from suppliers.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Select supplier from list</li>
              <li>Add multiple medicines to order</li>
              <li>Set quantities and expected prices</li>
              <li>Track order status until received</li>
            </ul>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateOrderModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowCreateOrderModal(false);
                  toast.success('Purchase order feature coming soon!');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineInventory;
