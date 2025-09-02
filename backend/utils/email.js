import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create transporter - FIXED: changed createTransporter to createTransport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Email templates
const emailTemplates = {
  welcome: {
    subject: 'Karibu ElimuBuddy Kenya! 🎓',
    template: 'welcome.html'
  },
  emailVerification: {
    subject: 'Verify Your Email - ElimuBuddy Kenya',
    template: 'email-verification.html'
  },
  passwordReset: {
    subject: 'Reset Your Password - ElimuBuddy Kenya',
    template: 'password-reset.html'
  },
  subscriptionConfirmation: {
    subject: 'Subscription Confirmed - ElimuBuddy Kenya',
    template: 'subscription-confirmation.html'
  },
  paymentConfirmation: {
    subject: 'Payment Confirmed - ElimuBuddy Kenya',
    template: 'payment-confirmation.html'
  },
  expertVerification: {
    subject: 'Expert Account Verification - ElimuBuddy Kenya',
    template: 'expert-verification.html'
  },
  questionAssigned: {
    subject: 'New Question Assigned - ElimuBuddy Kenya',
    template: 'question-assigned.html'
  },
  answerReceived: {
    subject: 'Answer Received - ElimuBuddy Kenya',
    template: 'answer-received.html'
  },
  subscriptionExpiry: {
    subject: 'Subscription Expiring Soon - ElimuBuddy Kenya',
    template: 'subscription-expiry.html'
  },
  welcomeBack: {
    subject: 'Welcome Back to ElimuBuddy Kenya! 📚',
    template: 'welcome-back.html'
  }
};

// Load email template
const loadEmailTemplate = (templateName, data = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', templateName);
    
    if (!fs.existsSync(templatePath)) {
      console.warn(`Email template not found: ${templatePath}`);
      return getDefaultTemplate(templateName, data);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders with actual data
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, data[key] || '');
    });
    
    return template;
  } catch (error) {
    console.error('Error loading email template:', error);
    return getDefaultTemplate(templateName, data);
  }
};

// Get default template if file not found
const getDefaultTemplate = (templateName, data) => {
  const { firstName = 'User', lastName = '' } = data;
  const fullName = `${firstName} ${lastName}`.trim();
  
  switch (templateName) {
    case 'welcome.html':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Karibu ElimuBuddy Kenya! 🎓</h2>
          <p>Habari ${fullName},</p>
          <p>Karibu kwenye ElimuBuddy Kenya! Tunafurahi kukuwa nawe kwenye safari yako ya kujifunza.</p>
          <p>ElimuBuddy ni msaada wa AI + binadamu ambao unakusaidia kujifunza mtaala wa CBC wa Kenya.</p>
          <p>Unaweza:</p>
          <ul>
            <li>Kuuliza maswali kwa AI</li>
            <li>Kupata msaada kutoka kwa walimu waliohitimu</li>
            <li>Kufuatilia maendeleo yako</li>
            <li>Kushiriki katika vyumba vya kujifunza</li>
          </ul>
          <p>Tunaanza safari yako ya kujifunza!</p>
          <p>Kwa heshima,<br>Timu ya ElimuBuddy Kenya</p>
        </div>
      `;
      
    case 'email-verification.html':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Thibitisha Barua Pepe Yako</h2>
          <p>Habari ${fullName},</p>
          <p>Tafadhali thibitisha barua pepe yako kwa kubofya kiungo hapa chini:</p>
          <p style="text-align: center;">
            <a href="{{verificationUrl}}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Thibitisha Barua Pepe
            </a>
          </p>
          <p>Kiungo hiki kitakoma baada ya saa 24.</p>
          <p>Kwa heshima,<br>Timu ya ElimuBuddy Kenya</p>
        </div>
      `;
      
    case 'password-reset.html':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Badilisha Neno la Siri</h2>
          <p>Habari ${fullName},</p>
          <p>Umeomba kubadilisha neno la siri lako. Bofya kiungo hapa chini kuweka neno la siri jipya:</p>
          <p style="text-align: center;">
            <a href="{{resetUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Badilisha Neno la Siri
            </a>
          </p>
          <p>Kiungo hiki kitakoma baada ya saa 1.</p>
          <p>Ikiwa hukuomba kubadilisha neno la siri, tafadhali usiende kiungo hiki.</p>
          <p>Kwa heshima,<br>Timu ya ElimuBuddy Kenya</p>
        </div>
      `;
      
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">ElimuBuddy Kenya</h2>
          <p>Habari ${fullName},</p>
          <p>{{message}}</p>
          <p>Kwa heshima,<br>Timu ya ElimuBuddy Kenya</p>
        </div>
      `;
  }
};

