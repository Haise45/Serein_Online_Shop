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

const server = app.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections (e.g., DB connection issues after initial connect)
process.on("unhandledRejection", (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
