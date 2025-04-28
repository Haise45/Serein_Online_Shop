const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Đảm bảo thư mục log tồn tại
const logDir = process.env.LOG_DIR || "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3, // Mức log cho request HTTP
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : process.env.LOG_LEVEL || "warn";
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const transports = [
  // Log ra console (luôn luôn, nhưng format khác nhau)
  new winston.transports.Console({
    format: consoleFormat, // Format màu cho console
    level: "debug", // Log mọi thứ ra console khi dev
  }),
  // Log lỗi vào file error.log
  new winston.transports.File({
    filename: path.join(logDir, "error.log"),
    level: "error", // Chỉ log lỗi
    format: format, // Format không màu cho file
  }),
  // Log tất cả (từ mức info trở lên) vào file combined.log
  new winston.transports.File({
    filename: path.join(logDir, "combined.log"),
    level: "info", // Log từ info trở lên
    format: format,
  }),
];

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false, // Không thoát nếu có lỗi khi ghi log
});

// Middleware để log HTTP requests
const httpLoggerMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - ${req.ip}`;
    // Sử dụng mức 'http' hoặc 'info' tùy bạn muốn
    if (res.statusCode >= 400) {
      logger.warn(message); // Log warning hoặc error cho client/server errors
    } else {
      logger.http(message); // Log các request thành công
    }
  });
  next();
};

module.exports = logger;
module.exports.httpLoggerMiddleware = httpLoggerMiddleware;
