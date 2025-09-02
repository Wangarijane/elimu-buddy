import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  // Answer details
  content: {
    type: String,
    required: [true, 'Answer content is required'],
    trim: true,
    maxlength: [5000, 'Answer content cannot exceed 5000 characters']
  },
  
  // Answer metadata
  type: {
    type: String,
    enum: ['text', 'step-by-step', 'explanation', 'solution', 'reference'],
    default: 'explanation'
  },
  
  language: {
    type: String,
    enum: ['English', 'Kiswahili', 'Both'],
    default: 'English'
  },
  
  // Answer quality indicators
  quality: {
    accuracy: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    clarity: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    completeness: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    }
  },
  
  // Answer status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
    default: 'submitted'
  },
  
  // Question reference
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  
  // Expert who provided the answer
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Student who asked the question
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Parent information
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Answer structure
  structure: {
    introduction: String,
    mainContent: String,
    conclusion: String,
    keyPoints: [String],
    examples: [String],
    references: [String]
  },
  
  // Attachments and media
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    fileType: String,
    fileSize: Number,
    description: String
  }],
  
  // Educational elements
  learningObjectives: [String],
  prerequisites: [String],
  followUpQuestions: [String],
  
  // Answer metrics
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    helpfulVotes: {
      type: Number,
      default: 0
    },
    notHelpfulVotes: {
      type: Number,
      default: 0
    },
    timeSpent: Number, // in minutes
    revisionCount: {
      type: Number,
      default: 0
    }
  },
  
  // Rating and feedback
  rating: {
    studentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    studentFeedback: String,
    parentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    parentFeedback: String,
    adminRating: {
      type: Number,
      min: 1,
      max: 5
    },
    adminFeedback: String
  },
  
  // Payment and compensation
  payment: {
    amount: {
      type: Number,
      required: true,
      min: [50, 'Payment amount must be at least Ksh 50']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'disputed', 'refunded'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['M-Pesa', 'Bank Transfer', 'Platform Credit']
    },
    transactionId: String,
    paidAt: Date,
    disputeReason: String,
    refundReason: String
  },
  
  // Moderation
  moderation: {
    isModerated: {
      type: Boolean,
      default: false
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    moderationNotes: String,
    moderationStatus: {
      type: String,
      enum: ['approved', 'rejected', 'needs_revision'],
      default: 'approved'
    }
  },
  
  // Revision history
  revisions: [{
    content: String,
    revisedAt: Date,
    reason: String,
    revisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Flags
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  reviewedAt: Date,
  
  approvedAt: Date,
  
  // Answer deadline
  deadline: {
    type: Date,
    required: true
  },
  
  // Response time tracking
  responseTime: {
    type: Number, // in minutes
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
answerSchema.index({ question: 1 });
answerSchema.index({ expert: 1 });
answerSchema.index({ student: 1 });
answerSchema.index({ status: 1 });
answerSchema.index({ submittedAt: -1 });
answerSchema.index({ 'payment.status': 1 });
answerSchema.index({ 'moderation.isModerated': 1 });

// Virtual for overall rating
answerSchema.virtual('overallRating').get(function() {
  const ratings = [];
  
  if (this.rating.studentRating) ratings.push(this.rating.studentRating);
  if (this.rating.parentRating) ratings.push(this.rating.parentRating);
  if (this.rating.adminRating) ratings.push(this.rating.adminRating);
  
  if (ratings.length === 0) return 0;
  
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual for answer age
answerSchema.virtual('age').get(function() {
  const now = new Date();
  const submitted = new Date(this.submittedAt);
  const diff = now - submitted;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Virtual for time remaining
answerSchema.virtual('timeRemaining').get(function() {
  if (!this.deadline) return null;
  
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diff = deadline - now;
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
});

// Pre-save middleware
answerSchema.pre('save', function(next) {
  // Calculate response time if this is a new answer
  if (this.isNew && this.question) {
    // This will be populated when the answer is saved
    next();
  } else {
    next();
  }
});

// Method to calculate response time
answerSchema.methods.calculateResponseTime = async function() {
  try {
    const Question = mongoose.model('Question');
    const question = await Question.findById(this.question);
    
    if (question) {
      const responseTime = this.submittedAt - question.createdAt;
      this.responseTime = Math.floor(responseTime / (1000 * 60)); // Convert to minutes
      await this.save();
    }
  } catch (error) {
    console.error('Error calculating response time:', error);
  }
};

// Method to mark as reviewed
answerSchema.methods.markAsReviewed = function(moderatorId, status, notes) {
  this.moderation.isModerated = true;
  this.moderation.moderatedBy = moderatorId;
  this.moderation.moderatedAt = new Date();
  this.moderation.moderationStatus = status;
  this.moderation.moderationNotes = notes;
  this.reviewedAt = new Date();
  
  if (status === 'approved') {
    this.status = 'approved';
    this.approvedAt = new Date();
  } else if (status === 'rejected') {
    this.status = 'rejected';
  }
};

// Method to add revision
answerSchema.methods.addRevision = function(content, reason, revisedById) {
  this.revisions.push({
    content: this.content,
    revisedAt: new Date(),
    reason: reason,
    revisedBy: revisedById
  });
  
  this.content = content;
  this.metrics.revisionCount += 1;
};

// Method to calculate payment amount based on complexity and response time
answerSchema.methods.calculatePaymentAmount = function() {
  let baseAmount = 100; // Base payment Ksh 100
  
  // Add complexity bonus
  const complexityBonus = {
    'easy': 0,
    'medium': 50,
    'hard': 100,
    'expert': 200
  };
  
  // Add response time bonus (faster responses get bonus)
  let timeBonus = 0;
  if (this.responseTime <= 60) { // Within 1 hour
    timeBonus = 50;
  } else if (this.responseTime <= 240) { // Within 4 hours
    timeBonus = 25;
  }
  
  // Add quality bonus
  const qualityBonus = Math.floor(this.quality.accuracy + this.quality.clarity + this.quality.completeness) * 10;
  
  return baseAmount + complexityBonus[this.question?.complexity || 'medium'] + timeBonus + qualityBonus;
};

// Method to mark as paid
answerSchema.methods.markAsPaid = function(transactionId, method) {
  this.payment.status = 'paid';
  this.payment.transactionId = transactionId;
  this.payment.method = method;
  this.payment.paidAt = new Date();
};

export default mongoose.model('Answer', answerSchema);
