import express from 'express';
import { protect, requireExpert, requireAdmin } from '../middleware/auth.js';
import {
  getExperts,
  getExpert,
  updateExpertProfile,
  getExpertStats,
  getExpertQuestions,
  getExpertAnswers,
  getExpertEarnings,
  getExpertSchedule,
  updateExpertSchedule,
  getExpertSubjects,
  updateExpertSubjects,
  getExpertVerification,
  submitVerification,
  approveExpert,
  rejectExpert,
  suspendExpert,
  reactivateExpert,
  getExpertReviews,
  getExpertRating,
  searchExperts,
  getExpertAvailability
} from '../controllers/expertController.js';

const router = express.Router();

// Public routes (for browsing experts)
router.get('/browse', getExperts);
router.get('/search', searchExperts);
router.get('/:id', getExpert);
router.get('/:id/reviews', getExpertReviews);
router.get('/:id/rating', getExpertRating);
router.get('/:id/availability', getExpertAvailability);

// Protected routes
router.use(protect);

// Expert profile routes
router.get('/profile', requireExpert, getExpert);
router.put('/profile', requireExpert, updateExpertProfile);
router.get('/stats', requireExpert, getExpertStats);
router.get('/questions', requireExpert, getExpertQuestions);
router.get('/answers', requireExpert, getExpertAnswers);
router.get('/earnings', requireExpert, getExpertEarnings);
router.get('/schedule', requireExpert, getExpertSchedule);
router.put('/schedule', requireExpert, updateExpertSchedule);
router.get('/subjects', requireExpert, getExpertSubjects);
router.put('/subjects', requireExpert, updateExpertSubjects);

// Expert verification
router.get('/verification/status', requireExpert, getExpertVerification);
router.post('/verification', requireExpert, submitVerification);

// Admin routes
router.use(requireAdmin);
router.get('/all', getExperts);
router.put('/:id/approve', approveExpert);
router.put('/:id/reject', rejectExpert);
router.put('/:id/suspend', suspendExpert);
router.put('/:id/reactivate', reactivateExpert);

export default router;
