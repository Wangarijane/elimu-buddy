import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['core', 'optional', 'elective', 'foundation', 'specialized'],
    default: 'core'
  },
  grades: [{
    type: String,
    enum: ['PP1', 'PP2', 'Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6', 'Grade7', 'Grade8', 'Grade9', 'Grade10', 'Grade11', 'Grade12'],
    required: true
  }],
  level: {
    type: String,
    enum: ['foundation', 'intermediate', 'senior'],
    required: true
  },
  objectives: [{
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
  topics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic'
  }],
  resources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningResource'
  }],
  assessment: {
    type: {
      type: String,
      enum: ['continuous', 'periodic', 'final', 'mixed'],
      default: 'continuous'
    },
    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    criteria: [String]
  },
  prerequisites: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    grade: String,
    minimumScore: Number
  }],
  metadata: {
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    estimatedHours: Number,
    creditHours: Number,
    tags: [String],
    keywords: [String]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
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
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
subjectSchema.index({ name: 1 });
subjectSchema.index({ code: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ level: 1 });
subjectSchema.index({ grades: 1 });
subjectSchema.index({ status: 1 });
subjectSchema.index({ 'metadata.difficulty': 1 });
subjectSchema.index({ createdAt: -1 });

// Virtual for topic count
subjectSchema.virtual('topicCount').get(function() {
  return this.topics.length;
});

// Virtual for resource count
subjectSchema.virtual('resourceCount').get(function() {
  return this.resources.length;
});

// Virtual for isAvailable
subjectSchema.virtual('isAvailable').get(function() {
  return this.status === 'active';
});

// Method to add topic
subjectSchema.methods.addTopic = function(topicId) {
  if (!this.topics.includes(topicId)) {
    this.topics.push(topicId);
  }
  return this.save();
};

// Method to remove topic
subjectSchema.methods.removeTopic = function(topicId) {
  this.topics = this.topics.filter(id => !id.equals(topicId));
  return this.save();
};

// Method to add resource
subjectSchema.methods.addResource = function(resourceId) {
  if (!this.resources.includes(resourceId)) {
    this.resources.push(resourceId);
  }
  return this.save();
};

// Method to remove resource
subjectSchema.methods.removeResource = function(resourceId) {
  this.resources = this.resources.filter(id => !id.equals(resourceId));
  return this.save();
};

// Method to update grades
subjectSchema.methods.updateGrades = function(newGrades) {
  this.grades = newGrades;
  this.lastUpdated = new Date();
  return this.save();
};

// Method to get subject summary
subjectSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    description: this.description,
    category: this.category,
    grades: this.grades,
    level: this.level,
    topicCount: this.topicCount,
    resourceCount: this.resourceCount,
    status: this.status,
    metadata: this.metadata,
    lastUpdated: this.lastUpdated
  };
};

// Static method to find subjects by grade
subjectSchema.statics.findByGrade = function(grade) {
  return this.find({ grades: { $in: [grade] }, status: 'active' })
    .populate('topics', 'name description')
    .sort({ name: 1 });
};

// Static method to find subjects by category
subjectSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' })
    .populate('topics', 'name description')
    .sort({ name: 1 });
};

// Static method to find subjects by level
subjectSchema.statics.findByLevel = function(level) {
  return this.find({ level, status: 'active' })
    .populate('topics', 'name description')
    .sort({ name: 1 });
};

// Static method to search subjects
subjectSchema.statics.search = function(query, options = {}) {
  const { limit = 20, skip = 0, sort = { name: 1 } } = options;
  
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { code: { $regex: query, $options: 'i' } }
    ],
    status: 'active'
  };
  
  return this.find(searchQuery)
    .populate('topics', 'name description')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get subject statistics
subjectSchema.statics.getStats = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalSubjects: { $sum: 1 },
        byCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        },
        byLevel: {
          $push: {
            level: '$level',
            count: 1
          }
        },
        byGrade: {
          $push: {
            grade: '$grades',
            count: 1
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to update lastUpdated
subjectSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastUpdated = new Date();
  }
  next();
});

export const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