// Send email
export const sendEmail = async (to, templateName, data = {}) => {
  try {
    const transporter = createTransporter();
    const template = emailTemplates[templateName];
    
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }
    
    const htmlContent = loadEmailTemplate(template.template, data);
    
    const mailOptions = {
      from: `"ElimuBuddy Kenya" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: template.subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      attachments: data.attachments || []
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      template: templateName,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to send email'
    };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (user) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${user.emailVerificationToken}`
  };
  
  return await sendEmail(user.email, 'welcome', data);
};

// Send email verification email
export const sendEmailVerificationEmail = async (user, verificationToken) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
  };
  
  return await sendEmail(user.email, 'emailVerification', data);
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  };
  
  return await sendEmail(user.email, 'passwordReset', data);
};

// Send subscription confirmation email
export const sendSubscriptionConfirmationEmail = async (user, subscription) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    plan: subscription.plan,
    amount: subscription.planDetails.price,
    startDate: subscription.startDate.toLocaleDateString('en-KE'),
    endDate: subscription.endDate.toLocaleDateString('en-KE'),
    features: subscription.planDetails.features.map(f => f.name).join(', ')
  };
  
  return await sendEmail(user.email, 'subscriptionConfirmation', data);
};

// Send payment confirmation email
export const sendPaymentConfirmationEmail = async (user, payment) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    transactionId: payment.transactionId || payment.paymentId,
    date: new Date().toLocaleDateString('en-KE'),
    purpose: payment.purpose
  };
  
  return await sendEmail(user.email, 'paymentConfirmation', data);
};

// Send expert verification email
export const sendExpertVerificationEmail = async (user) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    message: 'Your expert account has been verified! You can now start answering questions and earning money.'
  };
  
  return await sendEmail(user.email, 'expertVerification', data);
};

// Send question assigned email
export const sendQuestionAssignedEmail = async (expert, question) => {
  const data = {
    firstName: expert.firstName,
    lastName: expert.lastName,
    questionTitle: question.title,
    questionContent: question.content,
    subject: question.subject,
    grade: question.grade,
    deadline: question.deadline.toLocaleDateString('en-KE'),
    budget: `${question.budget.min} - ${question.budget.max} KES`,
    questionUrl: `${process.env.FRONTEND_URL}/questions/${question._id}`
  };
  
  return await sendEmail(expert.email, 'questionAssigned', data);
};

// Send answer received email
export const sendAnswerReceivedEmail = async (student, question, answer) => {
  const data = {
    firstName: student.firstName,
    lastName: student.lastName,
    questionTitle: question.title,
    answerContent: answer.content,
    expertName: `${answer.expert.firstName} ${answer.expert.lastName}`,
    questionUrl: `${process.env.FRONTEND_URL}/questions/${question._id}`
  };
  
  return await sendEmail(student.email, 'answerReceived', data);
};

// Send subscription expiry reminder
export const sendSubscriptionExpiryReminder = async (user, subscription) => {
  const daysRemaining = Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
  
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    plan: subscription.plan,
    daysRemaining: daysRemaining,
    expiryDate: subscription.endDate.toLocaleDateString('en-KE'),
    renewalUrl: `${process.env.FRONTEND_URL}/subscription/renew`
  };
  
  return await sendEmail(user.email, 'subscriptionExpiry', data);
};

// Send welcome back email
export const sendWelcomeBackEmail = async (user) => {
  const data = {
    firstName: user.firstName,
    lastName: user.lastName,
    lastLogin: user.lastLogin.toLocaleDateString('en-KE'),
    message: 'Welcome back to ElimuBuddy Kenya! We\'re glad to see you again.'
  };
  
  return await sendEmail(user.email, 'welcomeBack', data);
};

// Send bulk emails
export const sendBulkEmails = async (recipients, templateName, data = {}) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient.email, templateName, {
        ...data,
        firstName: recipient.firstName,
        lastName: recipient.lastName
      });
      
      results.push({
        email: recipient.email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.push({
        email: recipient.email,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Send test email
export const sendTestEmail = async (to) => {
  const data = {
    firstName: 'Test',
    lastName: 'User',
    message: 'This is a test email from ElimuBuddy Kenya backend.'
  };
  
  return await sendEmail(to, 'welcome', data);
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: 'Email configuration is valid'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Email configuration is invalid'
    };
  }
};
