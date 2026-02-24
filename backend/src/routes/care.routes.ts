import { Router } from 'express';
import {
  createCarePlan,
  getCarePlans,
  updateCarePlan,
  createNursingNote,
  getNursingNotes,
  createWoundAssessment,
  getWoundAssessments,
  createGCSAssessment,
  getGCSAssessments,
  getLatestGCS
} from '../controllers/care.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Care plans
router.post('/plans', authorize('nurse', 'doctor', 'admin'), createCarePlan);
router.get('/plans/:patient_id', authorize('nurse', 'doctor', 'admin'), getCarePlans);
router.put('/plans/:id', authorize('nurse', 'doctor', 'admin'), updateCarePlan);

// Nursing notes
router.post('/notes', authorize('nurse'), createNursingNote);
router.get('/notes/:patient_id', authorize('nurse', 'doctor', 'admin'), getNursingNotes);

// Wound assessments
router.post('/wound-assessments', authorize('nurse'), createWoundAssessment);
router.get('/wound-assessments/:patient_id', authorize('nurse', 'doctor', 'admin'), getWoundAssessments);

// GCS assessments
router.post('/gcs-assessments', authorize('nurse', 'doctor'), createGCSAssessment);
router.get('/gcs-assessments/:patient_id', authorize('nurse', 'doctor', 'admin'), getGCSAssessments);
router.get('/gcs-assessments/:patient_id/latest', authorize('nurse', 'doctor', 'admin'), getLatestGCS);

export default router;
