import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Payment identification
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: [1, 'Payment amount must be at least Ksh 1']
  },
  
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'USD', 'EUR']
  },
  
  // Payment type and purpose
  type: {
    type: String,
    enum: ['subscription', 'expert_answer', 'withdrawal', 'refund', 'top_up'],
    required: true
  },
  
  purpose: {
    type: String,
    required: true,
    enum: [
      'Basic Plan Subscription',
      'Premium Plan Subscription', 
      'Family Plan Subscription',
      'Expert Answer Payment',
      'Expert Withdrawal',
      'Account Top-up',
      'Refund',
      'Other'
    ]
  },
  
  // Payment method
  method: {
    type: String,
    enum: ['M-Pesa', 'Card', 'Bank Transfer', 'Platform Credit', 'Cash'],
    required: true
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'],
    default: 'pending'
  },
  
  // Parties involved
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Related entities
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  
  // M-Pesa specific fields
  mpesa: {
    phoneNumber: {
      type: String,
      match: [/^(\+254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
    },
    transactionId: String,
    merchantRequestId: String,
    checkoutRequestId: String,
    resultCode: String,
    resultDesc: String,
    amount: Number,
    mpesaReceiptNumber: String,
    transactionDate: Date,
    callbackUrl: String,
    shortCode: String,
    billReference: String
  },
  
  // Card payment fields
  card: {
    last4: String,
    brand: String,
    country: String,
    expMonth: Number,
    expYear: Number,
    fingerprint: String
  },
  
  // Bank transfer fields
  bank: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    reference: String,
    swiftCode: String
  },
  
  // Transaction details
  transaction: {
    id: String,
    reference: String,
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Fees and taxes
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    mpesaFee: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  
  // Payment processing
  processing: {
    initiatedAt: Date,
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    refundedAt: Date,
    processingTime: Number // in milliseconds
  },
  
  // Error handling
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Receipt and confirmation
  receipt: {
    number: String,
    url: String,
    sentAt: Date,
    sentVia: {
      type: String,
      enum: ['email', 'sms', 'both']
    }
  },
  
  // Refund information
  refund: {
    amount: Number,
    reason: String,
    requestedAt: Date,
    processedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed']
    },
    method: String,
    transactionId: String
  },
  
  // Dispute information
  dispute: {
    reason: String,
    raisedAt: Date,
    resolvedAt: Date,
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'closed']
    },
    resolution: String,
    resolutionAmount: Number
  },
  
  // Notifications
  notifications: {
    payerNotified: {
      type: Boolean,
      default: false
    },
    payeeNotified: {
      type: Boolean,
      default: false
    },
    adminNotified: {
      type: Boolean,
      default: false
    }
  },
  
  // Admin notes
  adminNotes: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ payer: 1 });
paymentSchema.index({ payee: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ 'mpesa.transactionId': 1 });
paymentSchema.index({ 'transaction.id': 1 });

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate total fees
  this.fees.totalFees = this.fees.platformFee + this.fees.mpesaFee + this.fees.tax;
  
  // Calculate processing time
  if (this.processing.completedAt && this.processing.initiatedAt) {
    this.processing.processingTime = this.processing.completedAt - this.processing.initiatedAt;
  }
  
  next();
});

// Virtual for net amount (amount after fees)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.fees.totalFees;
});

// Virtual for payment age
paymentSchema.virtual('age').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diff = now - created;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Method to mark as processing
paymentSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processing.processingTime = Date.now();
  this.processing.processedAt = new Date();
};

// Method to mark as completed
paymentSchema.methods.markAsCompleted = function(transactionId = null) {
  this.status = 'completed';
  this.processing.completedAt = new Date();
  
  if (transactionId) {
    this.transaction.id = transactionId;
  }
  
  // Calculate processing time
  if (this.processing.initiatedAt) {
    this.processing.processingTime = this.processing.completedAt - this.processing.initiatedAt;
  }
};

// Method to mark as failed
paymentSchema.methods.markAsFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.processing.failedAt = new Date();
  this.error.code = errorCode;
  this.error.message = errorMessage;
};

// Method to mark as cancelled
paymentSchema.methods.markAsCancelled = function() {
  this.status = 'cancelled';
  this.processing.cancelledAt = new Date();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason, method) {
  this.status = 'refunded';
  this.refund.amount = amount;
  this.refund.reason = reason;
  this.refund.method = method;
  this.refund.requestedAt = new Date();
  this.refund.status = 'pending';
};

// Method to raise dispute
paymentSchema.methods.raiseDispute = function(reason) {
  this.dispute.reason = reason;
  this.dispute.raisedAt = new Date();
  this.dispute.status = 'open';
};

// Method to resolve dispute
paymentSchema.methods.resolveDispute = function(resolution, resolutionAmount) {
  this.dispute.resolution = resolution;
  this.dispute.resolutionAmount = resolutionAmount;
  this.dispute.resolvedAt = new Date();
  this.dispute.status = 'resolved';
};

// Method to update M-Pesa details
paymentSchema.methods.updateMpesaDetails = function(mpesaData) {
  this.mpesa = {
    ...this.mpesa,
    ...mpesaData
  };
  
  if (mpesaData.resultCode === '0') {
    this.status = 'completed';
    this.processing.completedAt = new Date();
  } else {
    this.status = 'failed';
    this.processing.failedAt = new Date();
    this.error.code = mpesaData.resultCode;
    this.error.message = mpesaData.resultDesc;
  }
};

// Static method to generate payment ID
paymentSchema.statics.generatePaymentId = function() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 9);
  return `PAY-${timestamp}-${random}`.toUpperCase();
};

// Static method to calculate platform fee
paymentSchema.statics.calculatePlatformFee = function(amount, type) {
  const feeRates = {
    subscription: 0.05, // 5% for subscriptions
    expert_answer: 0.10, // 10% for expert answers
    withdrawal: 0.02, // 2% for withdrawals
    top_up: 0.01, // 1% for top-ups
    refund: 0, // No fee for refunds
    other: 0.05 // 5% for other payments
  };
  
  const rate = feeRates[type] || feeRates.other;
  return Math.round(amount * rate);
};

// Static method to calculate M-Pesa fee
paymentSchema.statics.calculateMpesaFee = function(amount) {
  // M-Pesa fee structure (approximate)
  if (amount <= 100) return 0;
  if (amount <= 1000) return 10;
  if (amount <= 10000) return 30;
  if (amount <= 100000) return 50;
  return 100;
};

export default mongoose.model('Payment', paymentSchema);
