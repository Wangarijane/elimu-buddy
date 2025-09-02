import mongoose from 'mongoose';

const learningResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: [
      'video',
      'audio',
      'document',
      'image',
      'interactive',
      'quiz',
      'worksheet',
      'presentation',
      'simulation',
      'game',
      'link',
      'other'
    ],
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: String, // For uploaded files
  thumbnail: String, // Thumbnail image URL
  duration: Number, // For video/audio in seconds
  fileSize: Number, // File size in bytes
  mimeType: String, // MIME type for files
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'sw', 'other']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  grades: [{
    type: String,
    enum: ['PP1', 'PP2', 'Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8', 'Grade9', 'Grade10', 'Grade11', 'Grade12'],
    required: true
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  learningObjectives: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  skills: [{
    name: String,
    description: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  keywords: [{
    type: String,
    trim: true
  }],
  accessibility: {
    hasCaptions: { type: Boolean, default: false },
    hasAudioDescription: { type: Boolean, default: false },
    hasTranscript: { type: Boolean, default: false },
    isScreenReaderFriendly: { type: Boolean, default: false },
    hasHighContrast: { type: Boolean, default: false }
  },
  quality: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    },
    lastReviewed: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  usage: {
    viewCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    favoriteCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  metadata: {
    author: String,
    publisher: String,
    publicationDate: Date,
    version: String,
    license: String,
    copyright: String,
    source: String,
    externalId: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived', 'pending_review'],
    default: 'active'
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  notes: String,
  flags: {
    isInappropriate: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    reportReason: String,
    reportCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
learningResourceSchema.index({ title: 1 });
learningResourceSchema.index({ type: 1 });
learningResourceSchema.index({ topics: 1 });
learningResourceSchema.index({ grades: 1 });
learningResourceSchema.index({ difficulty: 1 });
learningResourceSchema.index({ status: 1 });
learningResourceSchema.index({ 'quality.rating': -1 });
learningResourceSchema.index({ 'usage.viewCount': -1 });
learningResourceSchema.index({ createdAt: -1 });

// Virtual for average rating
learningResourceSchema.virtual('averageRating').get(function() {
  if (this.quality.reviewCount === 0) return 0;
  return this.quality.rating;
});

// Virtual for total usage
learningResourceSchema.virtual('totalUsage').get(function() {
  return this.usage.viewCount + this.usage.downloadCount;
});

// Virtual for isAvailable
learningResourceSchema.virtual('isAvailable').get(function() {
  return this.status === 'active';
});

// Method to increment view count
learningResourceSchema.methods.incrementViewCount = function() {
  this.usage.viewCount += 1;
  return this.save();
};

// Method to increment download count
learningResourceSchema.methods.incrementDownloadCount = function() {
  this.usage.downloadCount += 1;
  return this.save();
};

// Method to add rating
learningResourceSchema.methods.addRating = function(rating, userId) {
  // Simple average rating calculation
  const totalRating = this.quality.rating * this.quality.reviewCount + rating;
  this.quality.reviewCount += 1;
  this.quality.rating = totalRating / this.quality.reviewCount;
  this.quality.lastReviewed = new Date();
  this.quality.reviewedBy = userId;
  return this.save();
};

// Method to add topic
learningResourceSchema.methods.addTopic = function(topicId) {
  if (!this.topics.includes(topicId)) {
    this.topics.push(topicId);
  }
  return this.save();
};

// Method to remove topic
learningResourceSchema.methods.removeTopic = function(topicId) {
  this.topics = this.topics.filter(id => !id.equals(topicId));
  return this.save();
};

// Method to update usage statistics
learningResourceSchema.methods.updateUsageStats = function(viewCount, downloadCount, completionRate) {
  this.usage.viewCount = viewCount;
  this.usage.downloadCount = downloadCount;
  this.usage.completionRate = completionRate;
  return this.save();
};

// Method to get resource summary
learningResourceSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    type: this.type,
    url: this.url,
    thumbnail: this.thumbnail,
    duration: this.duration,
    subject: this.subject,
    topics: this.topics,
    grades: this.grades,
    difficulty: this.difficulty,
    averageRating: this.averageRating,
    totalUsage: this.totalUsage,
    status: this.status,
    lastUpdated: this.lastUpdated
  };
};

// Static method to find resources by subject
learningResourceSchema.statics.findBySubject = function(subjectId, options = {}) {
  const { type = null, grade = null, difficulty = null, limit = 50, skip = 0, sort = { 'quality.rating': -1 } } = options;
  
  const query = { subject: subjectId, status: 'active' };
  if (type) query.type = type;
  if (grade) query.grades = { $in: [grade] };
  if (difficulty) query.difficulty = difficulty;
  
  return this.find(query)
    .populate('subject', 'name code')
    .populate('topics', 'name description')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to find resources by topic
learningResourceSchema.statics.findByTopic = function(topicId, options = {}) {
  const { type = null, grade = null, difficulty = null, limit = 50, skip = 0, sort = { 'quality.rating': -1 } } = options;
  
  const query = { topics: topicId, status: 'active' };
  if (type) query.type = type;
  if (grade) query.grades = { $in: [grade] };
  if (difficulty) query.difficulty = difficulty;
  
  return this.find(query)
    .populate('subject', 'name code')
    .populate('topics', 'name description')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to search resources
learningResourceSchema.statics.search = function(query, options = {}) {
  const { subject = null, topic = null, type = null, grade = null, limit = 20, skip = 0, sort = { 'quality.rating': -1 } } = options;
  
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { keywords: { $in: [new RegExp(query, 'i')] } }
    ],
    status: 'active'
  };
  
  if (subject) searchQuery.subject = subject;
  if (topic) searchQuery.topics = topic;
  if (type) searchQuery.type = type;
  if (grade) searchQuery.grades = { $in: [grade] };
  
  return this.find(searchQuery)
    .populate('subject', 'name code')
    .populate('topics', 'name description')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get popular resources
learningResourceSchema.statics.getPopular = function(options = {}) {
  const { subject = null, type = null, grade = null, limit = 20, skip = 0 } = options;
  
  const query = { status: 'active' };
  if (subject) query.subject = subject;
  if (type) query.type = type;
  if (grade) query.grades = { $in: [grade] };
  
  return this.find(query)
    .populate('subject', 'name code')
    .populate('topics', 'name description')
    .sort({ 'usage.viewCount': -1, 'quality.rating': -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get resource statistics
learningResourceSchema.statics.getStats = function(subjectId = null) {
  const matchStage = subjectId ? { subject: new mongoose.Types.ObjectId(subjectId), status: 'active' } : { status: 'active' };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalResources: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byDifficulty: {
          $push: {
            difficulty: '$difficulty',
            count: 1
          }
        },
        byGrade: {
          $push: {
            grade: '$grades',
            count: 1
          }
        },
        averageRating: { $avg: '$quality.rating' },
        totalViews: { $sum: '$usage.viewCount' },
        totalDownloads: { $sum: '$usage.downloadCount' }
      }
    }
  ]);
};

// Pre-save middleware to update lastUpdated
learningResourceSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastUpdated = new Date();
  }
  next();
});

export const LearningResource = mongoose.model('LearningResource', learningResourceSchema);
export default LearningResource;
