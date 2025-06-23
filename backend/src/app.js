const express = require("express");
const cors = require("cors");
const path = require("path");
const { httpLoggerMiddleware } = require("./utils/logger");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { protectOptional } = require("./middlewares/authMiddleware");
const identifyCartUser = require("./middlewares/identifyCartUser");
const identifyWishlistUser = require("./middlewares/identifyWishlistUser");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const locationRoutes = require("./routes/locationRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const cartRoutes = require("./routes/cartRoutes");
const couponRoutes = require("./routes/couponRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { productReviewRouter, reviewRouter } = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const attrttributeRoutes = require("./routes/attributeRoutes");

// Import error handler middleware
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://online-store-delta-seven.vercel.app",
  "http://localhost:3000", // Nếu bạn dev local frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // origin có thể là undefined (Postman hoặc server to server request)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("Not allowed by CORS"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", true);
}
app.use(httpLoggerMiddleware);
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());
app.set("query parser", "extended");

// Serve static files (hình ảnh upload)
// Request đến /uploads/... sẽ tìm file trong thư mục public/uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// API Routes
app.get("/", (req, res) => {
  res.send("Welcome to Serein Shop API");
});

app.get("/api/v1", (req, res) => {
  res.send("Serein Shop API is running...");
});

app.use("/api/v1/cart", protectOptional, identifyCartUser);
app.use("/api/v1/wishlist", protectOptional, identifyWishlistUser);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/locations", locationRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/products/:productId/reviews", productReviewRouter);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/attributes", attrttributeRoutes);

// Custom Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
