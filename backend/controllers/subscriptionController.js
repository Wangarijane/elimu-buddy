import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free Plan',
    price: 0,
    duration: 'monthly',
    features: {
      aiQuestions: 5,
      groupStudyRooms: false,
      priorityExpertMatching: false,
      familyMembers: 1
    },
    limits: {
      dailyAIQuestions: 5,
      monthlyAIQuestions: 150
    }
  },
  basic: {
    name: 'Basic Plan',
    price: 300,
    duration: 'monthly',
    features: {
      aiQuestions: 50,
      groupStudyRooms: true,
      priorityExpertMatching: false,
      familyMembers: 1
    },
    limits: {
      dailyAIQuestions: 50,
      monthlyAIQuestions: 1500
    }
  },
  premium: {
    name: 'Premium Plan',
    price: 500,
    duration: 'monthly',
    features: {
      aiQuestions: -1, // unlimited
      groupStudyRooms: true,
      priorityExpertMatching: true,
      familyMembers: 1
    },
    limits: {
      dailyAIQuestions: -1,
      monthlyAIQuestions: -1
    }
  },
  family: {
    name: 'Family Plan',
    price: 1500,
    duration: 'monthly',
    features: {
      aiQuestions: -1, // unlimited
      groupStudyRooms: true,
      priorityExpertMatching: true,
      familyMembers: 5
    },
    limits: {
      dailyAIQuestions: -1,
      monthlyAIQuestions: -1
    }
  }
};

/**
 * Get subscription plans
 */
export const getSubscriptionPlans = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        plans: SUBSCRIPTION_PLANS
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create subscription
 */
