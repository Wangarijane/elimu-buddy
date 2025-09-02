import express from 'express';
import { protect, requireExpert, requireAdmin } from '../middleware/auth.js';
import {
  initiateSTKPush,
  checkSTKStatus,
  initiateB2C,
  checkB2CStatus,
  processCallback,
  getPaymentHistory,
  getPaymentDetails,
  requestWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalHistory,
  getPaymentStats,
  refundPayment,
  disputePayment,
  getMpesaBalance,
  validatePhoneNumber
} from '../controllers/paymentController.js';

const router = express.Router();

// Public routes (for M-Pesa callbacks)
router.post('/callback', processCallback);

// Protected routes
router.use(protect);

// User payment routes
router.post('/stk-push', initiateSTKPush);
router.get('/stk-status/:checkoutRequestId', checkSTKStatus);
router.get('/history', getPaymentHistory);
router.get('/:id', getPaymentDetails);
router.post('/:id/refund', refundPayment);
router.post('/:id/dispute', disputePayment);

// Expert withdrawal routes
router.post('/withdrawal', requireExpert, requestWithdrawal);
router.get('/withdrawal/history', requireExpert, getWithdrawalHistory);
router.get('/balance', requireExpert, getMpesaBalance);

// Admin routes
router.use(requireAdmin);
router.get('/all', getPaymentHistory);
router.get('/stats', getPaymentStats);
router.put('/withdrawal/:id/approve', approveWithdrawal);
router.put('/withdrawal/:id/reject', rejectWithdrawal);
router.get('/withdrawal/all', getWithdrawalHistory);

// Utility routes
router.post('/validate-phone', validatePhoneNumber);

export default router;
