import Notification from '../models/Notification.js';
import User from '../models/User.js';
import sendEmail from '../utils/email.js';
import sendSMS from '../utils/sms.js';
import sendPushNotification from '../utils/pushNotification.js';

/**
 * Get user notifications
 */
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, read, priority } = req.query;

    const query = { recipient: userId };
    if (type) query.type = type;
    if (read !== undefined) query.read = read === 'true';
    if (priority) query.priority = priority;

    const notifications = await Notification.find(query)
      .populate('sender', 'profile.firstName profile.lastName profile.avatar')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get single notification
 */
export const getNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id)
      .populate('sender', 'profile.firstName profile.lastName profile.avatar')
      .populate('recipient', 'profile.firstName profile.lastName');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { notification }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { 
        $set: { 
          read: true, 
          readAt: new Date() 
        } 
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Notification.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    const query = { recipient: userId };
    if (type) query.type = type;

    await Notification.deleteMany(query);

    res.json({
      success: true,
      message: 'Notifications deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('notificationPreferences');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        preferences: user.notificationPreferences || {}
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences
    };

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        preferences: user.notificationPreferences
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Create notification
 */
export const createNotification = async (req, res, next) => {
  try {
    const { 
      recipient, 
      type, 
      title, 
      message, 
      data, 
      priority = 'normal',
      channels = ['in_app']
    } = req.body;

    // Validate recipient
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Create notification
    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      data,
      priority,
      channels
    });

    await notification.save();

    // Send notifications through different channels based on user preferences
    await sendNotificationsThroughChannels(notification, recipientUser);

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Send bulk notifications
 */
export const sendBulkNotifications = async (req, res, next) => {
  try {
    const { 
      recipients, 
      type, 
      title, 
      message, 
      data, 
      priority = 'normal',
      channels = ['in_app']
    } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients are required'
      });
    }

    // Validate recipients
    const validRecipients = await User.find({
      _id: { $in: recipients }
    });

    if (validRecipients.length !== recipients.length) {
      return res.status(400).json({
        success: false,
        message: 'Some recipients are invalid'
      });
    }

    // Create notifications for all recipients
    const notifications = [];
    for (const recipient of recipients) {
      const notification = new Notification({
        recipient,
        type,
        title,
        message,
        data,
        priority,
        channels
      });
      notifications.push(notification);
    }

    await Notification.insertMany(notifications);

    // Send notifications through different channels
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const recipientUser = validRecipients.find(u => u._id.toString() === recipient);
      if (recipientUser) {
        await sendNotificationsThroughChannels(notification, recipientUser);
      }
    }

    res.json({
      success: true,
      message: `Notifications sent to ${notifications.length} recipients`,
      data: { count: notifications.length }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [totalNotifications, unreadNotifications, readNotifications] = await Promise.all([
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false }),
      Notification.countDocuments({ recipient: userId, read: true })
    ]);

    // Get notifications by type
    const notificationsByType = await Notification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get notifications by priority
    const notificationsByPriority = await Notification.aggregate([
      { $match: { recipient: userId } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalNotifications,
          unreadNotifications,
          readNotifications
        },
        notificationsByType,
        notificationsByPriority
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get notification templates
 */
export const getNotificationTemplates = async (req, res, next) => {
  try {
    const templates = {
      welcome: {
        title: 'Welcome to ElimuBuddy!',
        message: 'We\'re excited to have you on board. Start your learning journey today!',
        type: 'welcome',
        priority: 'normal'
      },
      question_answered: {
        title: 'Your question has been answered!',
        message: 'An expert has provided an answer to your question. Check it out now!',
        type: 'question_answered',
        priority: 'high'
      },
      payment_successful: {
        title: 'Payment Successful!',
        message: 'Your payment has been processed successfully. Enjoy your premium features!',
        type: 'payment_successful',
        priority: 'high'
      },
      subscription_expiring: {
        title: 'Subscription Expiring Soon',
        message: 'Your subscription will expire in 3 days. Renew now to continue enjoying premium features!',
        type: 'subscription_expiring',
        priority: 'normal'
      },
      expert_approved: {
        title: 'Expert Application Approved!',
        message: 'Congratulations! Your expert application has been approved. You can now start answering questions!',
        type: 'expert_approved',
        priority: 'high'
      },
      new_message: {
        title: 'New Message',
        message: 'You have received a new message in your chat.',
        type: 'new_message',
        priority: 'normal'
      }
    };

    res.json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Test notification
 */
export const testNotification = async (req, res, next) => {
  try {
    const { channels = ['in_app'] } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create test notification
    const notification = new Notification({
      recipient: userId,
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify your notification settings.',
      priority: 'normal',
      channels
    });

    await notification.save();

    // Send test notification through specified channels
    await sendNotificationsThroughChannels(notification, user);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: { notification }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get notification history
 */
export const getNotificationHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, type, priority, startDate, endDate } = req.query;

    const query = { recipient: userId };
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// Helper function to send notifications through different channels
async function sendNotificationsThroughChannels(notification, recipientUser) {
  try {
    const preferences = recipientUser.notificationPreferences || {};
    const channels = notification.channels || ['in_app'];

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          if (preferences.email !== false && recipientUser.email) {
            await sendEmail({
              to: recipientUser.email,
              subject: notification.title,
              text: notification.message,
              html: `<h3>${notification.title}</h3><p>${notification.message}</p>`
            });
          }
          break;

        case 'sms':
          if (preferences.sms !== false && recipientUser.profile?.phoneNumber) {
            await sendSMS({
              to: recipientUser.profile.phoneNumber,
              message: `${notification.title}: ${notification.message}`
            });
          }
          break;

        case 'push':
          if (preferences.push !== false && recipientUser.pushTokens?.length > 0) {
            for (const token of recipientUser.pushTokens) {
              await sendPushNotification({
                token,
                title: notification.title,
                body: notification.message,
                data: notification.data
              });
            }
          }
          break;

        case 'in_app':
        default:
          // In-app notifications are already saved to the database
          break;
      }
    }
  } catch (error) {
    console.error('Error sending notification through channels:', error);
  }
}
