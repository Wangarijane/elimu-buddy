import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { Parser } from 'json2csv';

/* ======================
   User Management
====================== */

/**
 * Get system overview (admin only)
 */
export const getSystemOverview = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalExperts,
      totalStudents,
      totalQuestions,
      totalAnswers,
      totalPayments,
      totalSubscriptions,
      totalChats,
      totalMessages
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'expert' }),
      User.countDocuments({ role: 'student' }),
      Question.countDocuments(),
      Answer.countDocuments(),
      Payment.countDocuments(),
      Subscription.countDocuments(),
      Chat.countDocuments(),
      Message.countDocuments()
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('profile.firstName profile.lastName role createdAt');

    const recentQuestions = await Question.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('askedBy', 'profile.firstName profile.lastName');

    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('payer', 'profile.firstName profile.lastName');

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalExperts,
          totalStudents,
          totalQuestions,
          totalAnswers,
          totalPayments,
          totalSubscriptions,
          totalChats,
          totalMessages
        },
        recentActivity: {
          users: recentUsers,
          questions: recentQuestions,
          payments: recentPayments
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get system statistics (admin only)
 */
export const getSystemStats = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      newUsers,
      newExperts,
      newQuestions,
      newAnswers,
      newPayments,
      newSubscriptions,
      newChats,
      newMessages
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ role: 'expert', createdAt: { $gte: startDate } }),
      Question.countDocuments({ createdAt: { $gte: startDate } }),
      Answer.countDocuments({ createdAt: { $gte: startDate } }),
      Payment.countDocuments({ createdAt: { $gte: startDate } }),
      Subscription.countDocuments({ createdAt: { $gte: startDate } }),
      Chat.countDocuments({ createdAt: { $gte: startDate } }),
      Message.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    const revenue = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

    res.json({
      success: true,
      data: {
        period,
        startDate,
        endDate: now,
        stats: {
          newUsers,
          newExperts,
          newQuestions,
          newAnswers,
          newPayments,
          newSubscriptions,
          newChats,
          newMessages,
          totalRevenue
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Suspend user
 */
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = 'suspended';
    user.suspendedAt = new Date();
    user.suspendedBy = req.user.id;
    user.suspensionReason = reason;
    await user.save();

    res.json({ success: true, message: 'User suspended', data: user });

  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate user
 */
export const reactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = 'active';
    user.suspendedAt = undefined;
    user.suspendedBy = undefined;
    user.suspensionReason = undefined;
    await user.save();

    res.json({ success: true, message: 'User reactivated', data: user });
  } catch (error) {
    next(error);
  }
};

/* ======================
   Content Management
====================== */

export const getAllQuestions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, subject, grade } = req.query;
    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (grade) query.grade = grade;

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName')
      .populate('expert', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: { questions, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalQuestions: total } }
    });

  } catch (error) {
    next(error);
  }
};

export const getAllAnswers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const answers = await Answer.find(query)
      .populate('question', 'title subject grade')
      .populate('student', 'profile.firstName profile.lastName')
      .populate('expert', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments(query);

    res.json({ success: true, data: { answers, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalAnswers: total } } });

  } catch (error) { next(error); }
};

/* ======================
   Payments & Subscriptions
====================== */

export const getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, method } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (method) query.method = method;

    const payments = await Payment.find(query)
      .populate('payer', 'profile.firstName profile.lastName')
      .populate('payee', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);
    res.json({ success: true, data: { payments, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalPayments: total } } });

  } catch (error) { next(error); }
};

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, plan } = req.query;
    const query = {};
    if (status) query.status = status;
    if (plan) query['plan.name'] = plan;

    const subscriptions = await Subscription.find(query)
      .populate('user', 'profile.firstName profile.lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Subscription.countDocuments(query);
    res.json({ success: true, data: { subscriptions, pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalSubscriptions: total } } });

  } catch (error) { next(error); }
};

/* ======================
   Analytics & Reports
====================== */

export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case 'year': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const dailyRevenue = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const planRevenue = await Payment.aggregate([
      { $match: { status: 'completed', purpose: 'subscription', createdAt: { $gte: startDate } } },
      { $group: { _id: '$subscription', revenue: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({ success: true, data: { period, startDate, endDate: now, analytics: { dailyRevenue, planRevenue, totalRevenue: totalRevenue.length ? totalRevenue[0].total : 0 } } });

  } catch (error) { next(error); }
};

/* ======================
   System Operations
====================== */

export const exportData = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    const questions = await Question.find();
    const answers = await Answer.find();
    const payments = await Payment.find();
    const subscriptions = await Subscription.find();

    const exportJson = { users, questions, answers, payments, subscriptions };
    const parser = new Parser();
    const csvData = {};
    for (const [key, value] of Object.entries(exportJson)) {
      csvData[key] = parser.parse(value);
    }

    res.json({ success: true, message: 'Export data generated', data: csvData });

  } catch (error) { next(error); }
};

export const backupDatabase = async (req, res, next) => res.json({ success: true, message: 'Database backup initiated (placeholder)' });
export const restoreDatabase = async (req, res, next) => res.json({ success: true, message: 'Database restore initiated (placeholder)' });
export const clearCache = async (req, res, next) => res.json({ success: true, message: 'System cache cleared (placeholder)' });
