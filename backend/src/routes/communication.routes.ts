import { Router } from 'express';
import {
  createChatRoom,
  getChatRooms,
  getMessages,
  sendMessage,
  getUnreadCount,
  getOrCreatePrivateRoom,
  triggerEmergencyAlert,
  getEmergencyAlerts,
  resolveEmergencyAlert,
  initiateVideoCall,
  getVideoCall,
  updateVideoCallStatus,
  getCallHistory
} from '../controllers/communication.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Chat routes
router.post('/rooms', authorize('nurse', 'doctor', 'admin'), createChatRoom);
router.get('/rooms', authorize('nurse', 'doctor', 'admin'), getChatRooms);
router.get('/rooms/:roomId/messages', authorize('nurse', 'doctor', 'admin'), getMessages);
router.post('/rooms/:roomId/messages', authorize('nurse', 'doctor', 'admin'), sendMessage);
router.get('/unread-count', authorize('nurse', 'doctor', 'admin'), getUnreadCount);
router.post('/private-room', authorize('nurse', 'doctor', 'admin'), getOrCreatePrivateRoom);

// Emergency alerts
router.post('/emergency-alerts', authorize('nurse', 'doctor', 'admin'), triggerEmergencyAlert);
router.get('/emergency-alerts', authorize('nurse', 'doctor', 'admin'), getEmergencyAlerts);
router.put('/emergency-alerts/:id/resolve', authorize('nurse', 'doctor', 'admin'), resolveEmergencyAlert);

// Video calls
router.post('/video-calls', authorize('nurse', 'doctor', 'admin'), initiateVideoCall);
router.get('/video-calls/:roomId', authorize('nurse', 'doctor', 'admin'), getVideoCall);
router.put('/video-calls/:roomId/status', authorize('nurse', 'doctor', 'admin'), updateVideoCallStatus);
router.get('/video-calls', authorize('nurse', 'doctor', 'admin'), getCallHistory);

export default router;
