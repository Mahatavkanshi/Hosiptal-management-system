import { useState, useEffect } from 'react';
import { IndianRupee, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Payment {
  receipt_number: string;
  patient_name: string;
  amount: number;
  payment_method: string;
  date: string;
  status: string;
}

const OutstandingPayments = () => {
  const { isDark } = useTheme();
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
    <div className={`rounded-xl border-2 shadow-lg overflow-hidden ${
      isDark 
        ? 'bg-slate-800 border-slate-700 shadow-slate-900/50' 
        : 'bg-white border-gray-200 shadow-gray-200/50'
    }`}>
      <div className={`p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment History</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Track all payments and outstanding bills</p>
          </div>
          
          <div className="flex gap-6">
            <div className="text-right">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Outstanding</p>
              <p className="text-xl font-bold text-rose-500">₹{totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Collected</p>
              <p className="text-xl font-bold text-emerald-500">₹{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search patient or receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : isDark 
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              All
            </button>
            
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-all ${
                filter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : isDark 
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Paid
            </button>
            
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-all ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : isDark 
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 border border-slate-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Pending
            </button>
          </div>
        </div>

        {/* Payments List */}
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
            <thead className={`${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Receipt
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Patient
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Amount
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700 bg-slate-800' : 'divide-gray-200 bg-white'}`}>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment, index) => (
                  <tr key={index} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {payment.receipt_number}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {payment.patient_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span className={payment.status === 'completed' ? 'text-emerald-500' : isDark ? 'text-gray-300' : 'text-gray-900'}>
                        ₹{payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                        payment.status === 'completed'
                          ? (isDark ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-800')
                          : payment.status === 'overdue'
                          ? (isDark ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-rose-100 border-rose-200 text-rose-800')
                          : (isDark ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-amber-100 border-amber-200 text-amber-800')
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
    </div>
  );
};

export default OutstandingPayments;
