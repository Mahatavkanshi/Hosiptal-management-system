import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDoctorsQueue,
  getDoctorQueue,
  getAllQueues,
  addToQueue,
  updateQueueStatus,
  callNextPatient,
  processPayment,
  getTodayStats,
  searchPatients
} from '../controllers/reception.controller';

const router = Router();

// All routes require authentication AND receptionist/admin/super_admin role
router.use(authenticate);
router.use(authorize('receptionist', 'admin', 'super_admin'));

// Get all doctors with queue info
router.get('/doctors', getDoctorsQueue);

// Get queue for specific doctor
router.get('/queue/:doctorId', getDoctorQueue);

// Get all queues
router.get('/queue', getAllQueues);

// Add patient to queue
router.post('/queue', addToQueue);

// Update appointment status
router.patch('/queue/:appointmentId/status', updateQueueStatus);

// Call next patient
router.post('/queue/:doctorId/call-next', callNextPatient);

// Process payment
router.post('/queue/:appointmentId/payment', processPayment);

// Get today's stats
router.get('/stats/today', getTodayStats);

// Search patients
router.get('/patients/search', searchPatients);

export default router;
