import { useState, useEffect } from 'react';
import { IndianRupee, Search, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Payment {
  receipt_number: string;
  patient_name: string;
  amount: number;
  payment_method: string;
  date: string;
  status: string;
}

const OutstandingPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load from localStorage
    const savedPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    
    // Add some demo unpaid bills if empty
    if (savedPayments.length === 0) {
      const demoPayments: Payment[] = [
        {
          receipt_number: 'RCP-20260219-001',
          patient_name: 'John Doe',
          amount: 3850,
          payment_method: 'pending',
          date: new Date(Date.now() - 86400000).toISOString(), // yesterday
          status: 'pending'
        },
        {
          receipt_number: 'RCP-20260218-002',
          patient_name: 'Jane Smith',
          amount: 2500,
          payment_method: 'pending',
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          status: 'overdue'
        }
      ];
      setPayments(demoPayments);
    } else {
      setPayments(savedPayments);
    }
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         payment.receipt_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'paid') return matchesSearch && payment.status === 'completed';
    if (filter === 'pending') return matchesSearch && (payment.status === 'pending' || payment.status === 'overdue');
    
    return matchesSearch;
  });

  const totalOutstanding = payments
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
          <p className="text-sm text-gray-500">Track all payments and outstanding bills</p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-xl font-bold text-red-600">₹{totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Collected</p>
            <p className="text-xl font-bold text-green-600">₹{totalCollected.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search patient or receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              filter === 'paid'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Paid
          </button>
          
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              filter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Pending
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {payment.receipt_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.patient_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className={payment.status === 'completed' ? 'text-green-600' : 'text-gray-900'}>
                      ₹{payment.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {payment.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {payment.status === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {payment.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OutstandingPayments;