import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errorMessages
      }
    });
  }

  next();
};

// User registration validation
export const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phoneNumber')
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .isIn(['parent', 'student', 'expert', 'admin'])
    .withMessage('Invalid role selected'),
  
  body('county')
    .isIn([
      'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta', 'Garissa',
      'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu',
      'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang\'a',
      'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu',
      'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado',
      'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
      'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
    ])
    .withMessage('Please select a valid county'),
  
  handleValidationErrors
];

// Student registration validation
export const validateStudentRegistration = [
  ...validateRegistration,
  
  body('studentInfo.grade')
    .isIn([
      'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
    ])
    .withMessage('Please select a valid grade'),
  
  body('studentInfo.school')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('School name must be between 2 and 100 characters'),
  
  body('studentInfo.subjects')
    .isArray({ min: 1 })
    .withMessage('At least one subject must be selected'),
  
  body('studentInfo.subjects.*')
    .isIn([
      'English', 'Kiswahili', 'Indigenous Language', 'Mathematics',
      'Environmental Activities', 'Religious Education', 'Creative Arts',
      'Physical & Health Education', 'Science & Technology', 'Agriculture & Nutrition',
      'Social Studies', 'Integrated Science', 'Health Education',
      'Pre-Technical & Pre-Career Education', 'Business Studies', 'Agriculture',
      'Life Skills', 'Sports & Physical Education', 'Physics', 'Chemistry',
      'Biology', 'Computer Science', 'History', 'Geography', 'Economics',
      'Literature', 'French', 'German', 'Arabic', 'Music', 'Art', 'Drama'
    ])
    .withMessage('Invalid subject selected'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('gender')
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Please select a valid gender'),
  
  handleValidationErrors
];

// Expert registration validation
export const validateExpertRegistration = [
  ...validateRegistration,
  
  body('expertInfo.specialization')
    .isArray({ min: 1 })
    .withMessage('At least one specialization must be selected'),
  
  body('expertInfo.specialization.*')
    .isIn([
      'English', 'Kiswahili', 'Mathematics', 'Science', 'Social Studies',
      'Religious Education', 'Creative Arts', 'Physical Education',
      'Business Studies', 'Agriculture', 'Computer Science'
    ])
    .withMessage('Invalid specialization selected'),
  
  body('expertInfo.experience')
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be between 0 and 50 years'),
  
  body('expertInfo.hourlyRate')
    .isInt({ min: 100, max: 5000 })
    .withMessage('Hourly rate must be between Ksh 100 and Ksh 5000'),
  
  body('expertInfo.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Question creation validation
export const validateQuestionCreation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Question title must be between 10 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Question content must be between 20 and 2000 characters'),
  
  body('subject')
    .isIn([
      'English', 'Kiswahili', 'Indigenous Language', 'Mathematics',
      'Environmental Activities', 'Religious Education', 'Creative Arts',
      'Physical & Health Education', 'Science & Technology', 'Agriculture & Nutrition',
      'Social Studies', 'Integrated Science', 'Health Education',
      'Pre-Technical & Pre-Career Education', 'Business Studies', 'Agriculture',
      'Life Skills', 'Sports & Physical Education', 'Physics', 'Chemistry',
      'Biology', 'Computer Science', 'History', 'Geography', 'Economics',
      'Literature', 'French', 'German', 'Arabic', 'Music', 'Art', 'Drama'
    ])
    .withMessage('Please select a valid subject'),
  
  body('grade')
    .isIn([
      'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
    ])
    .withMessage('Please select a valid grade'),
  
  body('topic')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Topic must be between 2 and 100 characters'),
  
  body('budget.min')
    .isInt({ min: 50, max: 10000 })
    .withMessage('Minimum budget must be between Ksh 50 and Ksh 10,000'),
  
  body('budget.max')
    .isInt({ min: 100, max: 20000 })
    .withMessage('Maximum budget must be between Ksh 100 and Ksh 20,000')
    .custom((value, { req }) => {
      if (value <= req.body.budget.min) {
        throw new Error('Maximum budget must be greater than minimum budget');
      }
      return true;
    }),
  
  body('deadline')
    .isISO8601()
    .withMessage('Please provide a valid deadline')
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      const minDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      if (deadline <= now) {
        throw new Error('Deadline must be in the future');
      }
      
      if (deadline < minDeadline) {
        throw new Error('Deadline must be at least 2 hours from now');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Answer creation validation
export const validateAnswerCreation = [
  body('content')
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Answer content must be between 50 and 5000 characters'),
  
  body('type')
    .optional()
    .isIn(['text', 'step-by-step', 'explanation', 'solution', 'reference'])
    .withMessage('Invalid answer type'),
  
  body('language')
    .optional()
    .isIn(['English', 'Kiswahili', 'Both'])
    .withMessage('Invalid language selection'),
  
  handleValidationErrors
];

// Payment validation
export const validatePayment = [
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive number'),
  
  body('method')
    .isIn(['M-Pesa', 'Card', 'Bank Transfer', 'Platform Credit'])
    .withMessage('Invalid payment method'),
  
  body('type')
    .isIn(['subscription', 'expert_answer', 'withdrawal', 'refund', 'top_up'])
    .withMessage('Invalid payment type'),
  
  body('purpose')
    .isIn([
      'Basic Plan Subscription', 'Premium Plan Subscription', 'Family Plan Subscription',
      'Expert Answer Payment', 'Expert Withdrawal', 'Account Top-up', 'Refund', 'Other'
    ])
    .withMessage('Invalid payment purpose'),
  
  handleValidationErrors
];

// M-Pesa payment validation
export const validateMpesaPayment = [
  ...validatePayment,
  
  body('mpesa.phoneNumber')
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
  
  handleValidationErrors
];

// Subscription validation
export const validateSubscription = [
  body('plan')
    .isIn(['free', 'basic', 'premium', 'family'])
    .withMessage('Invalid subscription plan'),
  
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('Invalid billing cycle'),
  
  body('autoRenew')
    .optional()
    .isBoolean()
    .withMessage('Auto-renew must be a boolean value'),
  
  handleValidationErrors
];

// User update validation
export const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phoneNumber')
    .optional()
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Please provide a valid Kenyan phone number'),
  
  body('county')
    .optional()
    .isIn([
      'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta', 'Garissa',
      'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu',
      'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga', 'Murang\'a',
      'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu',
      'Elgeyo Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado',
      'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
      'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
    ])
    .withMessage('Please select a valid county'),
  
  handleValidationErrors
];

// Password change validation
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ID parameter validation
export const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort must be either "asc" or "desc"'),
  
  handleValidationErrors
];

// Search validation
export const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  
  query('subject')
    .optional()
    .isIn([
      'English', 'Kiswahili', 'Indigenous Language', 'Mathematics',
      'Environmental Activities', 'Religious Education', 'Creative Arts',
      'Physical & Health Education', 'Science & Technology', 'Agriculture & Nutrition',
      'Social Studies', 'Integrated Science', 'Health Education',
      'Pre-Technical & Pre-Career Education', 'Business Studies', 'Agriculture',
      'Life Skills', 'Sports & Physical Education', 'Physics', 'Chemistry',
      'Biology', 'Computer Science', 'History', 'Geography', 'Economics',
      'Literature', 'French', 'German', 'Arabic', 'Music', 'Art', 'Drama'
    ])
    .withMessage('Invalid subject filter'),
  
  query('grade')
    .optional()
    .isIn([
      'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
    ])
    .withMessage('Invalid grade filter'),
  
  handleValidationErrors
];
