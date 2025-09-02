import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  
  // Role and Profile
  role: {
    type: String,
    enum: ['parent', 'student', 'expert', 'admin'],
    default: 'parent',
    required: true
  },
  
  // Student-specific fields
  studentInfo: {
    grade: {
      type: String,
      enum: [
        'PP1 (Miaka 4)', 'PP2 (Miaka 5)', 'Daraja 1 (Miaka 6)', 'Daraja 2 (Miaka 7)', 
        'Daraja 3 (Miaka 8)', 'Daraja 4 (Miaka 9)', 'Daraja 5 (Miaka 10)', 'Daraja 6 (Miaka 11)', 
        'Daraja 7 (Miaka 12)', 'Daraja 8 (Miaka 13)', 'Daraja 9 (Miaka 14)', 'Daraja 10 (Miaka 15)', 
        'Daraja 11 (Miaka 16)', 'Daraja 12 (Miaka 17)'
      ]
    },
    school: {
      type: String,
      trim: true
    },
    subjects: [
      {
        type: String,
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
      }
    ]
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  lastLogin: Date,
  lastActivity: Date
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    console.log("Password not modified, skipping hash for:", this.email);
    return next();
  }
  
  try {
    console.log("Hashing password for:", this.email);
    const salt = await bcrypt.genSalt(12);
    console.log("Generated salt:", salt);
    const hashed = await bcrypt.hash(this.password, salt);
    console.log("Plain password:", this.password);
    console.log("Hashed password:", hashed);
    this.password = hashed;
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log("Comparing passwords...");
  console.log("Candidate:", candidatePassword);
  console.log("Stored hash:", this.password);
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log("Password match result:", result);
  return result;
};

export default mongoose.model('User', userSchema);
