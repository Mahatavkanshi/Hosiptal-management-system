import { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, CheckCircle, Clock, Package, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface MedicineOrderModalProps {
  onClose: () => void;
  lowStockMedicines: Medicine[];
  onSuccess?: () => void;
}

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  stock_quantity: number;
  reorder_level: number;
  shortage: number;
  unit_price: number;
}

interface MedicineOrder {
  id: string;
  medicine_name: string;
  quantity: number;
  priority: string;
  status: string;
  notes: string;
  created_at: string;
  doctor_first_name: string;
  doctor_last_name: string;
}

const MedicineOrderModal = ({ onClose, lowStockMedicines, onSuccess }: MedicineOrderModalProps) => {
  const [activeTab, setActiveTab] = useState<'low-stock' | 'orders' | 'new-order'>('low-stock');
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderForm, setOrderForm] = useState({
    medicine_id: '',
    quantity: 1,
    priority: 'normal',
    notes: ''
  });

  // Initial load
  useEffect(() => {
    fetchOrdersAndMedicines();
  }, []);

  // Refresh when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrdersAndMedicines();
    }
  }, [activeTab]);

  const fetchOrdersAndMedicines = async () => {
    try {
      setLoading(true);
      
      const ordersRes = await api.get('/medicine-orders/orders');
      const allMedicinesRes = await api.get('/medicines?limit=100');
      
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
      
      if (allMedicinesRes.data.success) {
        setAllMedicines(allMedicinesRes.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to load medicine data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderForm.medicine_id || orderForm.quantity < 1) {
      toast.error('Please select a medicine and enter quantity');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/medicine-orders/orders', orderForm);
      console.log('Order created:', response.data);
      toast.success('Order created successfully!');
      setOrderForm({ medicine_id: '', quantity: 1, priority: 'normal', notes: '' });
      
      // Refresh orders list
      await fetchOrdersAndMedicines();
      
      // Switch to orders tab to show the new order
      setActiveTab('orders');
      
      // Notify parent to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickOrder = (medicine: Medicine) => {
    setOrderForm({
      medicine_id: medicine.id,
      quantity: medicine.shortage > 0 ? medicine.shortage : 10,
      priority: medicine.shortage > 5 ? 'high' : 'normal',
      notes: `Low stock alert - Current: ${medicine.stock_quantity}, Required: ${medicine.reorder_level}`
    });
    // Switch to new-order tab if not already there
    if (activeTab !== 'new-order') {
      setActiveTab('new-order');
    }
    // Show toast notification
    toast.success(`${medicine.name} selected for ordering!`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Medicine Management</h2>
            <p className="text-sm text-gray-500">View low stock medicines and manage orders</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('low-stock')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'low-stock' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Low Stock ({lowStockMedicines.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'orders' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center">
              <Package className="h-4 w-4 mr-2" />
              My Orders ({orders.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('new-order')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'new-order' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && <div className="text-center py-8">Loading...</div>}

          {/* Low Stock Tab */}
          {!loading && activeTab === 'low-stock' && (
            <div className="space-y-4">
              {lowStockMedicines.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">All medicines are well stocked! ✓</p>
                </div>
              ) : (
                lowStockMedicines.map((medicine) => (
                  <div key={medicine.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                        <span className="ml-2 text-sm text-gray-500">({medicine.generic_name})</span>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="text-red-600 font-medium">Stock: {medicine.stock_quantity} units</span>
                        <span className="text-gray-500">Min: {medicine.reorder_level}</span>
                        <span className="text-red-600 font-bold">Shortage: {medicine.shortage}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickOrder(medicine)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Order Now
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Orders Tab */}
          {!loading && activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Orders Header with Refresh Button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Medicine Orders
                </h3>
                <button
                  onClick={fetchOrdersAndMedicines}
                  disabled={loading}
                  className="flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No orders yet. Create your first order!
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{order.medicine_name}</h3>
                        <p className="text-sm text-gray-500">Qty: {order.quantity} units</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Ordered: {`${order.created_at}`}
                    </div>
                    {order.notes && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">{order.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* New Order Tab */}
          {!loading && activeTab === 'new-order' && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Quick Order from Low Stock Section */}
              {lowStockMedicines.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Quick Order from Low Stock ({lowStockMedicines.length} medicines need attention)
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {lowStockMedicines.map((medicine) => (
                      <div 
                        key={medicine.id} 
                        onClick={() => handleQuickOrder(medicine)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          orderForm.medicine_id === medicine.id 
                            ? 'bg-red-200 border-2 border-red-500' 
                            : 'bg-white hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{medicine.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({medicine.generic_name})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-red-600">
                            Stock: {medicine.stock_quantity}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            Need: {medicine.shortage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    Click on any medicine above to quickly select it for ordering
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Medicine *
                  {orderForm.medicine_id && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      ✓ Medicine selected
                    </span>
                  )}
                </label>
                <select
                  value={orderForm.medicine_id}
                  onChange={(e) => setOrderForm({...orderForm, medicine_id: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                >
                  <option value="">Choose a medicine...</option>
                  
                  {/* Low Stock Group */}
                  {lowStockMedicines.length > 0 && (
                    <optgroup label="⚠️ LOW STOCK - Order Immediately">
                      {lowStockMedicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          🔴 {medicine.name} ({medicine.generic_name}) - Only {medicine.stock_quantity} left (Need {medicine.shortage})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Normal Stock Group */}
                  <optgroup label="All Medicines">
                    {allMedicines
                      .filter(m => !lowStockMedicines.find(lm => lm.id === m.id))
                      .map((medicine) => (
                        <option key={medicine.id} value={medicine.id}>
                          {medicine.name} ({medicine.generic_name}) - Stock: {medicine.stock_quantity}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({...orderForm, quantity: parseInt(e.target.value)})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({...orderForm, priority: e.target.value})}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Reason for order, urgency, etc."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('low-stock')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Order...' : 'Create Order'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineOrderModal;
