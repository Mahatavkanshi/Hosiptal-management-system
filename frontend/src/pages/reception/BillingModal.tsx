import React, { useState } from 'react';
import { X, Search, CreditCard, DollarSign, Printer, CheckCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: any;
  onSuccess: (billData: any) => void;
}

const serviceOptions = [
  { id: 'consultation', name: 'Doctor Consultation', price: 500 },
  { id: 'lab_test', name: 'Laboratory Tests', price: 1200 },
  { id: 'xray', name: 'X-Ray', price: 800 },
  { id: 'ultrasound', name: 'Ultrasound', price: 1500 },
  { id: 'ecg', name: 'ECG', price: 400 },
  { id: 'room_charge', name: 'Room Charges (per day)', price: 2000 },
  { id: 'medication', name: 'Medication', price: 0 },
  { id: 'surgery', name: 'Surgical Procedure', price: 15000 },
  { id: 'nursing', name: 'Nursing Care', price: 800 },
  { id: 'ambulance', name: 'Ambulance Service', price: 1500 },
];

const BillingModal: React.FC<BillingModalProps> = ({ 
  isOpen, 
  onClose, 
  patient,
  onSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const addService = (service: any) => {
    setServices(prev => [...prev, {
      ...service,
      quantity: 1,
      total: service.price,
      id: Date.now().toString()
    }]);
    setSearchQuery('');
  };

  const removeService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, quantity, total: s.price * quantity } : s
    ));
  };

  const calculateSubtotal = () => {
    return services.reduce((sum, s) => sum + s.total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (services.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const billData = {
        id: `BILL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        patient_id: patient?.id,
        patient_name: patient?.patientName || patient?.name,
        services,
        subtotal: calculateSubtotal(),
        discount,
        total: calculateTotal(),
        payment_method: paymentMethod,
        notes,
        created_at: new Date().toISOString(),
        status: 'paid'
      };
      
      toast.success('Bill generated and payment processed successfully!');
      onSuccess(billData);
      onClose();
    } catch (error) {
      toast.error('Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    toast.success('Printing bill...');
  };

  const filteredServices = serviceOptions.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !services.find(added => added.name === s.name)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Billing & Payment</h2>
              <p className="text-sm text-gray-600">Generate bill and process payment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient Info */}
          {patient && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{patient.patientName || patient.name}</p>
                  <p className="text-sm text-gray-600">Patient ID: {patient.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Bill #: {`BILL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Add Services</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {searchQuery && filteredServices.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => addService(service)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left"
                    >
                      <span className="font-medium text-gray-900">{service.name}</span>
                      <span className="text-gray-600">₹{service.price}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Services */}
              <div className="space-y-2">
                {services.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No services added yet</p>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">₹{service.price} x {service.quantity}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(service.id, service.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{service.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(service.id, service.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => removeService(service.id)}
                          className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Bill Summary</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{calculateSubtotal().toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-right"
                      min="0"
                      max="100"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount Amount</span>
                    <span>-₹{((calculateSubtotal() * discount) / 100).toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-purple-600">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'card', 'upi', 'insurance'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 border rounded-lg text-sm font-medium capitalize transition-colors ${
                        paymentMethod === method
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {method === 'upi' ? 'UPI' : method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handlePrint}
              disabled={services.length === 0}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print Bill
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isLoading || services.length === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Process Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingModal;
