import { useState, useEffect } from 'react';
import { X, CreditCard, IndianRupee, CheckCircle, Loader2, Building2, Stethoscope, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { initiateRazorpayPayment } from '../../utils/razorpay';

interface ProcessPaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FeeItem {
  id: string;
  description: string;
  amount: number;
  type: 'subscription' | 'equipment' | 'other';
}

const ProcessPaymentModal = ({ onClose, onSuccess }: ProcessPaymentModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  
  // Doctor fee items
  const [feeItems, setFeeItems] = useState<FeeItem[]>([
    { id: '1', description: 'Monthly Platform Subscription', amount: 999, type: 'subscription' },
  ]);

  // Available equipment options
  const equipmentOptions: FeeItem[] = [
    { id: 'eq-1', description: 'Basic Equipment Set', amount: 500, type: 'equipment' },
    { id: 'eq-2', description: 'Advanced Equipment Set', amount: 1500, type: 'equipment' },
    { id: 'eq-3', description: 'ICU Equipment Rental', amount: 3000, type: 'equipment' },
    { id: 'eq-4', description: 'Training & Certification', amount: 2000, type: 'other' },
  ];

  useEffect(() => {
    generateReceiptNumber();
  }, []);

  const generateReceiptNumber = () => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setReceiptNumber(`DOC-${date}-${random}`);
  };

  const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);

  const addEquipmentFee = (equipment: FeeItem) => {
    // Check if already added
    const exists = feeItems.find(item => item.id === equipment.id);
    if (exists) {
      toast('This item is already added');
      return;
    }
    
    setFeeItems([...feeItems, equipment]);
    toast.success(`${equipment.description} added`);
  };

  const removeFeeItem = (id: string) => {
    // Don't allow removing subscription (mandatory)
    if (id === '1') {
      toast.error('Monthly subscription is mandatory');
      return;
    }
    setFeeItems(feeItems.filter(item => item.id !== id));
  };

  const handlePayment = async () => {
    if (feeItems.length === 0) {
      toast.error('Please add at least one fee item');
      return;
    }

    setLoading(true);

    try {
      await initiateRazorpayPayment({
        amount: totalAmount,
        currency: 'INR',
        description: `Hospital Fees - ${receiptNumber}`,
        receipt: receiptNumber,
        patientName: `Dr. ${user?.first_name} ${user?.last_name}`,
        patientEmail: user?.email || '',
        patientPhone: user?.phone || '',
        onSuccess: (response: any) => {
          console.log('Payment successful:', response);
          
          // Save to payments for Payment History section
          const paymentRecord = {
            receipt_number: receiptNumber,
            patient_name: `Dr. ${user?.first_name} ${user?.last_name}`,
            amount: totalAmount,
            payment_method: 'online',
            date: new Date().toISOString(),
            status: 'completed',
            type: 'doctor_hospital_payment',
            description: 'Hospital fees payment'
          };
          
          const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
          localStorage.setItem('payments', JSON.stringify([paymentRecord, ...existingPayments]));
          
          // Also save to payment_activities for Recent Activity section
          const paymentActivity = {
            id: 'payment-' + Date.now(),
            type: 'payment',
            patient_name: `Dr. ${user?.first_name} ${user?.last_name}`,
            description: `Hospital fees payment - ${receiptNumber}`,
            amount: totalAmount,
            created_at: new Date().toISOString(),
          };
          
          const existingActivities = JSON.parse(localStorage.getItem('payment_activities') || '[]');
          localStorage.setItem('payment_activities', JSON.stringify([paymentActivity, ...existingActivities]));
          
          setPaymentComplete(true);
          setLoading(false);
          toast.success('Payment successful!');
          
          setTimeout(() => {
            onSuccess();
          }, 2000);
        },
        onFailure: (error: any) => {
          console.error('Payment failed:', error);
          setLoading(false);
          toast.error('Payment failed. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      setLoading(false);
      toast.error('Failed to initiate payment');
    }
  };

  if (paymentComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">Receipt #{receiptNumber}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm"><strong>Doctor:</strong> Dr. {user?.first_name} {user?.last_name}</p>
              <p className="text-sm"><strong>Amount Paid:</strong> <span className="text-green-600 font-bold">₹{totalAmount}</span></p>
              <p className="text-sm"><strong>Items:</strong> {feeItems.length} fees</p>
              <p className="text-sm"><strong>Date:</strong> {new Date().toLocaleString()}</p>
            </div>
            
            <button
              onClick={onSuccess}
              className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-primary-600" />
            Pay Hospital Fees
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Dr. {user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-gray-500">Monthly fees payment</p>
              </div>
            </div>
          </div>

          {/* Fee Items */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Fee Breakdown
            </h3>
            
            <div className="space-y-2 mb-4">
              {feeItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.type === 'subscription' ? 'bg-blue-100 text-blue-800' :
                      item.type === 'equipment' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-sm text-gray-700">{item.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₹{item.amount}</span>
                    {item.id !== '1' && (
                      <button
                        onClick={() => removeFeeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-primary-600 flex items-center">
                <IndianRupee className="h-6 w-6 mr-1" />
                {totalAmount}
              </span>
            </div>
          </div>

          {/* Add Equipment/Other Fees */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Add Additional Fees</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {equipmentOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => addEquipmentFee(option)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{option.description}</p>
                  <p className="text-sm text-primary-600 font-medium">+ ₹{option.amount}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Secure Payment via Razorpay</span>
            </div>
            <p className="text-sm text-blue-700">
              You will be redirected to Razorpay checkout to complete payment.
            </p>
          </div>

          {/* Receipt Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Receipt No: <span className="font-mono font-medium">{receiptNumber}</span></p>
            <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={loading || feeItems.length === 0}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IndianRupee className="h-5 w-5 mr-2" />
                Pay ₹{totalAmount} to Hospital
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessPaymentModal;
