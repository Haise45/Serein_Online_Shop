const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateAccessToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file");
    process.exit(1); // Không thể tạo token nếu thiếu secret
  }

  const expiresInEnv = process.env.JWT_EXPIRES_IN;
  let expiresInSeconds;
  if (expiresInEnv) {
    expiresInSeconds = parseInt(expiresInEnv, 10);
    if (isNaN(expiresInSeconds) || expiresInSeconds <= 0) {
      console.warn(
        `Invalid JWT_EXPIRES_IN value "${expiresInEnv}". Using default 6 hours (21600s)..`
      );
      expiresInSeconds = 21600; // Default Access Token: 6 tiếng
    }
  } else {
    console.warn("JWT_EXPIRES_IN not set. Using default 6 hours (21600s).");
    expiresInSeconds = 21600;
  }
  console.log(
    `Generating Access Token with expiresIn: ${expiresInSeconds} seconds`
  );
  return jwt.sign({ id: userId }, secret, { expiresIn: expiresInSeconds });
};

const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file");
    process.exit(1);
  }

  const expiresInEnv = process.env.JWT_REFRESH_EXPIRES_IN;
  let expiresInValue;

  if (expiresInEnv) {
    // Nếu dùng giây
    const seconds = parseInt(expiresInEnv, 10);
    if (!isNaN(seconds) && seconds > 0) {
      expiresInValue = seconds;
    } else {
      console.warn(
        `Invalid JWT_REFRESH_EXPIRES_IN_SECONDS value "${expiresInEnv}". Using default 7 days.`
      );
      expiresInValue = "7d"; // Default Refresh Token: 7 ngày
    }
  } else {
    console.warn(
      "JWT_REFRESH_EXPIRES_IN_SECONDS not set. Using default 7 days."
    );
    expiresInValue = "7d"; // Default 7 ngày
  }

  console.log(`Generating Refresh Token with expiresIn: ${expiresInValue}`);
  return jwt.sign({ id: userId }, secret, { expiresIn: expiresInValue });
};

module.exports = { generateAccessToken, generateRefreshToken };
