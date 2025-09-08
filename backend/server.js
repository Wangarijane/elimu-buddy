import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import questionRoutes from './routes/questions.js';
import answerRoutes from './routes/answers.js';
import paymentRoutes from './routes/payments.js';
import subscriptionRoutes from './routes/subscriptions.js';
import expertRoutes from './routes/experts.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import curriculumRoutes from './routes/curriculum.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Initialize Express
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== MIDDLEWARE =====

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration with allowlist (supports multiple origins)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://elimu-buddy.vercel.app,https://elimu-buddy.onrender.com')
  .split(',')
  .map((o) => o.trim());

// Log allowed origins for debugging
console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser or same-origin
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS allowed for origin: ${origin}`);
        return callback(null, true);
      }
      console.log(`❌ CORS blocked for origin: ${origin}. Allowed origins:`, allowedOrigins);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Explicitly handle preflight
app.options('*', cors());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== HEALTH & ROOT ROUTES =====
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ElimuBuddy Kenya Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.send('🚀 ElimuBuddy Kenya Backend is live!');
});

// ===== API INFO ROUTE =====
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ElimuBuddy Kenya API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      questions: '/api/questions',
      answers: '/api/answers',
      payments: '/api/payments',
      subscriptions: '/api/subscriptions',
      experts: '/api/experts',
      chat: '/api/chat',
      admin: '/api/admin',
      curriculum: '/api/curriculum'
    },
    documentation: 'https://github.com/your-repo/elimubuddy-kenya-learn'
  });
});

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/curriculum', curriculumRoutes);

// ===== ERROR HANDLING =====
app.use(notFound);
app.use(errorHandler);

// ===== DATABASE CONNECTION =====
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || process.env.MONGODB_URI_PROD
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 ElimuBuddy Kenya Backend running on port ${PORT}`);
      console.log(`📚 CBC Curriculum API ready`);
      console.log(`🤖 AI Integration active`);
      console.log(`💰 M-Pesa payments configured`);
      console.log(`👨‍🏫 Expert system operational`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// ===== GRACEFUL SHUTDOWN =====
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;

