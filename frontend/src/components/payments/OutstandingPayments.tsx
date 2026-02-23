import { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle, Clock, Filter, CreditCard } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Payment {
  receipt_number: string;
  patient_name: string;
  amount: number;
  payment_method: string;
  date: string;
  status: string;
  type?: string;
  description?: string;
}

const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const { cardColors } = useTheme();
  
  return (
    <div className={`relative overflow-hidden rounded-3xl ${cardColors.bg} backdrop-blur-xl border ${cardColors.border} shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const OutstandingPayments = () => {
  const { cardColors } = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  

  useEffect(() => {
    const savedPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    
    if (savedPayments.length === 0) {
      const demoPayments: Payment[] = [
        {
          receipt_number: 'RCP-20260219-001',
          patient_name: 'John Doe',
          amount: 3850,
          payment_method: 'pending',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending'
        },
        {
          receipt_number: 'RCP-20260218-002',
          patient_name: 'Jane Smith',
          amount: 2500,
          payment_method: 'pending',
          date: new Date(Date.now() - 172800000).toISOString(),
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
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20">
            <CreditCard className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Payment History</h3>
            <p className="text-white/50 text-sm">Track all payments and outstanding bills</p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="flex gap-4">
          <div className="px-5 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Hospital Fees</p>
            <p className="text-2xl font-black text-blue-400">
              ₹{payments.filter(p => p.type === 'doctor_hospital_payment').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">Peer Consultations</p>
            <p className="text-2xl font-black text-purple-400">
              ₹{payments.filter(p => p.type === 'peer_consultation').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">Patient Collections</p>
            <p className="text-2xl font-black text-emerald-400">
              ₹{payments.filter(p => p.type === 'patient_consultation').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search patient or receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={"w-full pl-12 pr-4 py-3 rounded-2xl " + cardColors.inputBg + " " + cardColors.inputBorder + " text-white placeholder-white/30 focus:outline-none focus:border-slate-700 transition-all"}
          />
        </div>
        
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', icon: Filter },
            { key: 'paid', label: 'Paid', icon: CheckCircle },
            { key: 'pending', label: 'Pending', icon: AlertCircle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={"px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all " + (filter === key ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : cardColors.inputBg + " text-white/70 " + cardColors.inputBgClass + " " + cardColors.inputBorder)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={"border-b " + cardColors.tableBorder}>
              <th className="text-left py-4 px-4 text-white/50 text-sm font-medium">Receipt</th>
              <th className="text-left py-4 px-4 text-white/50 text-sm font-medium">Type</th>
              <th className="text-left py-4 px-4 text-white/50 text-sm font-medium">Patient/Doctor</th>
              <th className="text-left py-4 px-4 text-white/50 text-sm font-medium">Amount</th>
              <th className="text-left py-4 px-4 text-white/50 text-sm font-medium">Date</th>
              <th className="text-left py-4 px-4 text-white/50 text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className={"divide-y " + cardColors.tableDivide}>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className={"w-16 h-16 mx-auto mb-4 rounded-2xl " + cardColors.inputBg + " flex items-center justify-center"}>
                    <CreditCard className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white/50">No payments found</p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => (
                <tr key={index} className={cardColors.rowHover + " transition-colors"}>
                  <td className="py-4 px-4">
                    <span className="font-mono text-white/70 text-sm">{payment.receipt_number}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                      payment.type === 'doctor_hospital_payment' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : payment.type === 'peer_consultation'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : payment.type === 'patient_consultation'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                    }`}>
                      {payment.type === 'doctor_hospital_payment' 
                        ? 'Hospital Fee'
                        : payment.type === 'peer_consultation'
                        ? 'Peer Consult'
                        : payment.type === 'patient_consultation'
                        ? 'Patient Consult'
                        : 'General'
                      }
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white font-medium">{payment.patient_name}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`font-bold ${
                      payment.status === 'completed' ? 'text-emerald-400' : 'text-white'
                    }`}>
                      ₹{payment.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-white/50 text-sm">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${
                      payment.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : payment.status === 'overdue'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {payment.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {payment.status === 'overdue' && <AlertCircle className="w-3 h-3" />}
                      {payment.status === 'pending' && <Clock className="w-3 h-3" />}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

export default OutstandingPayments;