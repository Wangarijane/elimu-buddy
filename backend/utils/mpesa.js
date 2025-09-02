import axios from 'axios';
import crypto from 'crypto';

// M-Pesa API configuration
const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  shortcode: process.env.MPESA_SHORTCODE,
  callbackUrl: process.env.MPESA_CALLBACK_URL,
  baseUrl: process.env.MPESA_ENVIRONMENT === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke'
};

// Generate M-Pesa access token
export const generateMpesaAccessToken = async () => {
  try {
    const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
    
    const response = await axios.get(`${mpesaConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.access_token;
    
  } catch (error) {
    console.error('Error generating M-Pesa access token:', error);
    throw new Error('Failed to generate M-Pesa access token');
  }
};

// Generate M-Pesa password
export const generateMpesaPassword = () => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');
  
  return {
    password,
    timestamp
  };
};

// Initiate STK Push (Customer to Business)
export const initiateSTKPush = async (phoneNumber, amount, reference, description) => {
  try {
    const accessToken = await generateMpesaAccessToken();
    const { password, timestamp } = generateMpesaPassword();
    
    const requestBody = {
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: mpesaConfig.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: mpesaConfig.callbackUrl,
      AccountReference: reference,
      TransactionDesc: description
    };
    
    const response = await axios.post(
      `${mpesaConfig.baseUrl}/mpesa/stkpush/v1/processrequest`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage
    };
    
  } catch (error) {
    console.error('Error initiating STK Push:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        errorCode: error.response.data.errorCode,
        errorMessage: error.response.data.errorMessage,
        requestId: error.response.data.requestId
      };
    }
    
    return {
      success: false,
      errorMessage: error.message
    };
  }
};

// Check STK Push status
export const checkSTKPushStatus = async (checkoutRequestId) => {
  try {
    const accessToken = await generateMpesaAccessToken();
    const { password, timestamp } = generateMpesaPassword();
    
    const requestBody = {
      BusinessShortCode: mpesaConfig.shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };
    
    const response = await axios.post(
      `${mpesaConfig.baseUrl}/mpesa/stkpushquery/v1/query`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      resultCode: response.data.ResultCode,
      resultDescription: response.data.ResultDesc,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      amount: response.data.Amount,
      mpesaReceiptNumber: response.data.MpesaReceiptNumber,
      transactionDate: response.data.TransactionDate
    };
    
  } catch (error) {
    console.error('Error checking STK Push status:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        errorCode: error.response.data.errorCode,
        errorMessage: error.response.data.errorMessage
      };
    }
    
    return {
      success: false,
      errorMessage: error.message
    };
  }
};

// Initiate B2C payment (Business to Customer - for withdrawals)
export const initiateB2CPayment = async (phoneNumber, amount, reference, description) => {
  try {
    const accessToken = await generateMpesaAccessToken();
    
    const requestBody = {
      InitiatorName: process.env.MPESA_INITIATOR_NAME || 'ElimuBuddy',
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: mpesaConfig.shortcode,
      PartyB: phoneNumber,
      Remarks: description,
      QueueTimeOutURL: `${mpesaConfig.callbackUrl}/b2c-timeout`,
      ResultURL: `${mpesaConfig.callbackUrl}/b2c-result`,
      Occasion: reference
    };
    
    const response = await axios.post(
      `${mpesaConfig.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      conversationId: response.data.ConversationID,
      originatorConversationId: response.data.OriginatorConversationID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription
    };
    
  } catch (error) {
    console.error('Error initiating B2C payment:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        errorCode: error.response.data.errorCode,
        errorMessage: error.response.data.errorMessage,
        requestId: error.response.data.requestId
      };
    }
    
    return {
      success: false,
      errorMessage: error.message
    };
  }
};

// Check B2C payment status
export const checkB2CPaymentStatus = async (conversationId) => {
  try {
    const accessToken = await generateMpesaAccessToken();
    
    const requestBody = {
      Initiator: process.env.MPESA_INITIATOR_NAME || 'ElimuBuddy',
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment',
      TransactionID: conversationId,
      PartyA: mpesaConfig.shortcode,
      IdentifierType: '4', // MSISDN
      ResultURL: `${mpesaConfig.callbackUrl}/b2c-result`,
      QueueTimeOutURL: `${mpesaConfig.callbackUrl}/b2c-timeout`,
      Remarks: 'Payment status check',
      Occasion: 'StatusCheck'
    };
    
    const response = await axios.post(
      `${mpesaConfig.baseUrl}/mpesa/b2c/v1/paymentrequest`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return {
      success: true,
      resultCode: response.data.ResultCode,
      resultDescription: response.data.ResultDesc,
      conversationId: response.data.ConversationID,
      originatorConversationId: response.data.OriginatorConversationID
    };
    
  } catch (error) {
    console.error('Error checking B2C payment status:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        errorCode: error.response.data.errorCode,
        errorMessage: error.response.data.errorMessage
      };
    }
    
    return {
      success: false,
      errorMessage: error.message
    };
  }
};

