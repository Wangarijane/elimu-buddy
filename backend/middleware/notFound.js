const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  
  // Log 404 errors for monitoring
  console.log(`404 Error: ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  
  next(error);
};

export { notFound }; // Changed from default export to named export
