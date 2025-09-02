import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Subscription from '../models/Subscription.js';
import mpesa from '../utils/mpesa.js';

/* ------------------ STK Push ------------------ */
export const initiateSTKPush = async (req, res, next) => {
  try {
    const { amount, phoneNumber, purpose, reference, referenceType } = req.body;
    const payerId = req.user.id;

    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    if (!phoneNumber || phoneNumber.length < 10)
      return res.status(400).json({ success: false, message: 'Invalid phone number' });

    const payment = new Payment({
      amount,
      currency: 'KES',
      type: 'incoming',
      purpose,
      method: 'mpesa_stk',
      status: 'pending',
      payer: payerId,
      mpesa: { phoneNumber, referenceType, reference: reference || undefined },
    });

    await payment.save();

    const stkResponse = await mpesaSTKPush(phoneNumber, amount, payment._id.toString());

    if (!stkResponse.success) {
      payment.status = 'failed';
      payment.error = stkResponse.error;
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Failed to initiate payment',
        error: stkResponse.error,
      });
    }

    payment.mpesa.checkoutRequestId = stkResponse.data.CheckoutRequestID;
    payment.mpesa.merchantRequestId = stkResponse.data.MerchantRequestID;
    await payment.save();

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        paymentId: payment._id,
        checkoutRequestId: stkResponse.data.CheckoutRequestID,
        status: 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkSTKStatus = async (req, res, next) => {
  try {
    const { checkoutRequestId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      'mpesa.checkoutRequestId': checkoutRequestId,
      payer: userId,
    });
    if (!payment)
      return res.status(404).json({ success: false, message: 'Payment not found' });

    const statusResponse = await mpesaCheckSTK(checkoutRequestId);

    if (statusResponse.success) {
      if (statusResponse.data.ResultCode === '0') {
        payment.status = 'completed';
        payment.mpesa.transactionId = statusResponse.data.TransactionID;
        payment.mpesa.completedAt = new Date();
        await processSuccessfulPayment(payment);
      } else {
        payment.status = 'failed';
        payment.error = statusResponse.data.ResultDesc;
      }
      await payment.save();
    }

    res.json({
      success: true,
      data: { payment, mpesaStatus: statusResponse.success ? statusResponse.data : null },
    });
  } catch (error) {
    next(error);
  }
};

/* ------------------ B2C ------------------ */
export const initiateB2C = async (req, res, next) => {
  try {
    const { amount, phoneNumber, purpose } = req.body;
    const payeeId = req.user.id;

    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, message: 'Invalid amount' });

    const user = await User.findById(payeeId);
    if (!user || user.balance < amount)
      return res.status(400).json({ success: false, message: 'Insufficient balance' });

    const payment = new Payment({
      amount,
      currency: 'KES',
      type: 'outgoing',
      purpose: purpose || 'withdrawal',
      method: 'mpesa_b2c',
      status: 'pending',
      payee: payeeId,
      mpesa: { phoneNumber, referenceType: 'withdrawal', reference: undefined },
    });

    await payment.save();

    const b2cResponse = await mpesaB2C(phoneNumber, amount, payment._id.toString());

    if (!b2cResponse.success) {
      payment.status = 'failed';
      payment.error = b2cResponse.error;
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Failed to initiate withdrawal',
        error: b2cResponse.error,
      });
    }

    payment.mpesa.conversationId = b2cResponse.data.ConversationID;
    payment.mpesa.originatorConversationId = b2cResponse.data.OriginatorConversationID;
    await payment.save();

    res.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      data: {
        paymentId: payment._id,
        conversationId: b2cResponse.data.ConversationID,
        status: 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const checkB2CStatus = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({
      'mpesa.conversationId': conversationId,
      payee: userId,
    });
    if (!payment)
      return res.status(404).json({ success: false, message: 'Payment not found' });

    const statusResponse = await mpesaCheckB2C(conversationId);

    if (statusResponse.success) {
      if (statusResponse.data.ResultCode === '0') {
        payment.status = 'completed';
        payment.mpesa.transactionId = statusResponse.data.TransactionID;
        payment.mpesa.completedAt = new Date();
        await processSuccessfulWithdrawal(payment);
      } else {
        payment.status = 'failed';
        payment.error = statusResponse.data.ResultDesc;
      }
      await payment.save();
    }

    res.json({
      success: true,
      data: { payment, mpesaStatus: statusResponse.success ? statusResponse.data : null },
    });
  } catch (error) {
    next(error);
  }
};

