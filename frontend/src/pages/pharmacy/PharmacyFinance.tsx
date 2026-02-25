import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Pill,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  FileText,
  Printer,
  Plus,
  ArrowLeft,
  Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface MedicineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  patientId: string;
}

interface Transaction {
  id: string;
  patient: Patient;
  medicines: MedicineItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'partial' | 'pending' | 'overdue';
  paymentMethod: 'cash' | 'card' | 'upi' | 'insurance';
  transactionDate: string;
  billNumber: string;
  notes?: string;
}

const demoTransactions: Transaction[] = [
  {
    id: '1',
    patient: {
      id: 'p1',
      name: 'John Doe',
      age: 45,
      gender: 'Male',
      phone: '+91 98765 43210',
      patientId: 'PT-2024-001'
    },
    medicines: [
      { id: 'm1', name: 'Paracetamol 500mg', quantity: 2, unitPrice: 25, totalPrice: 50 },
      { id: 'm2', name: 'Amoxicillin 250mg', quantity: 1, unitPrice: 120, totalPrice: 120 }
    ],
    totalAmount: 170,
    discount: 10,
    finalAmount: 160,
    amountPaid: 160,
    balanceDue: 0,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    transactionDate: '2024-01-15',
    billNumber: 'BILL-2024-0001'
  },
  {
    id: '2',
    patient: {
      id: 'p2',
      name: 'Jane Smith',
      age: 32,
      gender: 'Female',
      phone: '+91 98765 43211',
      patientId: 'PT-2024-002'
    },
    medicines: [
      { id: 'm3', name: 'Vitamin D3', quantity: 1, unitPrice: 180, totalPrice: 180 },
      { id: 'm4', name: 'Calcium Tablets', quantity: 2, unitPrice: 150, totalPrice: 300 }
    ],
    totalAmount: 480,
    discount: 20,
    finalAmount: 460,
    amountPaid: 200,
    balanceDue: 260,
    paymentStatus: 'partial',
    paymentMethod: 'card',
    transactionDate: '2024-01-15',
    billNumber: 'BILL-2024-0002'
  },
  {
    id: '3',
    patient: {
      id: 'p3',
      name: 'Mike Johnson',
      age: 28,
      gender: 'Male',
      phone: '+91 98765 43212',
      patientId: 'PT-2024-003'
    },
    medicines: [
      { id: 'm5', name: 'Omeprazole 20mg', quantity: 1, unitPrice: 95, totalPrice: 95 },
      { id: 'm6', name: 'Domperidone', quantity: 1, unitPrice: 45, totalPrice: 45 }
    ],
    totalAmount: 140,
    discount: 0,
    finalAmount: 140,
    amountPaid: 0,
    balanceDue: 140,
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    transactionDate: '2024-01-14',
    billNumber: 'BILL-2024-0003'
  },
  {
    id: '4',
    patient: {
      id: 'p4',
      name: 'Sarah Williams',
      age: 55,
      gender: 'Female',
      phone: '+91 98765 43213',
      patientId: 'PT-2024-004'
    },
    medicines: [
      { id: 'm7', name: 'Insulin Glargine', quantity: 2, unitPrice: 850, totalPrice: 1700 },
      { id: 'm8', name: 'Metformin 500mg', quantity: 3, unitPrice: 45, totalPrice: 135 },
      { id: 'm9', name: 'Glucometer Strips', quantity: 1, unitPrice: 650, totalPrice: 650 }
    ],
    totalAmount: 2485,
    discount: 100,
    finalAmount: 2385,
    amountPaid: 2385,
    balanceDue: 0,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    transactionDate: '2024-01-14',
    billNumber: 'BILL-2024-0004'
  },
  {
    id: '5',
    patient: {
      id: 'p5',
      name: 'Robert Brown',
      age: 62,
      gender: 'Male',
      phone: '+91 98765 43214',
      patientId: 'PT-2024-005'
    },
    medicines: [
      { id: 'm10', name: 'Atorvastatin 20mg', quantity: 2, unitPrice: 150, totalPrice: 300 },
      { id: 'm11', name: 'Aspirin 75mg', quantity: 1, unitPrice: 28, totalPrice: 28 }
    ],
    totalAmount: 328,
    discount: 0,
    finalAmount: 328,
    amountPaid: 0,
    balanceDue: 328,
    paymentStatus: 'overdue',
    paymentMethod: 'insurance',
    transactionDate: '2024-01-10',
    billNumber: 'BILL-2024-0005'
  }
];

