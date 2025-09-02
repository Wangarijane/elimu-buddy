import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import {
  getSystemOverview,
  getSystemStats,
  getAllUsers,
  suspendUser,
  reactivateUser,
  getAllQuestions,
  getAllAnswers,
  getAllPayments,
  getAllSubscriptions,
  getRevenueAnalytics,
  exportData,
  backupDatabase,
  restoreDatabase,
  clearCache
} from '../controllers/adminController.js';

const router = express.Router();

// Require admin authentication
router.use(protect);
router.use(requireAdmin);

// Dashboard & overviews
router.get('/overview', getSystemOverview);
router.get('/stats', getSystemStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/reactivate', reactivateUser);

// Content management
router.get('/questions', getAllQuestions);
router.get('/answers', getAllAnswers);

// Payments & subscriptions
router.get('/payments', getAllPayments);
router.get('/subscriptions', getAllSubscriptions);

// Analytics
router.get('/analytics/revenue', getRevenueAnalytics);

// System operations
router.post('/export', exportData);
router.post('/backup', backupDatabase);
router.post('/restore', restoreDatabase);
router.post('/cache/clear', clearCache);

export default router;

