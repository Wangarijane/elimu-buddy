import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Check if Twilio credentials are available
const hasTwilioCredentials = process.env.TWILIO_ACCOUNT_SID && 
                             process.env.TWILIO_ACCOUNT_SID.startsWith('AC') && 
                             process.env.TWILIO_AUTH_TOKEN;

// Create a mock Twilio client if credentials are missing
const createMockTwilioClient = () => {
  console.warn('Twilio credentials missing or invalid. Using mock SMS client.');
  
  return {
    messages: {
      create: async (message) => {
        console.log('Mock SMS sent:', {
          to: message.to,
          body: message.body,
          from: message.from
        });
        return { sid: 'mock_sms_id_' + Date.now() };
      }
    }
  };
};

// Initialize Twilio client or mock client
const twilioClient = hasTwilioCredentials 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : createMockTwilioClient();

/**
 * Send SMS verification code
 */
const sendVerificationSMS = async (phoneNumber, code) => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const message = await twilioClient.messages.create({
      body: `Your ElimuBuddy verification code is: ${code}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER || '+15005550006', // Use Twilio test number if not configured
      to: formattedPhone
    });

    console.log(`SMS sent successfully to ${formattedPhone}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Don't throw error if Twilio is not configured
    if (!hasTwilioCredentials) {
      console.warn('Twilio not configured, but continuing without SMS');
      return { sid: 'mock_sms_id_' + Date.now() };
    }
    
    throw new Error('Failed to send SMS verification code');
  }
};

/**
 * Send password reset SMS
 */
const sendPasswordResetSMS = async (phoneNumber, code) => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const message = await twilioClient.messages.create({
      body: `Your ElimuBuddy password reset code is: ${code}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER || '+15005550006',
      to: formattedPhone
    });

    console.log(`Password reset SMS sent successfully to ${formattedPhone}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending password reset SMS:', error);
    
    if (!hasTwilioCredentials) {
      console.warn('Twilio not configured, but continuing without SMS');
      return { sid: 'mock_sms_id_' + Date.now() };
    }
    
    throw new Error('Failed to send password reset SMS');
  }
};

/**
 * Send notification SMS
 */
const sendNotificationSMS = async (phoneNumber, messageText) => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const message = await twilioClient.messages.create({
      body: messageText,
      from: process.env.TWILIO_PHONE_NUMBER || '+15005550006',
      to: formattedPhone
    });

    console.log(`Notification SMS sent successfully to ${formattedPhone}. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending notification SMS:', error);
    
    if (!hasTwilioCredentials) {
      console.warn('Twilio not configured, but continuing without SMS');
      return { sid: 'mock_sms_id_' + Date.now() };
    }
    
    throw new Error('Failed to send notification SMS');
  }
};

/**
 * Send bulk SMS to multiple numbers
 */
const sendBulkSMS = async (phoneNumbers, messageText) => {
  try {
    const messages = [];
    
    for (const phoneNumber of phoneNumbers) {
      try {
        const formattedPhone = formatPhoneNumber(phoneNumber);
        const twilioMessage = await twilioClient.messages.create({
          body: messageText,
          from: process.env.TWILIO_PHONE_NUMBER || '+15005550006',
          to: formattedPhone
        });

        messages.push({
          phoneNumber: formattedPhone,
          success: true,
          sid: twilioMessage.sid
        });
      } catch (error) {
        console.error(`Failed to send SMS to ${phoneNumber}:`, error);
        messages.push({
          phoneNumber,
          success: false,
          error: error.message
        });
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return messages;
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw new Error('Failed to send bulk SMS');
  }
};

/**
 * Check SMS delivery status
 */
const checkSMSStatus = async (messageSid) => {
  try {
    // If using mock client, return mock status
    if (!hasTwilioCredentials) {
      return {
        sid: messageSid,
        status: 'delivered',
        to: 'mock_recipient',
        from: process.env.TWILIO_PHONE_NUMBER || '+15005550006',
        body: 'Mock message',
        dateCreated: new Date(),
        dateSent: new Date(),
        dateUpdated: new Date()
      };
    }
    
    const message = await twilioClient.messages(messageSid).fetch();
    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  } catch (error) {
    console.error('Error checking SMS status:', error);
    throw new Error('Failed to check SMS status');
  }
};

/**
 * Get SMS history for a phone number
 */
const getSMSHistory = async (phoneNumber, limit = 50) => {
  try {
    // If using mock client, return empty history
    if (!hasTwilioCredentials) {
      return [];
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const messages = await twilioClient.messages.list({
      to: formattedPhone,
      limit
    });

    return messages.map(message => ({
      sid: message.sid,
      status: message.status,
      body: message.body,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      direction: message.direction,
      price: message.price,
      priceUnit: message.priceUnit
    }));
  } catch (error) {
    console.error('Error getting SMS history:', error);
    throw new Error('Failed to get SMS history');
  }
};

/**
 * Validate phone number format
 */
const validatePhoneNumber = (phoneNumber) => {
  // Basic validation for Kenyan phone numbers
  const kenyaPhoneRegex = /^(\+254|254|0)?[17]\d{8}$/;
  return kenyaPhoneRegex.test(phoneNumber);
};

/**
 * Format phone number to international format
 */
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  if (digits.startsWith('254')) {
    return '+' + digits;
  } else if (digits.startsWith('0')) {
    return '+254' + digits.substring(1);
  } else if (digits.startsWith('1') || digits.startsWith('7')) {
    return '+254' + digits;
  } else {
    return phoneNumber; // Return as-is if can't determine format
  }
};

// Export all functions
export {
  sendVerificationSMS,
  sendPasswordResetSMS,
  sendNotificationSMS,
  sendBulkSMS,
  checkSMSStatus,
  getSMSHistory,
  validatePhoneNumber,
  formatPhoneNumber
};

// Default export with all functions
export default {
  sendVerificationSMS,
  sendPasswordResetSMS,
  sendNotificationSMS,
  sendBulkSMS,
  checkSMSStatus,
  getSMSHistory,
  validatePhoneNumber,
  formatPhoneNumber,
  hasTwilioCredentials: !!hasTwilioCredentials
};