const PharmacyFinance: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(demoTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, selectedStatus, dateRange]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Try to fetch real data from API
      try {
        const response = await api.get('/pharmacy/transactions');
        if (response.data?.data?.transactions?.length > 0) {
          setTransactions(response.data.data.transactions);
        }
      } catch (apiError) {
        console.log('API not available, using demo data');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search by patient name or patient ID
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.patient.name.toLowerCase().includes(search) ||
          t.patient.patientId.toLowerCase().includes(search) ||
          t.billNumber.toLowerCase().includes(search)
      );
    }

    // Filter by payment status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => t.paymentStatus === selectedStatus);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const today = new Date();
      const transactionDate = new Date();
      filtered = filtered.filter((t) => {
        const transDate = new Date(t.transactionDate);
        switch (dateRange) {
          case 'today':
            return transDate.toDateString() === today.toDateString();
          case 'week':
            const weekAgo = new Date(today.setDate(today.getDate() - 7));
            return transDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.setDate(today.getDate() - 30));
            return transDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredTransactions(filtered);
  };

  // Calculate statistics
  const stats = {
    totalRevenue: transactions.reduce((sum, t) => sum + t.amountPaid, 0),
    totalPending: transactions.reduce((sum, t) => sum + t.balanceDue, 0),
    totalTransactions: transactions.length,
    paidTransactions: transactions.filter((t) => t.paymentStatus === 'paid').length,
    partialTransactions: transactions.filter((t) => t.paymentStatus === 'partial').length,
    pendingTransactions: transactions.filter((t) => t.paymentStatus === 'pending').length,
    overdueTransactions: transactions.filter((t) => t.paymentStatus === 'overdue').length,
    todayRevenue: transactions
      .filter((t) => new Date(t.transactionDate).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.amountPaid, 0)
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pending: 'bg-blue-100 text-blue-700 border-blue-200',
      overdue: 'bg-red-100 text-red-700 border-red-200'
    };
    const labels = {
      paid: 'Paid',
      partial: 'Partial',
      pending: 'Pending',
      overdue: 'Overdue'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'upi':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'insurance':
        return <FileText className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const toggleExpand = (transactionId: string) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  const handlePrintBill = (transaction: Transaction) => {
    toast.success(`Printing bill ${transaction.billNumber}`);
    // Implement print functionality
  };

  const handleDownloadReport = () => {
    toast.success('Downloading financial report...');
    // Implement download functionality
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/pharmacy-dashboard"
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pharmacy Finance</h1>
            <p className="text-gray-600 mt-1">Track patient medicine purchases and payments</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadReport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Bill
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-green-600">
            <span className="font-medium">₹{stats.todayRevenue.toLocaleString()}</span> today
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalPending.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-red-600">
            <span className="font-medium">{stats.pendingTransactions + stats.overdueTransactions}</span> unpaid bills
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-green-600">{stats.paidTransactions}</span> paid,{' '}
            <span className="font-medium text-yellow-600">{stats.partialTransactions}</span> partial
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue Bills</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overdueTransactions}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-red-600">
            <span className="font-medium">Action required</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name, ID or bill number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Bill #</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Patient Details</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Medicines</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600">Total</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600">Paid</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600">Balance</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">{transaction.billNumber}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.patient.name}</p>
                          <p className="text-sm text-gray-500">
                            {transaction.patient.patientId} • {transaction.patient.age} yrs • {transaction.patient.gender}
                          </p>
                          <p className="text-xs text-gray-400">{transaction.patient.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {new Date(transaction.transactionDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Pill className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {transaction.medicines.length} items
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-medium text-gray-900">₹{transaction.finalAmount.toLocaleString()}</span>
                      {transaction.discount > 0 && (
                        <p className="text-xs text-green-600">-₹{transaction.discount} discount</p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-medium text-green-600">₹{transaction.amountPaid.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-medium ${transaction.balanceDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        ₹{transaction.balanceDue.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(transaction.paymentStatus)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleExpand(transaction.id)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        >
                          {expandedTransaction === transaction.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handlePrintBill(transaction)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        >
                          <Printer className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedTransaction === transaction.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="py-4 px-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Medicine Details</h4>
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-2 text-sm font-medium text-gray-600">Medicine Name</th>
                                <th className="text-center py-2 text-sm font-medium text-gray-600">Quantity</th>
                                <th className="text-right py-2 text-sm font-medium text-gray-600">Unit Price</th>
                                <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transaction.medicines.map((medicine) => (
                                <tr key={medicine.id} className="border-b border-gray-50">
                                  <td className="py-2 text-sm text-gray-900">{medicine.name}</td>
                                  <td className="py-2 text-center text-sm text-gray-600">{medicine.quantity}</td>
                                  <td className="py-2 text-right text-sm text-gray-600">₹{medicine.unitPrice}</td>
                                  <td className="py-2 text-right text-sm font-medium text-gray-900">
                                    ₹{medicine.totalPrice.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-200">
                                <td colSpan={3} className="py-3 text-right text-sm text-gray-600">Subtotal:</td>
                                <td className="py-3 text-right font-medium text-gray-900">
                                  ₹{transaction.totalAmount.toLocaleString()}
                                </td>
                              </tr>
                              {transaction.discount > 0 && (
                                <tr>
                                  <td colSpan={3} className="py-1 text-right text-sm text-green-600">Discount:</td>
                                  <td className="py-1 text-right font-medium text-green-600">
                                    -₹{transaction.discount.toLocaleString()}
                                  </td>
                                </tr>
                              )}
                              <tr>
                                <td colSpan={3} className="py-1 text-right text-sm text-gray-600">Final Amount:</td>
                                <td className="py-1 text-right font-semibold text-gray-900">
                                  ₹{transaction.finalAmount.toLocaleString()}
                                </td>
                              </tr>
                              <tr>
                                <td colSpan={3} className="py-1 text-right text-sm text-gray-600">
                                  Paid ({transaction.paymentMethod}):
                                </td>
                                <td className="py-1 text-right font-medium text-green-600">
                                  ₹{transaction.amountPaid.toLocaleString()}
                                </td>
                              </tr>
                              {transaction.balanceDue > 0 && (
                                <tr>
                                  <td colSpan={3} className="py-1 text-right text-sm text-red-600">Balance Due:</td>
                                  <td className="py-1 text-right font-semibold text-red-600">
                                    ₹{transaction.balanceDue.toLocaleString()}
                                  </td>
                                </tr>
                              )}
                            </tfoot>
                          </table>
                          {transaction.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {transaction.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
            <p className="text-gray-600 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Add Bill Modal (Simple placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Bill</h2>
            <p className="text-gray-600 mb-6">
              This feature will allow you to create a new bill for a patient. 
              You would be able to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-2">
              <li>Search and select patient</li>
              <li>Add multiple medicines</li>
              <li>Apply discounts</li>
              <li>Record payment</li>
              <li>Generate bill receipt</li>
            </ul>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  toast.success('Feature coming soon!');
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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

export default PharmacyFinance;
