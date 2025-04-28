// Middleware for 404 Not Found errors
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Pass error to the next error handler
};

// General error handling middleware
const errorHandler = (err, req, res, next) => {
  // Set status code: if it's already an error status, keep it, otherwise default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  console.error("ERROR STACK:", err.stack); // Log stack trace for debugging

  res.json({
    message: err.message,
    // Provide stack trace only in development environment for security
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
