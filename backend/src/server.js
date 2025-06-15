const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./socket");
require("dotenv").config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

const serverInstance = httpServer.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log("Cloudinary is configured.");
  } else {
    console.warn("Cloudinary IS NOT configured. Check environment variables.");
  }
  console.log("Socket.IO is attached to the HTTP server.");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack); // Log thêm stack trace để dễ debug
  // Đóng server một cách an toàn
  serverInstance.close(() => {
    console.log("Server closed due to unhandled rejection.");
    process.exit(1);
  });
});
