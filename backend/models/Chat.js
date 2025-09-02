import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokens: {
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
  }
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  isAI: {
    type: Boolean,
    default: true
  },
  aiModel: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  totalTokens: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    sessionId: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  insights: {
    complexity: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    learningObjectives: [String],
    suggestedTopics: [String],
    difficulty: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chatSchema.index({ userId: 1, status: 1 });
chatSchema.index({ userId: 1, lastActivity: -1 });
chatSchema.index({ subject: 1, grade: 1 });
chatSchema.index({ 'insights.complexity': 1 });
chatSchema.index({ createdAt: -1 });

// Virtual for message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Virtual for chat duration
chatSchema.virtual('duration').get(function() {
  if (this.messages.length < 2) return 0;
  const firstMessage = this.messages[0].timestamp;
  const lastMessage = this.messages[this.messages.length - 1].timestamp;
  return lastMessage - firstMessage;
});

// Method to add message
chatSchema.methods.addMessage = function(content, role, tokens = 0) {
  this.messages.push({
    content,
    role,
    tokens,
    timestamp: new Date()
  });
  this.totalTokens += tokens;
  this.lastActivity = new Date();
  return this.save();
};

// Method to archive chat
chatSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Method to restore chat
chatSchema.methods.restore = function() {
  this.status = 'active';
  return this.save();
};

// Method to delete chat (soft delete)
chatSchema.methods.softDelete = function() {
  this.status = 'deleted';
  return this.save();
};

// Method to calculate cost (assuming $0.002 per 1K tokens)
chatSchema.methods.calculateCost = function() {
  const costPerToken = 0.002 / 1000;
  this.totalCost = this.totalTokens * costPerToken;
  return this.save();
};

// Method to get chat summary
chatSchema.methods.getSummary = function() {
  const userMessages = this.messages.filter(msg => msg.role === 'user');
  const aiMessages = this.messages.filter(msg => msg.role === 'assistant');
  
  return {
    id: this._id,
    title: this.title,
    subject: this.subject,
    grade: this.grade,
    topic: this.topic,
    messageCount: this.messageCount,
    userMessageCount: userMessages.length,
    aiMessageCount: aiMessages.length,
    totalTokens: this.totalTokens,
    totalCost: this.totalCost,
    duration: this.duration,
    lastActivity: this.lastActivity,
    status: this.status,
    insights: this.insights
  };
};

// Static method to find chats by user
chatSchema.statics.findByUser = function(userId, options = {}) {
  const { status = 'active', limit = 20, skip = 0, sort = { lastActivity: -1 } } = options;
  
  return this.find({ userId, status })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'profile.firstName profile.lastName email');
};

// Static method to find chats by subject and grade
chatSchema.statics.findBySubjectAndGrade = function(subject, grade, options = {}) {
  const { limit = 20, skip = 0, sort = { createdAt: -1 } } = options;
  
  return this.find({ subject, grade, status: 'active' })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'profile.firstName profile.lastName');
};

// Static method to get chat statistics
chatSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'active' } },
    {
      $group: {
        _id: null,
        totalChats: { $sum: 1 },
        totalMessages: { $sum: { $size: '$messages' } },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$totalCost' },
        averageMessagesPerChat: { $avg: { $size: '$messages' } },
        averageTokensPerChat: { $avg: '$totalTokens' }
      }
    }
  ]);
};

// Pre-save middleware to update lastActivity
chatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
  }
  next();
});

// Pre-save middleware to calculate cost
chatSchema.pre('save', function(next) {
  if (this.isModified('totalTokens')) {
    const costPerToken = 0.002 / 1000;
    this.totalCost = this.totalTokens * costPerToken;
  }
  next();
});

export const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
