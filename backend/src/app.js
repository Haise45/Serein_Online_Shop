const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const locationRoutes = require("./routes/locationRoutes");
// const uploadRoutes = require('./routes/uploadRoutes'); // Sẽ thêm sau

// Import error handler middleware
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // Cho phép tất cả origin được gửi credentials
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Logging HTTP requests ở chế độ dev
}
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());

// Serve static files (hình ảnh upload)
// Request đến /uploads/... sẽ tìm file trong thư mục public/uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// API Routes
app.get("/api/v1", (req, res) => {
  res.send("Shop API is running...");
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/locations", locationRoutes);
// app.use('/api/v1/upload', uploadRoutes); // Sẽ thêm sau

// Custom Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
