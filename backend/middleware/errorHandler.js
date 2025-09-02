const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // OpenAI API errors
  if (err.status === 429) {
    const message = 'AI service is currently busy, please try again later';
    error = { message, statusCode: 429 };
  }

  if (err.status === 500) {
    const message = 'AI service is temporarily unavailable';
    error = { message, statusCode: 503 };
  }

  // M-Pesa API errors
  if (err.response?.data?.errorCode) {
    const mpesaError = err.response.data;
    let message = 'Payment processing failed';
    
    switch (mpesaError.errorCode) {
      case 'INS-1':
        message = 'Insufficient funds in your M-Pesa account';
        break;
      case 'INS-2':
        message = 'M-Pesa account is blocked';
        break;
      case 'INS-3':
        message = 'M-Pesa account is inactive';
        break;
      case 'INS-4':
        message = 'Invalid phone number';
        break;
      case 'INS-5':
        message = 'Transaction cancelled by user';
        break;
      case 'INS-6':
        message = 'Transaction timeout';
        break;
      case 'INS-7':
        message = 'M-Pesa service is temporarily unavailable';
        break;
      default:
        message = mpesaError.errorMessage || message;
    }
    
    error = { message, statusCode: 400 };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Development vs Production error response
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    },
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Remove sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.error.stack;
    delete errorResponse.error.details;
  }

  res.status(statusCode).json(errorResponse);
};

export { errorHandler }; // Named export