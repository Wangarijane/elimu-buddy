import express from 'express';
import { protect, authorize, requireAdmin } from '../middleware/auth.js';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  searchUsers,
  getUserQuestions,
  getUserAnswers,
  getUserPayments,
  getUserSubscriptions,
  addChild,
  removeChild,
  updateChild,
  getChildren
} from '../controllers/userController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', getUser);
router.put('/profile', updateUser);
router.get('/stats', getUserStats);
router.get('/questions', getUserQuestions);
router.get('/answers', getUserAnswers);
router.get('/payments', getUserPayments);
router.get('/subscriptions', getUserSubscriptions);

// Family management (for parents)
router.post('/children', addChild);
router.get('/children', getChildren);
router.put('/children/:childId', updateChild);
router.delete('/children/:childId', removeChild);

// Admin routes
router.use(requireAdmin);
router.get('/', getUsers);
router.get('/search', searchUsers);
router.delete('/:id', deleteUser);

export default router;
