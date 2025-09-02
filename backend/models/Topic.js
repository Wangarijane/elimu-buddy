import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  grades: [{
    type: String,
    enum: ['PP1', 'PP2', 'Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8', 'Grade9', 'Grade10', 'Grade11', 'Grade12'],
    required: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true,
    maxlength: 500
  }],
  keyConcepts: [{
    name: String,
    description: String,
    examples: [String]
  }],
  skills: [{
    name: String,
    description: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    }
  }],
  resources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningResource'
  }],
  assessment: {
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'project', 'presentation', 'test', 'mixed'],
      default: 'mixed'
    },
    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    criteria: [String],
    rubrics: [{
      criterion: String,
      excellent: String,
      good: String,
      satisfactory: String,
      needsImprovement: String
    }]
  },
  prerequisites: [{
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic'
    },
    description: String
  }],
  estimatedDuration: {
    hours: {
      type: Number,
      min: 0,
      default: 1
    },
    weeks: {
      type: Number,
      min: 0,
      default: 1
    }
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  order: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  metadata: {
    tags: [String],
    keywords: [String],
    relatedTopics: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic'
    }],
    externalLinks: [{
      title: String,
      url: String,
      description: String
    }]
  },
  progress: {
    totalStudents: {
      type: Number,
      default: 0
    },
    completedStudents: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
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
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
topicSchema.index({ name: 1 });
topicSchema.index({ grades: 1 });
topicSchema.index({ difficulty: 1 });
topicSchema.index({ status: 1 });
topicSchema.index({ order: 1 });
topicSchema.index({ createdAt: -1 });

// Virtual for resource count
topicSchema.virtual('resourceCount').get(function() {
  return this.resources.length;
});

// Virtual for completion rate
topicSchema.virtual('completionRate').get(function() {
  if (this.progress.totalStudents === 0) return 0;
  return (this.progress.completedStudents / this.progress.totalStudents) * 100;
});

// Virtual for isAvailable
topicSchema.virtual('isAvailable').get(function() {
  return this.status === 'active';
});

// Method to add resource
topicSchema.methods.addResource = function(resourceId) {
  if (!this.resources.includes(resourceId)) {
    this.resources.push(resourceId);
  }
  return this.save();
};

// Method to remove resource
topicSchema.methods.removeResource = function(resourceId) {
  this.resources = this.resources.filter(id => !id.equals(resourceId));
  return this.save();
};

// Method to update progress
topicSchema.methods.updateProgress = function(studentCount, completedCount, averageScore) {
  this.progress.totalStudents = studentCount;
  this.progress.completedStudents = completedCount;
  this.progress.averageScore = averageScore;
  this.progress.successRate = (completedCount / studentCount) * 100;
  return this.save();
};

// Method to get topic summary
topicSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    description: this.description,
    subject: this.subject,
    grades: this.grades,
    difficulty: this.difficulty,
    order: this.order,
    resourceCount: this.resourceCount,
    completionRate: this.completionRate,
    status: this.status,
    estimatedDuration: this.estimatedDuration,
    lastUpdated: this.lastUpdated
  };
};

// Static method to find topics by subject
topicSchema.statics.findBySubject = function(subjectId, options = {}) {
  const { grade = null, difficulty = null, limit = 50, skip = 0, sort = { order: 1 } } = options;
  
  const query = { subject: subjectId, status: 'active' };
  if (grade) query.grades = { $in: [grade] };
  if (difficulty) query.difficulty = difficulty;
  
  return this.find(query)
    .populate('subject', 'name code')
    .populate('resources', 'title type url')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to find topics by grade
topicSchema.statics.findByGrade = function(grade, options = {}) {
  const { subject = null, difficulty = null, limit = 50, skip = 0, sort = { order: 1 } } = options;
  
  const query = { grades: { $in: [grade] }, status: 'active' };
  if (subject) query.subject = subject;
  if (difficulty) query.difficulty = difficulty;
  
  return this.find(query)
    .populate('subject', 'name code')
    .populate('resources', 'title type url')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to search topics
topicSchema.statics.search = function(query, options = {}) {
  const { subject = null, grade = null, limit = 20, skip = 0, sort = { name: 1 } } = options;
  
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } }
    ],
    status: 'active'
  };
  
  if (subject) searchQuery.subject = subject;
  if (grade) searchQuery.grades = { $in: [grade] };
  
  return this.find(searchQuery)
    .populate('subject', 'name code')
    .populate('resources', 'title type url')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get topic statistics
topicSchema.statics.getStats = function(subjectId = null) {
  const matchStage = subjectId ? { subject: new mongoose.Types.ObjectId(subjectId), status: 'active' } : { status: 'active' };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTopics: { $sum: 1 },
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
        averageCompletionRate: { $avg: '$progress.successRate' },
        averageScore: { $avg: '$progress.averageScore' }
      }
    }
  ]);
};

// Pre-save middleware to update lastUpdated
topicSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastUpdated = new Date();
  }
  next();
});

export const Topic = mongoose.model('Topic', topicSchema);
export default Topic;
