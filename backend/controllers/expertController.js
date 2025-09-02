import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Payment from '../models/Payment.js';

/**
 * Get all experts (public)
 */
export const getExperts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, subject, grade, rating, verified } = req.query;

    const query = { 
      role: 'expert',
      status: 'active',
      'verification.expert.isVerified': true
    };

    if (subject) query['profile.expertise.subjects'] = { $in: [subject] };
    if (grade) query['profile.expertise.grades'] = { $in: [grade] };
    if (rating) query['profile.expertise.rating'] = { $gte: parseFloat(rating) };
    if (verified !== undefined) query['verification.expert.isVerified'] = verified === 'true';

    const experts = await User.find(query)
      .select('profile.firstName profile.lastName profile.expertise profile.avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'profile.expertise.rating': -1, createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        experts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalExperts: total,
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
 * Get single expert (public)
 */
export const getExpert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expert = await User.findById(id)
      .select('profile.firstName profile.lastName profile.expertise profile.avatar profile.bio')
      .populate('answers', 'question rating createdAt')
      .populate('questions', 'title subject grade status');

    if (!expert || expert.role !== 'expert') {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: { expert }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update expert profile
 */
export const updateExpertProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const expert = await User.findById(userId);
    if (!expert || expert.role !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Remove sensitive fields
    delete updateData.email;
    delete updateData.role;
    delete updateData.status;
    delete updateData.verification;

    const updatedExpert = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { expert: updatedExpert }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get expert statistics
 */
export const getExpertStats = async (req, res, next) => {
  try {
    const expertId = req.user.id;

    const [totalQuestions, totalAnswers, totalEarnings, averageRating, responseTime] = await Promise.all([
      Question.countDocuments({ expert: expertId }),
      Answer.countDocuments({ expert: expertId }),
      Payment.aggregate([
        { $match: { payee: expertId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Answer.aggregate([
        { $match: { expert: expertId, 'rating.score': { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$rating.score' } } }
      ]),
      Answer.aggregate([
        { $match: { expert: expertId, status: 'completed' } },
        { $group: { _id: null, avg: { $avg: { $subtract: ['$completedAt', '$createdAt'] } } } }
      ])
    ]);

    const totalEarningsValue = totalEarnings.length > 0 ? totalEarnings[0].total : 0;
    const avgRating = averageRating.length > 0 ? averageRating[0].avg : 0;
    const avgResponseTime = responseTime.length > 0 ? responseTime[0].avg : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalQuestions,
          totalAnswers,
          totalEarnings: totalEarningsValue,
          averageRating: Math.round(avgRating * 10) / 10,
          averageResponseTime: Math.round(avgResponseTime / (1000 * 60)) // in minutes
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get expert questions
 */
export const getExpertQuestions = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { expert: expertId };
    if (status) query.status = status;

    const questions = await Question.find(query)
      .populate('askedBy', 'profile.firstName profile.lastName profile.grade')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
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
 * Get expert answers
 */
export const getExpertAnswers = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { expert: expertId };
    if (status) query.status = status;

    const answers = await Answer.find(query)
      .populate('question', 'title subject grade')
      .populate('student', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments(query);

    res.json({
      success: true,
      data: {
        answers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAnswers: total,
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
 * Get expert earnings
 */
export const getExpertEarnings = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { page = 1, limit = 20, period } = req.query;

    const query = { 
      payee: expertId,
      status: 'completed'
    };

    // Filter by period if specified
    if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: monthAgo };
    } else if (period === 'year') {
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: yearAgo };
    }

    const earnings = await Payment.find(query)
      .populate('payer', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    // Calculate total earnings for the period
    const totalEarnings = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        earnings,
        totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalEarnings: total,
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
 * Get expert schedule
 */
export const getExpertSchedule = async (req, res, next) => {
  try {
    const expertId = req.user.id;

    const expert = await User.findById(expertId).select('profile.expertise.schedule');
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: {
        schedule: expert.profile.expertise?.schedule || {}
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update expert schedule
 */
export const updateExpertSchedule = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { schedule } = req.body;

    const expert = await User.findById(expertId);
    if (!expert || expert.role !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!expert.profile.expertise) {
      expert.profile.expertise = {};
    }

    expert.profile.expertise.schedule = schedule;
    await expert.save();

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        schedule: expert.profile.expertise.schedule
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get expert subjects
 */
export const getExpertSubjects = async (req, res, next) => {
  try {
    const expertId = req.user.id;

    const expert = await User.findById(expertId).select('profile.expertise.subjects');
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: {
        subjects: expert.profile.expertise?.subjects || []
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update expert subjects
 */
export const updateExpertSubjects = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { subjects } = req.body;

    const expert = await User.findById(expertId);
    if (!expert || expert.role !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!expert.profile.expertise) {
      expert.profile.expertise = {};
    }

    expert.profile.expertise.subjects = subjects;
    await expert.save();

    res.json({
      success: true,
      message: 'Subjects updated successfully',
      data: {
        subjects: expert.profile.expertise.subjects
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get expert verification status
 */
export const getExpertVerification = async (req, res, next) => {
  try {
    const expertId = req.user.id;

    const expert = await User.findById(expertId).select('verification.expert');
    if (!expert) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: {
        verification: expert.verification?.expert || {}
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Submit expert verification
 */
export const submitVerification = async (req, res, next) => {
  try {
    const expertId = req.user.id;
    const { 
      qualifications, 
      experience, 
      certifications, 
      references, 
      documents,
      bio,
      expertise
    } = req.body;

    const expert = await User.findById(expertId);
    if (!expert || expert.role !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update verification data
    if (!expert.verification) {
      expert.verification = {};
    }

    expert.verification.expert = {
      qualifications,
      experience,
      certifications,
      references,
      documents,
      bio,
      expertise,
      submittedAt: new Date(),
      status: 'pending',
      isVerified: false
    };

    await expert.save();

    res.json({
      success: true,
      message: 'Verification submitted successfully',
      data: {
        verification: expert.verification.expert
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Approve expert (admin only)
 */
export const approveExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const expert = await User.findById(id);
    if (!expert || expert.role !== 'expert') {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    expert.verification.expert.status = 'approved';
    expert.verification.expert.isVerified = true;
    expert.verification.expert.approvedAt = new Date();
    expert.verification.expert.approvedBy = req.user.id;
    expert.verification.expert.adminNotes = adminNotes;
    expert.status = 'active';

    await expert.save();

    res.json({
      success: true,
      message: 'Expert approved successfully',
      data: { expert }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reject expert (admin only)
 */
export const rejectExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const expert = await User.findById(id);
    if (!expert || expert.role !== 'expert') {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    expert.verification.expert.status = 'rejected';
    expert.verification.expert.isVerified = false;
    expert.verification.expert.rejectedAt = new Date();
    expert.verification.expert.rejectedBy = req.user.id;
    expert.verification.expert.rejectionReason = reason;
    expert.status = 'suspended';

    await expert.save();

    res.json({
      success: true,
      message: 'Expert rejected successfully',
      data: { expert }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Suspend expert (admin only)
 */
export const suspendExpert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const expert = await User.findById(id);
    if (!expert || expert.role !== 'expert') {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    expert.status = 'suspended';
    expert.suspendedAt = new Date();
    expert.suspendedBy = req.user.id;
    expert.suspensionReason = reason;

    await expert.save();

    res.json({
      success: true,
      message: 'Expert suspended successfully',
      data: { expert }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate expert (admin only)
 */
export const reactivateExpert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expert = await User.findById(id);
    if (!expert || expert.role !== 'expert') {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    expert.status = 'active';
    expert.suspendedAt = undefined;
    expert.suspendedBy = undefined;
    expert.suspensionReason = undefined;

    await expert.save();

    res.json({
      success: true,
      message: 'Expert reactivated successfully',
      data: { expert }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get expert reviews
 */
export const getExpertReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const answers = await Answer.find({
      expert: id,
      'rating.score': { $exists: true }
    })
      .populate('question', 'title subject grade')
      .populate('student', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'rating.ratedAt': -1 });

    const total = await Answer.countDocuments({
      expert: id,
      'rating.score': { $exists: true }
    });

    res.json({
      success: true,
      data: {
        reviews: answers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
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
 * Get expert rating
 */
export const getExpertRating = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ratingStats = await Answer.aggregate([
      { $match: { expert: id, 'rating.score': { $exists: true } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating.score' },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating.score'
          }
        }
      }
    ]);

    if (ratingStats.length === 0) {
      return res.json({
        success: true,
        data: {
          rating: {
            average: 0,
            total: 0,
            distribution: {}
          }
        }
      });
    }

    const stats = ratingStats[0];
    const distribution = {
      1: stats.ratingDistribution.filter(r => r === 1).length,
      2: stats.ratingDistribution.filter(r => r === 2).length,
      3: stats.ratingDistribution.filter(r => r === 3).length,
      4: stats.ratingDistribution.filter(r => r === 4).length,
      5: stats.ratingDistribution.filter(r => r === 5).length
    };

    res.json({
      success: true,
      data: {
        rating: {
          average: Math.round(stats.averageRating * 10) / 10,
          total: stats.totalRatings,
          distribution
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Search experts
 */
export const searchExperts = async (req, res, next) => {
  try {
    const { q, subject, grade, rating, verified, limit = 10 } = req.query;

    const query = { 
      role: 'expert',
      status: 'active',
      'verification.expert.isVerified': true
    };

    if (q) {
      query.$or = [
        { 'profile.firstName': { $regex: q, $options: 'i' } },
        { 'profile.lastName': { $regex: q, $options: 'i' } },
        { 'profile.bio': { $regex: q, $options: 'i' } }
      ];
    }

    if (subject) query['profile.expertise.subjects'] = { $in: [subject] };
    if (grade) query['profile.expertise.grades'] = { $in: [grade] };
    if (rating) query['profile.expertise.rating'] = { $gte: parseFloat(rating) };
    if (verified !== undefined) query['verification.expert.isVerified'] = verified === 'true';

    const experts = await User.find(query)
      .select('profile.firstName profile.lastName profile.expertise profile.avatar')
      .limit(parseInt(limit))
      .sort({ 'profile.expertise.rating': -1 });

    res.json({
      success: true,
      data: { experts }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get expert availability
 */
export const getExpertAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const expert = await User.findById(id).select('profile.expertise.schedule');
    if (!expert || expert.role !== 'expert') {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    const schedule = expert.profile.expertise?.schedule || {};
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

    const daySchedule = schedule[dayOfWeek] || { available: false };

    res.json({
      success: true,
      data: {
        date: targetDate,
        dayOfWeek,
        availability: daySchedule
      }
    });

  } catch (error) {
    next(error);
  }
};
