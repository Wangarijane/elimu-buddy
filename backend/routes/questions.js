import express from 'express';
import { protect, requireStudent, requireParent, requireExpert, requireAdmin } from '../middleware/auth.js';
import {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySubject,
  getQuestionsByGrade,
  searchQuestions,
  assignToExpert,
  markAsResolved,
  getUnansweredQuestions,
  getQuestionsByUser,
  getQuestionsByExpert,
  addAttachment,
  removeAttachment,
  rateQuestion,
  reportQuestion
} from '../controllers/questionController.js';

const router = express.Router();

// Public routes (for browsing questions)
router.get('/browse', getQuestions);
router.get('/subject/:subject', getQuestionsBySubject);
router.get('/grade/:grade', getQuestionsByGrade);
router.get('/search', searchQuestions);

// Protected routes
router.use(protect);

// Student/Parent routes
router.post('/', requireStudent, createQuestion);
router.get('/my-questions', getQuestionsByUser);
router.put('/:id', requireStudent, updateQuestion);
router.delete('/:id', requireStudent, deleteQuestion);
router.post('/:id/attachments', requireStudent, addAttachment);
router.delete('/:id/attachments/:attachmentId', requireStudent, removeAttachment);
router.post('/:id/resolve', requireStudent, markAsResolved);
router.post('/:id/rate', requireStudent, rateQuestion);
router.post('/:id/report', requireStudent, reportQuestion);

// Expert routes
router.get('/unanswered', requireExpert, getUnansweredQuestions);
router.get('/assigned', requireExpert, getQuestionsByExpert);
router.put('/:id/assign', requireExpert, assignToExpert);

// Admin routes
router.use(requireAdmin);
router.get('/all', getQuestions);
router.delete('/:id', deleteQuestion);

// General protected route (for viewing question details)
router.get('/:id', getQuestion);

export default router;
