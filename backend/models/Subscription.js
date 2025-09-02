import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  // Subscription details
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'family'],
    required: true
  },
  
  // Plan details
  planDetails: {
    name: {
      type: String,
      required: true
    },
    description: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    },
    duration: {
      type: Number, // in days
      required: true
    },
    features: [{
      name: String,
      description: String,
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    limits: {
      aiQuestionsPerDay: {
        type: Number,
        default: 5
      },
      expertQuestionsPerMonth: {
        type: Number,
        default: 0
      },
      groupStudyRooms: {
        type: Number,
        default: 0
      },
      prioritySupport: {
        type: Boolean,
        default: false
      },
      familyMembers: {
        type: Number,
        default: 1
      }
    }
  },
  
  // Subscription status
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },
  
  // Billing cycle
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  
  // Dates
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    required: true
  },
  
  nextBillingDate: {
    type: Date
  },
  
  trialEndDate: Date,
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['M-Pesa', 'Card', 'Bank Transfer', 'Platform Credit'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
      default: 'pending'
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'KES'
    },
    transactionId: String,
    mpesaTransactionId: String,
    stripePaymentIntentId: String,
    paidAt: Date,
    nextPaymentDate: Date
  },
  
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: false
  },
  
  autoRenewSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    method: {
      type: String,
      enum: ['M-Pesa', 'Card', 'Bank Transfer']
    },
    nextRenewalDate: Date,
    renewalAmount: Number
  },
  
  // Family plan specific
  familyMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: ['child', 'spouse', 'sibling', 'other']
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Usage tracking
  usage: {
    aiQuestionsUsed: {
      type: Number,
      default: 0
    },
    expertQuestionsUsed: {
      type: Number,
      default: 0
    },
    groupStudySessions: {
      type: Number,
      default: 0
    },
    lastUsageDate: Date
  },
  
  // Discounts and promotions
  discounts: [{
    code: String,
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_trial']
    },
    value: Number,
    description: String,
    validFrom: Date,
    validTo: Date,
    isApplied: {
      type: Boolean,
      default: false
    }
  }],
  
  // Cancellation
  cancellation: {
    requestedAt: Date,
    reason: String,
    effectiveDate: Date,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed', 'denied']
    }
  },
  
  // Notifications
  notifications: {
    renewalReminder: {
      type: Boolean,
      default: true
    },
    paymentFailure: {
      type: Boolean,
      default: true
    },
    usageAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  // Admin notes
  adminNotes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ 'payment.status': 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end - now;
  
  if (diff <= 0) return 0;
  
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is active
subscriptionSchema.virtual('isActive').get(function() {
  if (this.status !== 'active') return false;
  
  const now = new Date();
  const end = new Date(this.endDate);
  
  return now <= end;
});

// Virtual for is in trial
subscriptionSchema.virtual('isInTrial').get(function() {
  if (!this.trialEndDate) return false;
  
  const now = new Date();
  const trialEnd = new Date(this.trialEndDate);
  
  return now <= trialEnd;
});

// Pre-save middleware
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set end date if not provided
  if (!this.endDate && this.planDetails.duration) {
    this.endDate = new Date(this.startDate.getTime() + (this.planDetails.duration * 24 * 60 * 60 * 1000));
  }
  
  // Set next billing date
  if (this.billingCycle && this.endDate) {
    this.nextBillingDate = new Date(this.endDate);
  }
  
  next();
});

// Method to check if user can use feature
subscriptionSchema.methods.canUseFeature = function(featureName) {
  if (!this.isActive) return false;
  
  const limits = this.planDetails.limits;
  
  switch (featureName) {
    case 'aiQuestions':
      return this.usage.aiQuestionsUsed < limits.aiQuestionsPerDay;
    case 'expertQuestions':
      return this.usage.expertQuestionsUsed < limits.expertQuestionsPerMonth;
    case 'groupStudy':
      return this.usage.groupStudySessions < limits.groupStudyRooms;
    case 'prioritySupport':
      return limits.prioritySupport;
    default:
      return false;
  }
};

// Method to increment usage
subscriptionSchema.methods.incrementUsage = function(featureName) {
  switch (featureName) {
    case 'aiQuestions':
      this.usage.aiQuestionsUsed += 1;
      break;
    case 'expertQuestions':
      this.usage.expertQuestionsUsed += 1;
      break;
    case 'groupStudy':
      this.usage.groupStudySessions += 1;
      break;
  }
  
  this.usage.lastUsageDate = new Date();
};

