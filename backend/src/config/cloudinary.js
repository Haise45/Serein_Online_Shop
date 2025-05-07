const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config(); // Load biến môi trường

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Luôn sử dụng HTTPS cho URLs
});

console.log(
  "Cloudinary configured with Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME ? "Loaded" : "MISSING"
);

module.exports = cloudinary;
