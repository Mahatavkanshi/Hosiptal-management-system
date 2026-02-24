import { Router } from 'express';
import {
  getDashboardSummary,
  getRevenueAnalytics,
  createInvoice,
  getInvoices,
  processPayment,
  createExpense,
  getExpenses,
  createVendorPayment,
  getVendorPayments,
  createInsuranceClaim,
  getInsuranceClaims,
  createPayroll,
  getPayroll,
  getFinancialSummary
} from '../controllers/financial.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard summary - accessible by admin and super_admin
router.get('/dashboard-summary', authorize('admin', 'super_admin'), getDashboardSummary);

// Revenue analytics
router.get('/revenue-analytics', authorize('admin', 'super_admin'), getRevenueAnalytics);

// Financial summary
router.get('/financial-summary', authorize('admin', 'super_admin'), getFinancialSummary);

// Invoice management
router.post('/invoices', authorize('admin', 'receptionist', 'super_admin'), createInvoice);
router.get('/invoices', authorize('admin', 'receptionist', 'super_admin'), getInvoices);
router.post('/invoices/:id/payment', authorize('admin', 'receptionist', 'super_admin'), processPayment);

// Expense management
router.post('/expenses', authorize('admin', 'super_admin'), createExpense);
router.get('/expenses', authorize('admin', 'super_admin'), getExpenses);

// Vendor payments
router.post('/vendor-payments', authorize('admin', 'super_admin'), createVendorPayment);
router.get('/vendor-payments', authorize('admin', 'super_admin'), getVendorPayments);

// Insurance claims
router.post('/insurance-claims', authorize('admin', 'receptionist', 'super_admin'), createInsuranceClaim);
router.get('/insurance-claims', authorize('admin', 'receptionist', 'super_admin'), getInsuranceClaims);

// Payroll management
router.post('/payroll', authorize('admin', 'super_admin'), createPayroll);
router.get('/payroll', authorize('admin', 'super_admin'), getPayroll);

export default router;
