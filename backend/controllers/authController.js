import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateTokenPair, verifyRefreshToken, generatePasswordResetToken } from '../utils/jwt.js';

/**
 * Register a new user - Hackathon ready (no email/phone verification)
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, phoneNumber, role, firstName, lastName, studentInfo } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
      });
    }

    // Create user object
    const userData = {
      email,
      password,
      phoneNumber,
      role,
      firstName,
      lastName,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true
    };

    if (role === 'student' && studentInfo) {
      userData.studentInfo = studentInfo;
    }

    const user = new User(userData);
    await user.save();

    const { accessToken, refreshToken } = generateTokenPair(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          studentInfo: user.studentInfo,
          isVerified: true
        },
        tokens: { accessToken, refreshToken }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

/**
 * Login user - Hackathon ready with basic verification checks
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Debug log: what the frontend sent
    console.log("Login attempt:", { email, password });

    // Check if identifier is email or phone number
    const isEmail = email.includes('@');
    let user;

    if (isEmail) {
      user = await User.findOne({ email });
    } else {
      // Remove any non-digit characters from phone number for comparison
      const cleanPhone = email.replace(/\D/g, '');
      user = await User.findOne({ 
        phoneNumber: { $regex: cleanPhone + '$' } 
      });
    }

    // Debug log: what we found in DB
    console.log("Found user:", user ? { 
      email: user.email, 
      phone: user.phoneNumber, 
      password: user.password 
    } : null);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is inactive. Contact admin.' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ success: false, message: 'Email not verified. Please verify your email.' });
    }

    if (!user.isPhoneVerified) {
      return res.status(401).json({ success: false, message: 'Phone number not verified. Please verify your phone.' });
    }

    // Use the comparePassword method from the User model
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokenPair(user._id);
    user.lastLogin = new Date();
    user.lastActivity = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          studentInfo: user.studentInfo,
          isVerified: user.isEmailVerified && user.isPhoneVerified
        },
        tokens: { accessToken, refreshToken }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * Logout user
 */
export const logout = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Refresh token is required' });

    const decoded = verifyRefreshToken(token);
    if (!decoded) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const user = await User.findById(decoded.userId || decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'User not found or inactive' });

    const tokens = generateTokenPair(user._id);
    res.json({ success: true, message: 'Token refreshed successfully', data: { tokens } });

  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Check if identifier is email or phone number
    const isEmail = email.includes('@');
    let user;

    if (isEmail) {
      user = await User.findOne({ email });
    } else {
      // Remove any non-digit characters from phone number for comparison
      const cleanPhone = email.replace(/\D/g, '');
      user = await User.findOne({ 
        phoneNumber: { $regex: cleanPhone + '$' } 
      });
    }
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { resetToken } = generatePasswordResetToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    res.json({ success: true, message: 'Password reset email would be sent (skipped for hackathon)' });

  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    // Set the password directly - the pre-save middleware will hash it
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });

  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Use the comparePassword method from the User model
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    // Set the new password directly - the pre-save middleware will hash it
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          studentInfo: user.studentInfo,
          isVerified: true,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isActive;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          studentInfo: user.studentInfo
        }
      }
    });

  } catch (error) {
    next(error);
  }
};