// Method to reset daily usage
subscriptionSchema.methods.resetDailyUsage = function() {
  this.usage.aiQuestionsUsed = 0;
  this.usage.lastUsageDate = new Date();
};

// Method to add family member
subscriptionSchema.methods.addFamilyMember = function(userId, relationship) {
  if (this.plan !== 'family') {
    throw new Error('Only family plans can add family members');
  }
  
  const currentMembers = this.familyMembers.filter(member => member.isActive).length;
  const maxMembers = this.planDetails.limits.familyMembers;
  
  if (currentMembers >= maxMembers) {
    throw new Error(`Family plan limit reached (${maxMembers} members)`);
  }
  
  this.familyMembers.push({
    user: userId,
    relationship: relationship,
    addedAt: new Date(),
    isActive: true
  });
};

// Method to remove family member
subscriptionSchema.methods.removeFamilyMember = function(userId) {
  const member = this.familyMembers.find(m => m.user.toString() === userId.toString());
  if (member) {
    member.isActive = false;
  }
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = function(reason, effectiveDate) {
  this.status = 'cancelled';
  this.cancellation.requestedAt = new Date();
  this.cancellation.reason = reason;
  this.cancellation.effectiveDate = effectiveDate || this.endDate;
  this.autoRenew = false;
};

// Method to renew subscription
subscriptionSchema.methods.renew = function() {
  if (this.status !== 'active') {
    throw new Error('Cannot renew inactive subscription');
  }
  
  const newStartDate = new Date(this.endDate);
  const newEndDate = new Date(newStartDate.getTime() + (this.planDetails.duration * 24 * 60 * 60 * 1000));
  
  this.startDate = newStartDate;
  this.endDate = newEndDate;
  this.nextBillingDate = newEndDate;
  
  // Reset usage for new period
  this.usage.expertQuestionsUsed = 0;
  this.usage.groupStudySessions = 0;
};

// Static method to get plan details
subscriptionSchema.statics.getPlanDetails = function(planName) {
  const plans = {
    free: {
      name: 'Free Plan',
      description: 'Basic access with limited AI questions',
      price: 0,
      duration: 30,
      features: [
        { name: 'AI Questions', description: 'Up to 5 questions per day' },
        { name: 'Basic Support', description: 'Community support' }
      ],
      limits: {
        aiQuestionsPerDay: 5,
        expertQuestionsPerMonth: 0,
        groupStudyRooms: 0,
        prioritySupport: false,
        familyMembers: 1
      }
    },
    basic: {
      name: 'Basic Plan',
      description: 'Enhanced learning with more AI questions and group study',
      price: 300,
      duration: 30,
      features: [
        { name: 'AI Questions', description: 'Up to 50 questions per day' },
        { name: 'Group Study Rooms', description: 'Access to study groups' },
        { name: 'Email Support', description: 'Priority email support' }
      ],
      limits: {
        aiQuestionsPerDay: 50,
        expertQuestionsPerMonth: 2,
        groupStudyRooms: 5,
        prioritySupport: false,
        familyMembers: 1
      }
    },
    premium: {
      name: 'Premium Plan',
      description: 'Unlimited AI questions with priority expert matching',
      price: 500,
      duration: 30,
      features: [
        { name: 'Unlimited AI Questions', description: 'No daily limits' },
        { name: 'Priority Expert Matching', description: 'Faster expert responses' },
        { name: 'Priority Support', description: '24/7 priority support' },
        { name: 'Advanced Analytics', description: 'Learning progress tracking' }
      ],
      limits: {
        aiQuestionsPerDay: 999999,
        expertQuestionsPerMonth: 10,
        groupStudyRooms: 20,
        prioritySupport: true,
        familyMembers: 1
      }
    },
    family: {
      name: 'Family Plan',
      description: 'Up to 5 learners with all premium features',
      price: 1500,
      duration: 30,
      features: [
        { name: 'Up to 5 Learners', description: 'Perfect for families' },
        { name: 'All Premium Features', description: 'Everything in premium plan' },
        { name: 'Family Dashboard', description: 'Track all learners progress' },
        { name: 'Family Support', description: 'Dedicated family support' }
      ],
      limits: {
        aiQuestionsPerDay: 999999,
        expertQuestionsPerMonth: 50,
        groupStudyRooms: 100,
        prioritySupport: true,
        familyMembers: 5
      }
    }
  };
  
  return plans[planName] || plans.free;
};

export default mongoose.model('Subscription', subscriptionSchema);
