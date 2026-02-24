import { Router } from 'express';
import {
  getMySchedule,
  getAllSchedules,
  createShift,
  createHandover,
  getHandovers,
  acknowledgeHandover,
  requestShiftSwap,
  getShiftSwaps,
  updateShiftSwap,
  recordOvertime,
  getOvertime,
  approveOvertime
} from '../controllers/shift.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Schedule routes
router.get('/my-schedule', authorize('nurse'), getMySchedule);
router.get('/all-schedules', authorize('admin', 'super_admin'), getAllSchedules);
router.post('/create', authorize('admin', 'super_admin'), createShift);

// Handover routes
router.post('/handovers', authorize('nurse'), createHandover);
router.get('/handovers/:patient_id', authorize('nurse', 'admin'), getHandovers);
router.put('/handovers/:id/acknowledge', authorize('nurse'), acknowledgeHandover);

// Shift swap routes
router.post('/swaps', authorize('nurse'), requestShiftSwap);
router.get('/swaps', authorize('nurse', 'admin'), getShiftSwaps);
router.put('/swaps/:id', authorize('admin', 'super_admin'), updateShiftSwap);

// Overtime routes
router.post('/overtime', authorize('nurse'), recordOvertime);
router.get('/overtime', authorize('nurse', 'admin'), getOvertime);
router.put('/overtime/:id/approve', authorize('admin', 'super_admin'), approveOvertime);

export default router;