export const createSubscription = async (req, res, next) => {
  try {
    const { planName, paymentMethod, autoRenew = true } = req.body;
    const userId = req.user.id;

    // Validate plan
    if (!SUBSCRIPTION_PLANS[planName]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const plan = SUBSCRIPTION_PLANS[planName];

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'trial'] }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Calculate dates
    const now = new Date();
    const startDate = now;
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      plan: {
        name: planName,
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        limits: plan.limits
      },
      status: 'pending',
      billingCycle: 'monthly',
      startDate,
      endDate,
      autoRenew,
      paymentMethod
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get all subscriptions (admin only)
 */
export const getSubscriptions = async (req, res, next) => {
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
 * Get single subscription
 */
export const getSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id)
      .populate('user', 'profile.firstName profile.lastName email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: { subscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription
 */
export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Remove fields that shouldn't be updated
    delete updateData.user;
    delete updateData.plan;
    delete updateData.startDate;
    delete updateData.endDate;

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription: updatedSubscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete subscription
 */
export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await Subscription.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get current subscription
 */
export const getCurrentPlan = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'trial'] }
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          subscription: null,
          currentPlan: SUBSCRIPTION_PLANS.free
        }
      });
    }

    res.json({
      success: true,
      data: {
        subscription,
        currentPlan: SUBSCRIPTION_PLANS[subscription.plan.name]
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get billing history
 */
export const getBillingHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const payments = await Payment.find({
      payer: userId,
      purpose: 'subscription'
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments({
      payer: userId,
      purpose: 'subscription'
    });

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
 * Process payment
 */
export const processPayment = async (req, res, next) => {
  try {
    const { subscriptionId, paymentMethod, phoneNumber } = req.body;
    const userId = req.user.id;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (subscription.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not pending payment'
      });
    }

    // Create payment record
    const payment = new Payment({
      amount: subscription.plan.price,
      currency: 'KES',
      type: 'incoming',
      purpose: 'subscription',
      method: paymentMethod,
      status: 'pending',
      payer: userId,
      subscription: subscriptionId,
      mpesa: {
        phoneNumber,
        referenceType: 'subscription',
        reference: subscriptionId
      }
    });

    await payment.save();

    // Update subscription with payment reference
    subscription.payment = payment._id;
    await subscription.save();

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: { payment }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'trial'] }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Renew subscription
 */
export const renewSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: 'cancelled'
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No cancelled subscription found'
      });
    }

    // Calculate new dates
    const now = new Date();
    const startDate = now;
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    subscription.status = 'pending';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.cancelledAt = undefined;
    subscription.autoRenew = true;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: { subscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Upgrade subscription
 */
export const upgradeSubscription = async (req, res, next) => {
  try {
    const { newPlanName } = req.body;
    const userId = req.user.id;

    // Validate new plan
    if (!SUBSCRIPTION_PLANS[newPlanName]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const currentSubscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'trial'] }
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanName];

    // Check if it's actually an upgrade
    const currentPlan = SUBSCRIPTION_PLANS[currentSubscription.plan.name];
    if (newPlan.price <= currentPlan.price) {
      return res.status(400).json({
        success: false,
        message: 'New plan must be an upgrade'
      });
    }

    // Create upgrade subscription
    const upgradeSubscription = new Subscription({
      user: userId,
      plan: {
        name: newPlanName,
        price: newPlan.price,
        duration: newPlan.duration,
        features: newPlan.features,
        limits: newPlan.limits
      },
      status: 'pending',
      billingCycle: 'monthly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
      upgradeFrom: currentSubscription._id
    });

    await upgradeSubscription.save();

    res.json({
      success: true,
      message: 'Subscription upgrade initiated',
      data: { subscription: upgradeSubscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Downgrade subscription
 */
export const downgradeSubscription = async (req, res, next) => {
  try {
    const { newPlanName } = req.body;
    const userId = req.user.id;

    // Validate new plan
    if (!SUBSCRIPTION_PLANS[newPlanName]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const currentSubscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'trial'] }
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanName];

    // Check if it's actually a downgrade
    const currentPlan = SUBSCRIPTION_PLANS[currentSubscription.plan.name];
    if (newPlan.price >= currentPlan.price) {
      return res.status(400).json({
        success: false,
        message: 'New plan must be a downgrade'
      });
    }

    // Schedule downgrade for next billing cycle
    currentSubscription.scheduledDowngrade = {
      planName: newPlanName,
      effectiveDate: currentSubscription.endDate
    };
    await currentSubscription.save();

    res.json({
      success: true,
      message: 'Subscription downgrade scheduled',
      data: { subscription: currentSubscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Apply discount
 */
export const applyDiscount = async (req, res, next) => {
  try {
    const { discountCode } = req.body;
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['pending', 'active'] }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    // Validate discount code (implement discount logic)
    const discount = await validateDiscountCode(discountCode);
    if (!discount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount code'
      });
    }

    subscription.discount = {
      code: discountCode,
      percentage: discount.percentage,
      appliedAt: new Date()
    };

    await subscription.save();

    res.json({
      success: true,
      message: 'Discount applied successfully',
      data: { subscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Remove discount
 */
export const removeDiscount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['pending', 'active'] }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No subscription found'
      });
    }

    subscription.discount = undefined;
    await subscription.save();

    res.json({
      success: true,
      message: 'Discount removed successfully',
      data: { subscription }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get family members
 */
export const getFamilyMembers = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('familyMembers');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        familyMembers: user.familyMembers || []
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Add family member
 */
export const addFamilyMember = async (req, res, next) => {
  try {
    const { firstName, lastName, grade, subject, school, dateOfBirth } = req.body;
    const parentId = req.user.id;

    // Verify user has family plan
    const subscription = await Subscription.findOne({
      user: parentId,
      status: { $in: ['active', 'trial'] },
      'plan.name': 'family'
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Family plan required to add family members'
      });
    }

    // Check family member limit
    const currentMembers = await User.countDocuments({ parent: parentId });
    if (currentMembers >= subscription.plan.features.familyMembers) {
      return res.status(400).json({
        success: false,
        message: 'Family member limit reached'
      });
    }

    // Create family member
    const familyMember = new User({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${parentId}@elimubuddy.ke`,
      password: Math.random().toString(36).slice(-8),
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

    await familyMember.save();

    // Add to parent's family members
    if (!user.familyMembers) {
      user.familyMembers = [];
    }
    user.familyMembers.push(familyMember._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Family member added successfully',
      data: { familyMember }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Remove family member
 */
export const removeFamilyMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const parentId = req.user.id;

    const user = await User.findById(parentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from family members
    user.familyMembers = user.familyMembers.filter(id => id.toString() !== memberId);
    await user.save();

    // Remove parent reference from family member
    await User.findByIdAndUpdate(memberId, { parent: undefined });

    res.json({
      success: true,
      message: 'Family member removed successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Transfer subscription
 */
export const transferSubscription = async (req, res, next) => {
  try {
    const { newOwnerId } = req.body;
    const currentOwnerId = req.user.id;

    const subscription = await Subscription.findOne({
      user: currentOwnerId,
      status: { $in: ['active', 'trial'] }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Verify new owner exists
    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: 'New owner not found'
      });
    }

    // Transfer subscription
    subscription.user = newOwnerId;
    subscription.transferredAt = new Date();
    subscription.transferredFrom = currentOwnerId;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription transferred successfully',
      data: { subscription }
    });

  } catch (error) {
    next(error);
  }
};

// Helper functions
async function validateDiscountCode(code) {
  // Implement discount validation logic
  // This is a placeholder implementation
  const validDiscounts = {
    'WELCOME20': { percentage: 20, valid: true },
    'STUDENT15': { percentage: 15, valid: true }
  };

  return validDiscounts[code] || null;
}
