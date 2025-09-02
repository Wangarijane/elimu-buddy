import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'question_answered',
      'answer_rated',
      'expert_approved',
      'expert_rejected',
      'payment_successful',
      'payment_failed',
      'subscription_expiring',
      'subscription_renewed',
      'chat_message',
      'system_announcement',
      'curriculum_update',
      'achievement_unlocked',
      'friend_request',
      'expert_connection',
      'reminder',
      'custom'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    default: ['in_app']
  }],
  status: {
    type: String,
    enum: ['unread', 'read', 'archived', 'deleted'],
    default: 'unread'
  },
  readAt: Date,
  archivedAt: Date,
  deletedAt: Date,
  metadata: {
    relatedId: mongoose.Schema.Types.ObjectId, // ID of related entity (question, answer, etc.)
    relatedType: String, // Type of related entity
    actionUrl: String, // URL to navigate to when notification is clicked
    imageUrl: String, // Optional image for the notification
    badge: String, // Badge text (e.g., "New", "Hot")
    category: String, // Category for grouping notifications
    tags: [String] // Tags for filtering
  },
  delivery: {
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date,
      bounced: { type: Boolean, default: false },
      bounceReason: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      failed: { type: Boolean, default: false },
      failureReason: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date
    }
  },
  scheduling: {
    sendAt: Date, // When to send the notification
    expiresAt: Date, // When the notification expires
    repeat: {
      enabled: { type: Boolean, default: false },
      interval: String, // daily, weekly, monthly
      maxOccurrences: Number,
      occurrences: { type: Number, default: 0 }
    }
  },
  analytics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }
  },
  userPreferences: {
    muted: { type: Boolean, default: false },
    mutedUntil: Date,
    preferredChannels: [String],
    doNotDisturb: {
      enabled: { type: Boolean, default: false },
      startTime: String, // HH:MM format
      endTime: String, // HH:MM format
      timezone: String
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, priority: 1 });
notificationSchema.index({ 'scheduling.sendAt': 1 });
notificationSchema.index({ 'scheduling.expiresAt': 1 });
notificationSchema.index({ 'delivery.inApp.sent': 1 });
notificationSchema.index({ 'delivery.email.sent': 1 });
notificationSchema.index({ 'delivery.sms.sent': 1 });
notificationSchema.index({ 'delivery.push.sent': 1 });

// Virtual for isExpired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.scheduling.expiresAt) return false;
  return new Date() > this.scheduling.expiresAt;
});

// Virtual for isScheduled
notificationSchema.virtual('isScheduled').get(function() {
  if (!this.scheduling.sendAt) return false;
  return new Date() < this.scheduling.sendAt;
});

// Virtual for canSend
notificationSchema.virtual('canSend').get(function() {
  if (this.isExpired) return false;
  if (this.isScheduled) return false;
  if (this.userPreferences.muted) {
    if (this.userPreferences.mutedUntil && new Date() < this.userPreferences.mutedUntil) {
      return false;
    }
  }
  return true;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  this.delivery.inApp.read = true;
  this.delivery.inApp.readAt = new Date();
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.status = 'unread';
  this.readAt = undefined;
  this.delivery.inApp.read = false;
  this.delivery.inApp.readAt = undefined;
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

// Method to delete (soft delete)
notificationSchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  return this.save();
};

// Method to mute
notificationSchema.methods.mute = function(duration = null) {
  this.userPreferences.muted = true;
  if (duration) {
    this.userPreferences.mutedUntil = new Date(Date.now() + duration);
  }
  return this.save();
};

// Method to unmute
notificationSchema.methods.unmute = function() {
  this.userPreferences.muted = false;
  this.userPreferences.mutedUntil = undefined;
  return this.save();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel, status, additionalData = {}) {
  if (this.delivery[channel]) {
    this.delivery[channel] = { ...this.delivery[channel], ...status, ...additionalData };
  }
  return this.save();
};

// Method to increment analytics
notificationSchema.methods.incrementAnalytics = function(type, value = 1) {
  if (this.analytics[type] !== undefined) {
    this.analytics[type] += value;
  }
  return this.save();
};

// Static method to find notifications by user
notificationSchema.statics.findByUser = function(userId, options = {}) {
  const { 
    status = 'unread', 
    type = null, 
    priority = null, 
    limit = 50, 
    skip = 0, 
    sort = { createdAt: -1 } 
  } = options;
  
  const query = { userId, status };
  if (type) query.type = type;
  if (priority) query.priority = priority;
  
  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'profile.firstName profile.lastName email');
};

// Static method to find unread notifications count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, status: 'unread' });
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, status: 'unread' },
    { 
      status: 'read', 
      readAt: new Date(),
      'delivery.inApp.read': true,
      'delivery.inApp.readAt': new Date()
    }
  );
};

// Static method to find scheduled notifications
notificationSchema.statics.findScheduled = function() {
  const now = new Date();
  return this.find({
    'scheduling.sendAt': { $lte: now },
    'scheduling.expiresAt': { $gt: now },
    status: 'unread'
  });
};

// Static method to get notification statistics
notificationSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: { $sum: { $cond: [{ $eq: ['$status', 'unread'] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
        archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to update engagement rate
notificationSchema.pre('save', function(next) {
  if (this.analytics.impressions > 0) {
    this.analytics.engagementRate = (this.analytics.clicks / this.analytics.impressions) * 100;
  }
  next();
});

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
