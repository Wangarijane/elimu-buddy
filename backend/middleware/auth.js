import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Protect routes - require authentication
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not found'
          }
        });
      }

      // Check if user is active
      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is deactivated'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Token expired, please login again'
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized, invalid token'
        }
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized, no token provided'
      }
    });
  }
};

// Optional authentication - user can be authenticated but it's not required
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (req.user && !req.user.isActive) {
        req.user = null; // Treat as unauthenticated if account is deactivated
      }
    } catch (error) {
      // Silently fail for optional auth
      req.user = null;
    }
  }

  next();
};

// Role-based access control
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Role '${req.user.role}' is not authorized to access this resource`
        }
      });
    }

    next();
  };
};

// Specific role checks
export const requireParent = (req, res, next) => {
  if (!req.user || req.user.role !== 'parent') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Parent access required'
      }
    });
  }
  next();
};

export const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Student access required'
      }
    });
  }
  next();
};

export const requireExpert = (req, res, next) => {
  if (!req.user || req.user.role !== 'expert') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Expert access required'
      }
    });
  }

  // Check if expert is verified
  if (!req.user.expertInfo?.isVerified) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Expert account must be verified to access this resource'
      }
    });
  }

  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required'
      }
    });
  }
  next();
};

// Check if user owns the resource or is admin
export const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = mongoose.model(modelName);
      const resource = await Model.findById(req.params.id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Resource not found'
          }
        });
      }

      // Admin can access all resources
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership based on model
      let isOwner = false;
      
      switch (modelName) {
        case 'User':
          isOwner = resource._id.toString() === req.user._id.toString();
          break;
        case 'Question':
          isOwner = resource.askedBy.toString() === req.user._id.toString() ||
                   resource.parent?.toString() === req.user._id.toString();
          break;
        case 'Answer':
          isOwner = resource.expert.toString() === req.user._id.toString() ||
                   resource.student.toString() === req.user._id.toString();
          break;
        case 'Subscription':
          isOwner = resource.user.toString() === req.user._id.toString();
          break;
        case 'Payment':
          isOwner = resource.payer.toString() === req.user._id.toString() ||
                   resource.payee?.toString() === req.user._id.toString();
          break;
        default:
          isOwner = false;
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied: you do not own this resource'
          }
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting for specific actions
export const rateLimitAction = (action, maxAttempts, windowMs) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}-${action}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    if (attempts.has(key)) {
      attempts.set(key, attempts.get(key).filter(timestamp => timestamp > windowStart));
    } else {
      attempts.set(key, []);
    }

    const currentAttempts = attempts.get(key);

    if (currentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: {
          message: `Too many ${action} attempts, please try again later`
        }
      });
    }

    currentAttempts.push(now);
    next();
  };
};

// Check subscription status
export const checkSubscription = (feature) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required'
          }
        });
      }

      // Admin bypass
      if (req.user.role === 'admin') {
        return next();
      }

      // Check subscription status
      const subscription = await mongoose.model('Subscription').findOne({
        user: req.user._id,
        status: 'active'
      });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Active subscription required'
          }
        });
      }

      // Check if user can use the feature
      if (!subscription.canUseFeature(feature)) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Feature limit reached for ${feature}`
          }
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Update last activity
export const updateActivity = async (req, res, next) => {
  if (req.user) {
    try {
      req.user.lastActivity = new Date();
      await req.user.save();
    } catch (error) {
      // Don't block the request if activity update fails
      console.error('Failed to update user activity:', error);
    }
  }
  next();
};
