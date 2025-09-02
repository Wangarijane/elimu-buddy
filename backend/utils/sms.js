import { sendVerificationSMS, sendNotificationSMS } from './twilio.js';

/**
 * Send SMS using available SMS service
 * @param {string} phoneNumber - Phone number to send SMS to
 * @param {string} message - Message content
 * @returns {Promise<Object>} - SMS result
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Try to use Twilio if configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return await sendNotificationSMS(phoneNumber, message);
    } else {
      // Fallback: log the SMS (for development)
      console.log(`[SMS] To: ${phoneNumber}`);
      console.log(`[SMS] Message: ${message}`);
      console.log(`[SMS] Note: Twilio not configured, SMS logged instead`);
      
      return {
        success: true,
        message: 'SMS logged (Twilio not configured)',
        phoneNumber,
        content: message
      };
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Fallback: log the SMS even if Twilio fails
    console.log(`[SMS FALLBACK] To: ${phoneNumber}`);
    console.log(`[SMS FALLBACK] Message: ${message}`);
    
    return {
      success: false,
      message: 'SMS failed, logged as fallback',
      phoneNumber,
      content: message,
      error: error.message
    };
  }
};

/**
 * Send bulk SMS to multiple numbers
 * @param {Array<string>} phoneNumbers - Array of phone numbers
 * @param {string} message - Message content
 * @returns {Promise<Array>} - Array of SMS results
 */
export const sendBulkSMS = async (phoneNumbers, message) => {
  const results = [];
  
  for (const phoneNumber of phoneNumbers) {
    try {
      const result = await sendSMS(phoneNumber, message);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        phoneNumber,
        error: error.message
      });
    }
  }
  
  return results;
};

export default {
  sendSMS,
  sendBulkSMS
};
