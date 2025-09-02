import mongoose from 'mongoose';

const curriculumSchema = new mongoose.Schema({
  // Curriculum identification
  grade: {
    type: String,
    required: true,
    enum: [
      'PP1', 'PP2', // Pre-Primary
      'Grade 1', 'Grade 2', 'Grade 3', // Lower Primary
      'Grade 4', 'Grade 5', 'Grade 6', // Upper Primary
      'Grade 7', 'Grade 8', 'Grade 9', // Junior Secondary
      'Grade 10', 'Grade 11', 'Grade 12' // Senior Secondary
    ]
  },
  
  level: {
    type: String,
    required: true,
    enum: ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary']
  },
  
  // Subject information
  subject: {
    type: String,
    required: true,
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
  
  // Pathway (for Senior Secondary)
  pathway: {
    type: String,
    enum: ['STEM', 'Social Sciences', 'Arts/Sports', 'General'],
    default: 'General'
  },
  
  // Learning areas and strands
  learningAreas: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    strands: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      learningOutcomes: [{
        code: String,
        description: String,
        indicators: [String]
      }],
      suggestedLearningActivities: [String],
      assessmentMethods: [String],
      resources: [String]
    }]
  }],
  
  // Topics and subtopics
  topics: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    subtopics: [{
      name: String,
      description: String,
      learningObjectives: [String],
      keyConcepts: [String],
      examples: [String],
      activities: [String],
      assessment: [String]
    }],
    duration: {
      type: Number, // in weeks
      min: 1
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    }
  }],
  
  // Learning resources
  resources: {
    textbooks: [{
      title: String,
      author: String,
      publisher: String,
      year: Number,
      isbn: String,
      url: String,
      description: String
    }],
    digitalResources: [{
      title: String,
      type: {
        type: String,
        enum: ['video', 'audio', 'interactive', 'document', 'website']
      },
      url: String,
      description: String,
      duration: Number, // in minutes
      isFree: {
        type: Boolean,
        default: true
      }
    }],
    practicalMaterials: [{
      name: String,
      description: String,
      quantity: String,
      cost: Number,
      supplier: String
    }]
  },
  
  // Assessment framework
  assessment: {
    methods: [{
      type: {
        type: String,
        enum: ['formative', 'summative', 'diagnostic', 'self-assessment', 'peer-assessment']
      },
      description: String,
      tools: [String],
      frequency: String,
      weight: Number // percentage
    }],
    rubrics: [{
      name: String,
      criteria: [{
        name: String,
        description: String,
        levels: [{
          level: String,
          description: String,
          score: Number
        }]
      }]
    }]
  },
  
  // Competency-based approach
  competencies: [{
    name: String,
    description: String,
    levels: [{
      level: String,
      description: String,
      indicators: [String]
    }]
  }],
  
  // Integration with other subjects
  crossCurricularLinks: [{
    subject: String,
    description: String,
    activities: [String]
  }],
  
  // Values and attitudes
  values: [{
    name: String,
    description: String,
    howToPromote: [String]
  }],
  
  // Parental involvement
  parentalInvolvement: {
    activities: [String],
    resources: [String],
    communication: [String]
  },
  
  // Special needs considerations
  specialNeeds: {
    adaptations: [String],
    resources: [String],
    strategies: [String]
  },
  
  // Technology integration
  technologyIntegration: {
    tools: [String],
    activities: [String],
    skills: [String]
  },
  
  // Environmental education
  environmentalEducation: {
    themes: [String],
    activities: [String],
    projects: [String]
  },
  
  // Career guidance
  careerGuidance: {
    careers: [String],
    skills: [String],
    activities: [String]
  },
  
  // Learning outcomes
  learningOutcomes: [{
    code: String,
    description: String,
    grade: String,
    subject: String,
    strand: String,
    assessment: String
  }],
  
  // Sample questions and activities
  sampleQuestions: [{
    type: {
      type: String,
      enum: ['multiple_choice', 'short_answer', 'essay', 'practical', 'project']
    },
    question: String,
    answer: String,
    explanation: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    tags: [String]
  }],
  
  // Projects and assignments
  projects: [{
    title: String,
    description: String,
    objectives: [String],
    duration: String,
    materials: [String],
    assessment: String,
    examples: [String]
  }],
  
  // Field trips and excursions
  fieldTrips: [{
    destination: String,
    purpose: String,
      objectives: [String],
      activities: [String],
      duration: String,
      cost: Number,
      safety: [String]
  }],
  
  // Community service
  communityService: {
    projects: [String],
    objectives: [String],
    benefits: [String]
  },
  
  // Meta information
  academicYear: {
    type: String,
    required: true
  },
  
  version: {
    type: String,
    default: '1.0'
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  stats: {
    topicsCount: {
      type: Number,
      default: 0
    },
    resourcesCount: {
      type: Number,
      default: 0
    },
    questionsCount: {
      type: Number,
      default: 0
    },
    lastAccessed: Date
  }
}, {
  timestamps: true
});

