import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system', 'expert'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'audio', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number,
    mimeType: String
  }],
  tokens: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    trim: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: Date,
    reason: String
  }],
  metadata: {
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    responseTime: Number, // For AI responses
    model: String, // AI model used
    temperature: Number, // AI generation parameters
    maxTokens: Number
  },
  flags: {
    isSpam: { type: Boolean, default: false },
    isInappropriate: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportReason: String,
    reportCount: { type: Number, default: 0 }
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  references: [{
    type: {
      type: String,
      enum: ['question', 'answer', 'resource', 'external'],
      required: true
    },
    id: mongoose.Schema.Types.ObjectId,
    title: String,
    url: String,
    description: String
  }],
  aiInsights: {
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    complexity: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    topics: [String],
    keywords: [String],
    learningObjectives: [String],
    suggestedActions: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ role: 1, createdAt: -1 });
messageSchema.index({ 'flags.isReported': 1 });
messageSchema.index({ 'aiInsights.complexity': 1 });
messageSchema.index({ 'aiInsights.sentiment': 1 });

// Virtual for reaction count
messageSchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Virtual for total report count
messageSchema.virtual('totalReportCount').get(function() {
  return this.flags.reportCount;
});

// Method to add reaction
messageSchema.methods.addReaction = function(userId, type) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => !r.userId.equals(userId));
  
  // Add new reaction
  this.reactions.push({ userId, type });
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => !r.userId.equals(userId));
  return this.save();
};

// Method to edit message
messageSchema.methods.edit = function(newContent, reason = 'User edit') {
  // Store edit history
  this.editHistory.push({
    content: this.content,
    editedAt: new Date(),
    reason: 'Previous version'
  });
  
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  
  // Update edit history with reason
  if (this.editHistory.length > 0) {
    this.editHistory[this.editHistory.length - 1].reason = reason;
  }
  
  return this.save();
};

// Method to report message
messageSchema.methods.report = function(reason) {
  this.flags.isReported = true;
  this.flags.reportReason = reason;
  this.flags.reportCount += 1;
  return this.save();
};

// Method to flag as inappropriate
messageSchema.methods.flagInappropriate = function() {
  this.flags.isInappropriate = true;
  return this.save();
};

// Method to calculate cost
messageSchema.methods.calculateCost = function() {
  if (this.tokens > 0) {
    const costPerToken = 0.002 / 1000; // $0.002 per 1K tokens
    this.cost = this.tokens * costPerToken;
  }
  return this.save();
};

// Method to get message summary
messageSchema.methods.getSummary = function() {
  return {
    id: this._id,
    chatId: this.chatId,
    userId: this.userId,
    content: this.content,
    role: this.role,
    messageType: this.messageType,
    tokens: this.tokens,
    cost: this.cost,
    rating: this.rating,
    isEdited: this.isEdited,
    reactionCount: this.reactionCount,
    totalReportCount: this.totalReportCount,
    createdAt: this.createdAt,
    aiInsights: this.aiInsights
  };
};

// Static method to find messages by chat
messageSchema.statics.findByChat = function(chatId, options = {}) {
  const { limit = 50, skip = 0, sort = { createdAt: 1 } } = options;
  
  return this.find({ chatId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'profile.firstName profile.lastName email')
    .populate('reactions.userId', 'profile.firstName profile.lastName');
};

// Static method to find messages by user
messageSchema.statics.findByUser = function(userId, options = {}) {
  const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;
  
  return this.find({ userId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('chatId', 'title subject grade');
};

// Static method to get message statistics
messageSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        totalTokens: { $sum: '$tokens' },
        totalCost: { $sum: '$cost' },
        averageTokensPerMessage: { $avg: '$tokens' },
        userMessages: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } },
        aiMessages: { $sum: { $cond: [{ $eq: ['$role', 'assistant'] }, 1, 0] } }
      }
    }
  ]);
};

// Pre-save middleware to calculate cost
messageSchema.pre('save', function(next) {
  if (this.isModified('tokens') && this.tokens > 0) {
    const costPerToken = 0.002 / 1000;
    this.cost = this.tokens * costPerToken;
  }
  next();
});

export const Message = mongoose.model('Message', messageSchema);
export default Message;
