import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protected routes - only accessible by admin
router.get('/', authenticate, authorize('admin', 'super_admin'), (req, res) => {
  res.json({ message: 'Get all users - Admin only' });
});

router.get('/:id', authenticate, (req, res) => {
  res.json({ message: `Get user ${req.params.id}` });
});

router.put('/:id', authenticate, authorize('admin', 'super_admin'), (req, res) => {
  res.json({ message: `Update user ${req.params.id}` });
});

router.delete('/:id', authenticate, authorize('super_admin'), (req, res) => {
  res.json({ message: `Delete user ${req.params.id}` });
});

export default router;
