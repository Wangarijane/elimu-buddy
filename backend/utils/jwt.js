import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate JWT token
export const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw error;
  }
};

// Generate password reset token
export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  return {
    resetToken,
    hashedToken
  };
};

// Generate email verification token
export const generateEmailVerificationToken = () => {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  
  return {
    verificationToken,
    hashedToken
  };
};

// Generate phone verification code
export const generatePhoneVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate API key
export const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate secure random string
export const generateSecureString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash string using SHA-256
export const hashString = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex');
};

// Generate nonce for security
export const generateNonce = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Generate transaction reference
export const generateTransactionRef = (prefix = 'TXN') => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
};

// Generate order number
export const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 6);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

// Generate invoice number
export const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 6);
  return `INV-${timestamp}-${random}`.toUpperCase();
};

// Generate receipt number
export const generateReceiptNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 6);
  return `RCP-${timestamp}-${random}`.toUpperCase();
};

// Generate short ID (for URLs, etc.)
export const generateShortId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate M-Pesa reference
export const generateMpesaReference = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 6);
  return `MPESA-${timestamp}-${random}`.toUpperCase();
};

// Generate Stripe reference
export const generateStripeReference = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 6);
  return `STRIPE-${timestamp}-${random}`.toUpperCase();
};

// Check if token is expired
export const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
export const getTokenExpirationTime = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return null;
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Get token payload without verification
export const getTokenPayload = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// Generate token pair (access + refresh)
export const generateTokenPair = (userId) => {
  const accessToken = generateToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  };
};

// Generate session token
export const generateSessionToken = (userId, sessionId) => {
  return jwt.sign(
    { 
      id: userId, 
      sessionId, 
      type: 'session' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Generate temporary token (for one-time use)
export const generateTemporaryToken = (userId, purpose, expiresIn = '1h') => {
  return jwt.sign(
    { 
      id: userId, 
      purpose, 
      type: 'temporary' 
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Verify temporary token
export const verifyTemporaryToken = (token, purpose) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'temporary' || decoded.purpose !== purpose) {
      throw new Error('Invalid token type or purpose');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
};