/* ------------------ Callback ------------------ */
export const processCallback = async (req, res, next) => {
  try {
    const callbackData = req.body;

    const isValidCallback = await verifyMpesaCallback(callbackData);
    if (!isValidCallback)
      return res.status(400).json({ success: false, message: 'Invalid callback' });

    if (callbackData.ResultCode === '0') {
      await mpesaProcessCallback(callbackData);
    }

    res.json({ success: true, message: 'Callback processed successfully' });
  } catch (error) {
    next(error);
  }
};

/* ------------------ Payment History & Details ------------------ */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, status, method } = req.query;

    const query = { $or: [{ payer: userId }, { payee: userId }] };
    if (type) query.type = type;
    if (status) query.status = status;
    if (method) query.method = method;

    const payments = await Payment.find(query)
      .populate('payer', 'profile.firstName profile.lastName')
      .populate('payee', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(id)
      .populate('payer', 'profile.firstName profile.lastName')
      .populate('payee', 'profile.firstName profile.lastName');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    if (payment.payer.toString() !== userId && payment.payee.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: { payment } });
  } catch (error) {
    next(error);
  }
};

/* ------------------ Admin / Expert Functions ------------------ */
export const requestWithdrawal = async (req, res, next) => {
  try {
    // Already implemented in initiateB2C
    res.status(200).json({ success: true, message: 'Request withdrawal handled via B2C' });
  } catch (error) {
    next(error);
  }
};

export const getWithdrawalHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const query = { payee: userId, type: 'outgoing' };
    const withdrawals = await Payment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: { withdrawals, total, currentPage: page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const approveWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment)
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });

    payment.status = 'approved';
    await processSuccessfulWithdrawal(payment);
    await payment.save();

    res.json({ success: true, message: 'Withdrawal approved', data: payment });
  } catch (error) {
    next(error);
  }
};

export const rejectWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment)
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });

    payment.status = 'rejected';
    await payment.save();

    res.json({ success: true, message: 'Withdrawal rejected', data: payment });
  } catch (error) {
    next(error);
  }
};

/* ------------------ Admin Stats ------------------ */
export const getPaymentStats = async (req, res, next) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const completed = await Payment.countDocuments({ status: 'completed' });
    const pending = await Payment.countDocuments({ status: 'pending' });
    const failed = await Payment.countDocuments({ status: 'failed' });

    res.json({ success: true, data: { totalPayments, completed, pending, failed } });
  } catch (error) {
    next(error);
  }
};

/* ------------------ Refunds & Disputes ------------------ */
export const refundPayment = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Refund feature not implemented yet' });
};

export const disputePayment = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Dispute feature not implemented yet' });
};

/* ------------------ Utilities ------------------ */
export const getMpesaBalance = async (req, res, next) => {
  res.status(200).json({ success: true, balance: 1000 }); // Placeholder
};

export const validatePhoneNumber = async (req, res, next) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber || phoneNumber.length < 10)
    return res.status(400).json({ success: false, message: 'Invalid phone number' });
  res.json({ success: true, message: 'Phone number valid' });
};

/* ------------------ Helper Functions ------------------ */
async function processSuccessfulPayment(payment) {
  try {
    payment.status = 'completed';
    payment.completedAt = new Date();

    if (payment.purpose === 'subscription') await processSubscriptionPayment(payment);
    else if (payment.purpose === 'expert_answer') await processExpertAnswerPayment(payment);

    await payment.save();
  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

async function processSuccessfulWithdrawal(payment) {
  try {
    const user = await User.findById(payment.payee);
    if (user) {
      user.balance = Math.max(0, user.balance - payment.amount);
      await user.save();
    }
    await payment.save();
  } catch (error) {
    console.error('Error processing successful withdrawal:', error);
  }
}

async function processSubscriptionPayment(payment) {}
async function processExpertAnswerPayment(payment) {}
async function verifyMpesaCallback(callbackData) {
  return true;
}