// Generate M-Pesa callback signature
export const generateCallbackSignature = (data, timestamp) => {
  const stringToSign = `${data}${timestamp}`;
  return crypto.createHmac('sha256', mpesaConfig.passkey).update(stringToSign).digest('hex');
};

// Verify M-Pesa callback signature
export const verifyCallbackSignature = (data, timestamp, signature) => {
  const expectedSignature = generateCallbackSignature(data, timestamp);
  return signature === expectedSignature;
};

// Parse M-Pesa callback data
export const parseCallbackData = (callbackData) => {
  try {
    const parsed = JSON.parse(callbackData);
    
    if (parsed.Body?.stkCallback) {
      // STK Push callback
      const stkCallback = parsed.Body.stkCallback;
      
      return {
        type: 'stk_push',
        checkoutRequestId: stkCallback.CheckoutRequestID,
        merchantRequestId: stkCallback.MerchantRequestID,
        resultCode: stkCallback.ResultCode,
        resultDescription: stkCallback.ResultDesc,
        amount: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'Amount')?.Value,
        mpesaReceiptNumber: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value,
        transactionDate: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'TransactionDate')?.Value,
        phoneNumber: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'PhoneNumber')?.Value
      };
    } else if (parsed.Body?.Result) {
      // B2C callback
      const result = parsed.Body.Result;
      
      return {
        type: 'b2c',
        conversationId: result.ConversationID,
        originatorConversationId: result.OriginatorConversationID,
        resultCode: result.ResultCode,
        resultDescription: result.ResultDesc,
        transactionId: result.TransactionID,
        amount: result.ResultParameters?.Parameter?.find(param => param.Key === 'TransactionAmount')?.Value,
        phoneNumber: result.ResultParameters?.Parameter?.find(param => param.Key === 'TransactionReceipt')?.Value
      };
    }
    
    return {
      type: 'unknown',
      data: parsed
    };
    
  } catch (error) {
    console.error('Error parsing M-Pesa callback data:', error);
    return {
      type: 'error',
      error: error.message,
      rawData: callbackData
    };
  }
};

// Format phone number for M-Pesa
export const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 0, replace with 254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  // If it doesn't start with 254, add it
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

// Validate M-Pesa phone number
export const validateMpesaPhoneNumber = (phoneNumber) => {
  const formatted = formatPhoneNumber(phoneNumber);
  const regex = /^254[17]\d{8}$/;
  return regex.test(formatted);
};

