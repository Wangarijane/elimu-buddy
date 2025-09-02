import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  // Question details
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: [200, 'Question title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Question content is required'],
    trim: true,
    maxlength: [2000, 'Question content cannot exceed 2000 characters']
  },
  
  // Question metadata
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'English', 'Kiswahili', 'Indigenous Language', 'Mathematics',
      'Environmental Activities', 'Religious Education', 'Creative Arts',
      'Physical & Health Education', 'Science & Technology', 'Agriculture & Nutrition',
      'Social Studies', 'Integrated Science', 'Health Education',
      'Pre-Technical & Pre-Career Education', 'Business Studies', 'Agriculture',
      'Life Skills', 'Sports & Physical Education', 'Physics', 'Chemistry',
      'Biology', 'Computer Science', 'History', 'Geography', 'Economics',
      'Literature', 'French', 'German', 'Arabic', 'Music', 'Art', 'Drama'
    ]
  },
  
  grade: {
    type: String,
    required: [true, 'Grade is required'],
    enum: [
      'PP1', 'PP2', // Pre-Primary
      'Grade 1', 'Grade 2', 'Grade 3', // Lower Primary
      'Grade 4', 'Grade 5', 'Grade 6', // Upper Primary
      'Grade 7', 'Grade 8', 'Grade 9', // Junior Secondary
      'Grade 10', 'Grade 11', 'Grade 12' // Senior Secondary
    ]
  },
  
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: [100, 'Topic cannot exceed 100 characters']
  },
  
  subtopic: {
    type: String,
    trim: true,
    maxlength: [100, 'Subtopic cannot exceed 100 characters']
  },
  
  // Question type and complexity
  type: {
    type: String,
    enum: ['concept', 'problem-solving', 'analysis', 'application', 'evaluation'],
    default: 'concept'
  },
  
  complexity: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  
  // Language support
  language: {
    type: String,
    enum: ['English', 'Kiswahili', 'Both'],
    default: 'English'
  },
  
  // Question status and assignment
  status: {
    type: String,
    enum: ['pending', 'assigned', 'answered', 'closed', 'rejected'],
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Assignment details
  assignedTo: {
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    deadline: Date
  },
  
  // Budget and payment
  budget: {
    min: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: [50, 'Minimum budget must be at least Ksh 50']
    },
    max: {
      type: Number,
      required: [true, 'Maximum budget is required'],
      min: [100, 'Maximum budget must be at least Ksh 100']
    },
    currency: {
      type: String,
      default: 'KES'
    }
  },
  
  // Question source and context
  source: {
    type: String,
    enum: ['AI Chat', 'Manual', 'Assignment', 'Exam', 'Homework'],
    default: 'Manual'
  },
  
  context: {
    type: String,
    trim: true,
    maxlength: [500, 'Context cannot exceed 500 characters']
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    url: String,
    fileType: String,
    fileSize: Number
  }],
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Question metrics
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    responseTime: Number, // in minutes
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Timestamps and deadlines
  deadline: {
    type: Date,
    required: [true, 'Question deadline is required']
  },
  
  // Question owner
  askedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Parent information (if student asked)
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // AI response (if applicable)
  aiResponse: {
    content: String,
    generatedAt: Date,
    model: String,
    confidence: Number
  },
  
  // Expert response
  expertResponse: {
    content: String,
    answeredAt: Date,
    expert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  
  // Payment information
  payment: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'disputed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['M-Pesa', 'Card', 'Bank Transfer']
    },
    transactionId: String,
    paidAt: Date
  },
  
  // Moderation
  isModerated: {
    type: Boolean,
    default: false
  },
  
  moderationNotes: String,
  
  // Flags
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  closedAt: Date
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ subject: 1, grade: 1 });
questionSchema.index({ status: 1, priority: 1 });
questionSchema.index({ askedBy: 1 });
questionSchema.index({ assignedTo: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ deadline: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'assignedTo.expert': 1 });

// Virtual for time remaining
questionSchema.virtual('timeRemaining').get(function() {
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

// Virtual for question age
questionSchema.virtual('age').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diff = now - created;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Pre-save middleware to update updatedAt
questionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check if question is overdue
questionSchema.methods.isOverdue = function() {
  return new Date() > new Date(this.deadline);
};

// Method to check if question can be assigned
questionSchema.methods.canBeAssigned = function() {
  return this.status === 'pending' && !this.isOverdue();
};

// Method to assign to expert
questionSchema.methods.assignToExpert = function(expertId, deadline) {
  this.status = 'assigned';
  this.assignedTo.expert = expertId;
  this.assignedTo.assignedAt = new Date();
  this.assignedTo.deadline = deadline || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default
};

// Method to mark as answered
questionSchema.methods.markAsAnswered = function(expertId, content) {
  this.status = 'answered';
  this.expertResponse.content = content;
  this.expertResponse.answeredAt = new Date();
  this.expertResponse.expert = expertId;
};

// Method to calculate response time
questionSchema.methods.calculateResponseTime = function() {
  if (this.expertResponse && this.expertResponse.answeredAt) {
    const responseTime = this.expertResponse.answeredAt - this.createdAt;
    this.metrics.responseTime = Math.floor(responseTime / (1000 * 60)); // Convert to minutes
  }
};

export default mongoose.model('Question', questionSchema);