// Indexes
curriculumSchema.index({ grade: 1, subject: 1 });
curriculumSchema.index({ level: 1 });
curriculumSchema.index({ pathway: 1 });
curriculumSchema.index({ 'topics.name': 1 });
curriculumSchema.index({ 'learningOutcomes.code': 1 });
curriculumSchema.index({ academicYear: 1 });
curriculumSchema.index({ isActive: 1 });

// Virtual for full subject name
curriculumSchema.virtual('fullSubjectName').get(function() {
  if (this.pathway && this.pathway !== 'General') {
    return `${this.subject} (${this.pathway})`;
  }
  return this.subject;
});

// Virtual for curriculum age
curriculumSchema.virtual('age').get(function() {
  const now = new Date();
  const updated = new Date(this.lastUpdated);
  const diff = now - updated;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  return 'Just updated';
});

// Pre-save middleware
curriculumSchema.pre('save', function(next) {
  // Update stats
  this.stats.topicsCount = this.topics.length;
  this.stats.resourcesCount = (this.resources.textbooks?.length || 0) + 
                              (this.resources.digitalResources?.length || 0) + 
                              (this.resources.practicalMaterials?.length || 0);
  this.stats.questionsCount = this.sampleQuestions.length;
  
  // Update last updated
  this.lastUpdated = new Date();
  
  next();
});

// Method to get topic by name
curriculumSchema.methods.getTopicByName = function(topicName) {
  return this.topics.find(topic => 
    topic.name.toLowerCase() === topicName.toLowerCase()
  );
};

// Method to get subtopic by name
curriculumSchema.methods.getSubtopicByName = function(topicName, subtopicName) {
  const topic = this.getTopicByName(topicName);
  if (topic) {
    return topic.subtopics.find(subtopic => 
      subtopic.name.toLowerCase() === subtopicName.toLowerCase()
    );
  }
  return null;
};

// Method to search learning outcomes
curriculumSchema.methods.searchLearningOutcomes = function(searchTerm) {
  const term = searchTerm.toLowerCase();
  return this.learningOutcomes.filter(outcome => 
    outcome.description.toLowerCase().includes(term) ||
    outcome.code.toLowerCase().includes(term)
  );
};

// Method to get resources by type
curriculumSchema.methods.getResourcesByType = function(type) {
  switch (type) {
    case 'textbooks':
      return this.resources.textbooks || [];
    case 'digital':
      return this.resources.digitalResources || [];
    case 'practical':
      return this.resources.practicalMaterials || [];
    default:
      return [];
  }
};

// Method to add sample question
curriculumSchema.methods.addSampleQuestion = function(questionData) {
  this.sampleQuestions.push(questionData);
  this.stats.questionsCount = this.sampleQuestions.length;
};

// Method to update access stats
curriculumSchema.methods.updateAccessStats = function() {
  this.stats.lastAccessed = new Date();
};

// Static method to get curriculum by grade and subject
curriculumSchema.statics.findByGradeAndSubject = function(grade, subject) {
  return this.findOne({ grade, subject, isActive: true });
};

// Static method to get all subjects for a grade
curriculumSchema.statics.getSubjectsByGrade = function(grade) {
  return this.distinct('subject', { grade, isActive: true });
};

// Static method to get all grades
curriculumSchema.statics.getAllGrades = function() {
  return this.distinct('grade', { isActive: true }).sort();
};

// Static method to search curriculum
curriculumSchema.statics.searchCurriculum = function(searchTerm, filters = {}) {
  const searchQuery = {
    $and: [
      { isActive: true },
      {
        $or: [
          { subject: { $regex: searchTerm, $options: 'i' } },
          { 'topics.name': { $regex: searchTerm, $options: 'i' } },
          { 'topics.subtopics.name': { $regex: searchTerm, $options: 'i' } },
          { 'learningOutcomes.description': { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  };
  
  // Add filters
  if (filters.grade) searchQuery.$and.push({ grade: filters.grade });
  if (filters.level) searchQuery.$and.push({ level: filters.level });
  if (filters.pathway) searchQuery.$and.push({ pathway: filters.pathway });
  
  return this.find(searchQuery);
};

export default mongoose.model('Curriculum', curriculumSchema);