// Get M-Pesa transaction status
export const getTransactionStatus = (resultCode) => {
  const statusMap = {
    '0': 'success',
    '1': 'insufficient_funds',
    '2': 'less_than_minimum_transaction_value',
    '3': 'more_than_maximum_transaction_value',
    '4': 'would_exceed_daily_transfer_limit',
    '5': 'would_exceed_minimum_balance',
    '6': 'unresolved_primary_party',
    '7': 'unresolved_receiver_party',
    '8': 'would_exceed_maximum_balance',
    '11': 'debit_account_invalid',
    '12': 'credit_account_invalid',
    '13': 'unresolved_debit_account',
    '14': 'unresolved_credit_account',
    '15': 'duplicate_detected',
    '17': 'internal_failure',
    '20': 'invalid_from_account',
    '21': 'invalid_to_account',
    '22': 'invalid_transfer_amount',
    '23': 'invalid_minimum_amount',
    '24': 'invalid_maximum_amount',
    '25': 'minimum_transfer_amount_error',
    '26': 'maximum_transfer_amount_error',
    '27': 'over_daily_limit',
    '28': 'over_monthly_limit',
    '29': 'over_yearly_limit',
    '30': 'insufficient_balance',
    '31': 'over_individual_limit',
    '32': 'over_institutional_limit',
    '33': 'over_country_limit',
    '34': 'over_global_limit',
    '35': 'over_daily_limit',
    '36': 'over_monthly_limit',
    '37': 'over_yearly_limit',
    '38': 'over_individual_limit',
    '39': 'over_institutional_limit',
    '40': 'over_country_limit',
    '41': 'over_global_limit',
    '42': 'over_daily_limit',
    '43': 'over_monthly_limit',
    '44': 'over_yearly_limit',
    '45': 'over_individual_limit',
    '46': 'over_institutional_limit',
    '47': 'over_country_limit',
    '48': 'over_global_limit',
    '49': 'over_daily_limit',
    '50': 'over_monthly_limit',
    '51': 'over_yearly_limit',
    '52': 'over_individual_limit',
    '53': 'over_institutional_limit',
    '54': 'over_country_limit',
    '55': 'over_global_limit',
    '56': 'over_daily_limit',
    '57': 'over_monthly_limit',
    '58': 'over_yearly_limit',
    '59': 'over_individual_limit',
    '60': 'over_institutional_limit',
    '61': 'over_country_limit',
    '62': 'over_global_limit',
    '63': 'over_daily_limit',
    '64': 'over_monthly_limit',
    '65': 'over_yearly_limit',
    '66': 'over_individual_limit',
    '67': 'over_institutional_limit',
    '68': 'over_country_limit',
    '69': 'over_global_limit',
    '70': 'over_daily_limit',
    '71': 'over_monthly_limit',
    '72': 'over_yearly_limit',
    '73': 'over_individual_limit',
    '74': 'over_institutional_limit',
    '75': 'over_country_limit',
    '76': 'over_global_limit',
    '77': 'over_daily_limit',
    '78': 'over_monthly_limit',
    '79': 'over_yearly_limit',
    '80': 'over_individual_limit',
    '81': 'over_institutional_limit',
    '82': 'over_country_limit',
    '83': 'over_global_limit',
    '84': 'over_daily_limit',
    '85': 'over_monthly_limit',
    '86': 'over_yearly_limit',
    '87': 'over_individual_limit',
    '88': 'over_institutional_limit',
    '89': 'over_country_limit',
    '90': 'over_global_limit',
    '91': 'over_daily_limit',
    '92': 'over_monthly_limit',
    '93': 'over_yearly_limit',
    '94': 'over_individual_limit',
    '95': 'over_institutional_limit',
    '96': 'over_country_limit',
    '97': 'over_global_limit',
    '98': 'over_daily_limit',
    '99': 'over_monthly_limit',
    '100': 'over_yearly_limit'
  };
  
  return statusMap[resultCode] || 'unknown';
};

// Get M-Pesa error message
export const getMpesaErrorMessage = (resultCode) => {
  const errorMessages = {
    '0': 'Transaction successful',
    '1': 'Insufficient funds in your M-Pesa account',
    '2': 'Amount is less than minimum transaction value',
    '3': 'Amount is more than maximum transaction value',
    '4': 'Would exceed daily transfer limit',
    '5': 'Would exceed minimum balance',
    '6': 'Unresolved primary party',
    '7': 'Unresolved receiver party',
    '8': 'Would exceed maximum balance',
    '11': 'Debit account invalid',
    '12': 'Credit account invalid',
    '13': 'Unresolved debit account',
    '14': 'Unresolved credit account',
    '15': 'Duplicate detected',
    '17': 'Internal failure',
    '20': 'Invalid from account',
    '21': 'Invalid to account',
    '22': 'Invalid transfer amount',
    '23': 'Invalid minimum amount',
    '24': 'Invalid maximum amount',
    '25': 'Minimum transfer amount error',
    '26': 'Maximum transfer amount error',
    '27': 'Over daily limit',
    '28': 'Over monthly limit',
    '29': 'Over yearly limit',
    '30': 'Insufficient balance',
    '31': 'Over individual limit',
    '32': 'Over institutional limit',
    '33': 'Over country limit',
    '34': 'Over global limit'
  };
  
  return errorMessages[resultCode] || 'Unknown error occurred';
};

// Test M-Pesa connection
export const testMpesaConnection = async () => {
  try {
    const accessToken = await generateMpesaAccessToken();
    
    return {
      success: true,
      message: 'M-Pesa connection successful',
      environment: mpesaConfig.environment,
      baseUrl: mpesaConfig.baseUrl,
      shortcode: mpesaConfig.shortcode
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'M-Pesa connection failed',
      error: error.message,
      environment: mpesaConfig.environment,
      baseUrl: mpesaConfig.baseUrl
    };
  }
};
const mpesa = {
  generateMpesaAccessToken,
  generateMpesaPassword,
  initiateSTKPush,
  checkSTKPushStatus,
  initiateB2CPayment,
  checkB2CPaymentStatus,
  generateCallbackSignature,
  verifyCallbackSignature,
  parseCallbackData,
  formatPhoneNumber,
  validateMpesaPhoneNumber,
  getTransactionStatus,
  getMpesaErrorMessage,
  testMpesaConnection
};

export default mpesa;
