import { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, CheckCircle, Clock, Package, RefreshCw, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { isDark } = useTheme();
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

  const fetchOrdersAndMedicines = async (bustCache = false) => {
    try {
      setLoading(true);
      
      // Add cache-busting timestamp and high limit if needed
      let ordersUrl = '/medicine-orders/orders?limit=100';
      if (bustCache) {
        ordersUrl += `&t=${Date.now()}`;
      }
      const ordersRes = await api.get(ordersUrl);
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
      
      // Small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh orders list with cache busting
      await fetchOrdersAndMedicines(true);
      
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

  const handleDeleteOrder = async (orderId: string, orderName: string) => {
    if (!window.confirm(`Are you sure you want to delete the order for "${orderName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/medicine-orders/orders/${orderId}`);
      
      // Update local state to remove the deleted order
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
      
      toast.success('Order deleted successfully');
      
      // Notify parent to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-800';
      case 'high': return isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-orange-100 text-orange-800';
      case 'normal': return isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-800';
      case 'low': return isDark ? 'bg-gray-700 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-800';
      default: return isDark ? 'bg-gray-700 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-green-100 text-green-800';
      case 'approved': return isDark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-800';
      case 'pending': return isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-yellow-100 text-yellow-800';
      case 'rejected': return isDark ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-800';
      case 'cancelled': return isDark ? 'bg-gray-700 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-800';
      default: return isDark ? 'bg-gray-700 text-gray-400 border border-gray-600' : 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className={`rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-2 rounded-xl mr-3 ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <Package className={`h-6 w-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Medicine Management</h2>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>View low stock medicines and manage orders</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-xl transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('low-stock')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'low-stock' 
                ? (isDark ? 'border-amber-500 text-amber-400' : 'border-primary-500 text-primary-600')
                : (isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700')
            }`}
          >
            <div className="flex items-center justify-center">
              <AlertTriangle className={`h-4 w-4 mr-2 ${activeTab === 'low-stock' && isDark ? 'text-amber-400' : ''}`} />
              Low Stock ({lowStockMedicines.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'orders' 
                ? (isDark ? 'border-blue-500 text-blue-400' : 'border-primary-500 text-primary-600')
                : (isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700')
            }`}
          >
            <div className="flex items-center justify-center">
              <Package className={`h-4 w-4 mr-2 ${activeTab === 'orders' && isDark ? 'text-blue-400' : ''}`} />
              My Orders ({orders.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('new-order')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'new-order' 
                ? (isDark ? 'border-emerald-500 text-emerald-400' : 'border-primary-500 text-primary-600')
                : (isDark ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700')
            }`}
          >
            <div className="flex items-center justify-center">
              <Plus className={`h-4 w-4 mr-2 ${activeTab === 'new-order' && isDark ? 'text-emerald-400' : ''}`} />
              New Order
            </div>
          </button>
        </div>

        {/* Content */}
        <div className={`p-6 overflow-y-auto max-h-[60vh] ${isDark ? 'bg-slate-900/50' : ''}`}>
          {loading && (
            <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              Loading...
            </div>
          )}

          {/* Low Stock Tab */}
          {!loading && activeTab === 'low-stock' && (
            <div className="space-y-4">
              {lowStockMedicines.length === 0 ? (
                <div className="text-center py-8">
                  <div className={`p-4 rounded-full inline-flex mb-4 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <CheckCircle className={`h-12 w-12 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <p className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>All medicines are well stocked!</p>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No orders needed at this time</p>
                </div>
              ) : (
                lowStockMedicines.map((medicine) => (
                  <div 
                    key={medicine.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                      isDark 
                        ? 'bg-gradient-to-r from-red-900/20 to-red-800/10 border-red-500/30 hover:border-red-500/50' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                          <AlertTriangle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{medicine.name}</h3>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{medicine.generic_name}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-4 text-sm ml-12">
                        <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Stock: {medicine.stock_quantity} units</span>
                        <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>Min: {medicine.reorder_level}</span>
                        <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>Shortage: {medicine.shortage}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickOrder(medicine)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        isDark 
                          ? 'bg-red-500/80 text-white hover:bg-red-500 shadow-lg shadow-red-500/20' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
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
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Package className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Your Medicine Orders
                  </h3>
                </div>
                <button
                  onClick={() => fetchOrdersAndMedicines(true)}
                  disabled={loading}
                  className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${
                    isDark 
                      ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10' 
                      : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
              
              {orders.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className={`p-4 rounded-full inline-flex mb-4 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <Package className={`h-8 w-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm mt-1">Create your first order!</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.id} 
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.medicine_name}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Qty: {order.quantity} units</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.medicine_name)}
                            disabled={loading}
                            className={`p-2 rounded-lg transition-colors ${
                              isDark 
                                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                                : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            }`}
                            title="Delete order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <Clock className="h-4 w-4 inline mr-1" />
                      Ordered: {formatDateTime(order.created_at)}
                    </div>
                    {order.notes && (
                      <p className={`mt-3 text-sm p-3 rounded-lg ${
                        isDark 
                          ? 'bg-slate-700/50 text-gray-300 border border-slate-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>{order.notes}</p>
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
                <div className={`rounded-xl border p-4 ${
                  isDark 
                    ? 'bg-gradient-to-r from-red-900/20 to-red-800/10 border-red-500/30' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`text-sm font-bold mb-3 flex items-center ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                    <div className={`p-1.5 rounded-lg mr-2 ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                      <AlertTriangle className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    </div>
                    Quick Order from Low Stock ({lowStockMedicines.length} medicines need attention)
                  </h4>
                  <div className={`space-y-2 max-h-40 overflow-y-auto rounded-lg ${isDark ? 'bg-slate-900/50' : ''}`}>
                    {lowStockMedicines.map((medicine) => (
                      <div 
                        key={medicine.id} 
                        onClick={() => handleQuickOrder(medicine)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                          orderForm.medicine_id === medicine.id 
                            ? (isDark ? 'bg-red-500/20 border-2 border-red-500' : 'bg-red-200 border-2 border-red-500')
                            : (isDark ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-white hover:bg-red-100 border border-red-200')
                        }`}
                      >
                        <div className="flex-1">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{medicine.name}</span>
                          <span className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({medicine.generic_name})</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            Stock: {medicine.stock_quantity}
                          </span>
                          <span className={`text-xs ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Need: {medicine.shortage}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs mt-3 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    Click on any medicine above to quickly select it for ordering
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Select Medicine *
                  {orderForm.medicine_id && (
                    <span className="ml-2 text-xs text-emerald-500 font-normal">
                      ✓ Medicine selected
                    </span>
                  )}
                </label>
                <select
                  value={orderForm.medicine_id}
                  onChange={(e) => setOrderForm({...orderForm, medicine_id: e.target.value})}
                  className={`w-full rounded-lg px-4 py-2.5 transition-colors ${
                    isDark 
                      ? 'bg-slate-800 border border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500' 
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  required
                >
                  <option value="" className={isDark ? 'bg-slate-800 text-gray-400' : ''}>Choose a medicine...</option>
                  
                  {/* Low Stock Group */}
                  {lowStockMedicines.length > 0 && (
                    <optgroup label="⚠️ LOW STOCK - Order Immediately" className={isDark ? 'bg-slate-800' : ''}>
                      {lowStockMedicines.map((medicine) => (
                        <option key={medicine.id} value={medicine.id} className={isDark ? 'bg-slate-800 text-red-400' : ''}>
                          {medicine.name} ({medicine.generic_name}) - Only {medicine.stock_quantity} left (Need {medicine.shortage})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Normal Stock Group */}
                  <optgroup label="All Medicines" className={isDark ? 'bg-slate-800' : ''}>
                    {allMedicines
                      .filter(m => !lowStockMedicines.find(lm => lm.id === m.id))
                      .map((medicine) => (
                        <option key={medicine.id} value={medicine.id} className={isDark ? 'bg-slate-800 text-gray-300' : ''}>
                          {medicine.name} ({medicine.generic_name}) - Stock: {medicine.stock_quantity}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({...orderForm, quantity: parseInt(e.target.value)})}
                    className={`w-full rounded-lg px-4 py-2.5 transition-colors ${
                      isDark 
                        ? 'bg-slate-800 border border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500' 
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Priority</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({...orderForm, priority: e.target.value})}
                    className={`w-full rounded-lg px-4 py-2.5 transition-colors ${
                      isDark 
                        ? 'bg-slate-800 border border-slate-600 text-white focus:border-emerald-500 focus:ring-emerald-500' 
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  >
                    <option value="low" className={isDark ? 'bg-slate-800' : ''}>Low</option>
                    <option value="normal" className={isDark ? 'bg-slate-800' : ''}>Normal</option>
                    <option value="high" className={isDark ? 'bg-slate-800' : ''}>High</option>
                    <option value="urgent" className={isDark ? 'bg-slate-800' : ''}>Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Notes</label>
                <textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                  rows={3}
                  className={`w-full rounded-lg px-4 py-2.5 transition-colors ${
                    isDark 
                      ? 'bg-slate-800 border border-slate-600 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500' 
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  placeholder="Reason for order, urgency, etc."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('low-stock')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    isDark 
                      ? 'border border-slate-600 text-gray-300 hover:bg-slate-700' 
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isDark 
                      ? 'bg-emerald-500/80 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 disabled:opacity-50' 
                      : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                  }`}
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
