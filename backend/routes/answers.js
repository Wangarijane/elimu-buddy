import express from 'express';
import { protect, requireExpert, requireStudent, requireAdmin } from '../middleware/auth.js';
import {
  createAnswer,
  getAnswers,
  getAnswer,
  updateAnswer,
  deleteAnswer,
  getAnswersByQuestion,
  getAnswersByExpert,
  getAnswersByUser,
  rateAnswer,
  reportAnswer,
  markAsBest,
  requestRevision,
  approveAnswer,
  rejectAnswer,
  addAttachment,
  removeAttachment,
  getAnswerStats
} from '../controllers/answerController.js';

const router = express.Router();

// Public routes (for viewing answers)
router.get('/question/:questionId', getAnswersByQuestion);

// Protected routes
router.use(protect);

// Expert routes
router.post('/', requireExpert, createAnswer);
router.get('/my-answers', requireExpert, getAnswersByExpert);
router.put('/:id', requireExpert, updateAnswer);
router.delete('/:id', requireExpert, deleteAnswer);
router.post('/:id/attachments', requireExpert, addAttachment);
router.delete('/:id/attachments/:attachmentId', requireExpert, removeAttachment);
router.get('/stats', requireExpert, getAnswerStats);

// Student routes
router.get('/my-questions', requireStudent, getAnswersByUser);
router.post('/:id/rate', requireStudent, rateAnswer);
router.post('/:id/report', requireStudent, reportAnswer);
router.post('/:id/best', requireStudent, markAsBest);
router.post('/:id/revision', requireStudent, requestRevision);

// Admin routes
router.use(requireAdmin);
router.get('/all', getAnswers);
router.get('/:id', getAnswer);
router.put('/:id/approve', approveAnswer);
router.put('/:id/reject', rejectAnswer);
router.delete('/:id', deleteAnswer);

// General protected route
router.get('/:id', getAnswer);

export default router;
