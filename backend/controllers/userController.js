import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';

/**
 * Get all users (admin only)
 */
export const getUsers = async (req, res, next) => {
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
 * Get single user
 */
export const getUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 */
export const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.status;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - mark as deleted
    user.status = 'deleted';
    user.deletedAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [questionsCount, answersCount, paymentsCount, subscriptionCount] = await Promise.all([
      Question.countDocuments({ askedBy: userId }),
      Answer.countDocuments({ expert: userId }),
      Payment.countDocuments({ 
        $or: [{ payer: userId }, { payee: userId }] 
      }),
      Subscription.countDocuments({ user: userId })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          questionsAsked: questionsCount,
          answersProvided: answersCount,
          paymentsMade: paymentsCount,
          subscriptions: subscriptionCount
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Search users (admin only)
 */
export const searchUsers = async (req, res, next) => {
  try {
    const { q, role, status, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const query = {
      $or: [
        { 'profile.firstName': { $regex: q, $options: 'i' } },
        { 'profile.lastName': { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    };

    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user questions
 */
export const getUserQuestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { askedBy: userId };
    if (status) query.status = status;

    const questions = await Question.find(query)
      .populate('expert', 'profile.firstName profile.lastName')
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
 * Get user answers
 */
export const getUserAnswers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const answers = await Answer.find({ expert: userId })
      .populate('question', 'title subject grade')
      .populate('student', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Answer.countDocuments({ expert: userId });

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
 * Get user payments
 */
export const getUserPayments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, status } = req.query;

    const query = { 
      $or: [{ payer: userId }, { payee: userId }] 
    };
    if (type) query.type = type;
    if (status) query.status = status;

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
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user subscriptions
 */
export const getUserSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const subscriptions = await Subscription.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalSubscriptions: total,
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
 * Add child to parent account
 */
export const addChild = async (req, res, next) => {
  try {
    const parentId = req.user.id;
    const { firstName, lastName, grade, subject, school, dateOfBirth } = req.body;

    // Verify user is a parent
    const parent = await User.findById(parentId);
    if (parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can add children'
      });
    }

    // Create child user
    const child = new User({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${parentId}@elimubuddy.ke`,
      password: Math.random().toString(36).slice(-8), // Generate random password
      role: 'student',
      profile: {
        firstName,
        lastName,
        grade,
        subject,
        school,
        dateOfBirth
      },
      parent: parentId,
      status: 'active'
    });

    await child.save();

    // Add child to parent's family members
    if (!parent.familyMembers) {
      parent.familyMembers = [];
    }
    parent.familyMembers.push(child._id);
    await parent.save();

    res.status(201).json({
      success: true,
      message: 'Child added successfully',
      data: {
        child: {
          id: child._id,
          firstName: child.profile.firstName,
          lastName: child.profile.lastName,
          grade: child.profile.grade,
          subject: child.profile.subject,
          school: child.profile.school
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get parent's children
 */
export const getChildren = async (req, res, next) => {
  try {
    const parentId = req.user.id;

    const parent = await User.findById(parentId).populate('familyMembers');
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can view children'
      });
    }

    res.json({
      success: true,
      data: {
        children: parent.familyMembers || []
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update child profile
 */
export const updateChild = async (req, res, next) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    const updateData = req.body;

    // Verify user is the parent of this child
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can update children'
      });
    }

    if (!parent.familyMembers.includes(childId)) {
      return res.status(403).json({
        success: false,
        message: 'Child not found in your family'
      });
    }

    // Update child
    const child = await User.findByIdAndUpdate(
      childId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    res.json({
      success: true,
      message: 'Child updated successfully',
      data: { child }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Remove child from parent account
 */
export const removeChild = async (req, res, next) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;

    // Verify user is the parent of this child
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Only parents can remove children'
      });
    }

    if (!parent.familyMembers.includes(childId)) {
      return res.status(403).json({
        success: false,
        message: 'Child not found in your family'
      });
    }

    // Remove child from family members
    parent.familyMembers = parent.familyMembers.filter(id => id.toString() !== childId);
    await parent.save();

    // Optionally, you can also delete the child account or mark it as inactive
    // For now, we'll just remove the parent reference
    await User.findByIdAndUpdate(childId, { parent: undefined });

    res.json({
      success: true,
      message: 'Child removed successfully'
    });

  } catch (error) {
    next(error);
  }
};
