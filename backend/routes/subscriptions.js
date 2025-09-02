import express from 'express';
import { protect, requireAdmin } from '../middleware/auth.js';
import {
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription,
  upgradeSubscription,
  downgradeSubscription,
  getSubscriptionPlans,
  getCurrentPlan,
  getBillingHistory,
  processPayment,
  applyDiscount,
  removeDiscount,
  getFamilyMembers,
  addFamilyMember,
  removeFamilyMember,
  transferSubscription,
  deleteSubscription // Added this import
} from '../controllers/subscriptionController.js';

const router = express.Router();

// Public routes (for viewing plans)
router.get('/plans', getSubscriptionPlans);

// Protected routes
router.use(protect);

// User subscription routes
router.post('/', createSubscription);
router.get('/current', getCurrentPlan);
router.get('/history', getBillingHistory);
router.put('/cancel', cancelSubscription);
router.put('/renew', renewSubscription);
router.put('/upgrade', upgradeSubscription);
router.put('/downgrade', downgradeSubscription);
router.post('/payment', processPayment);
router.post('/discount', applyDiscount);
router.delete('/discount', removeDiscount);

// Family plan routes
router.get('/family', getFamilyMembers);
router.post('/family', addFamilyMember);
router.delete('/family/:memberId', removeFamilyMember);
router.post('/family/transfer', transferSubscription);

// Admin routes
router.use(requireAdmin);
router.get('/all', getSubscriptions);
router.get('/:id', getSubscription);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription); // This line was causing the error

export default router;
