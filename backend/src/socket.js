const socketIo = require("socket.io");
const { protectOptional } = require("./middlewares/authMiddleware");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

let io; // Biến lưu trữ instance của Socket.IO server

// Lưu trữ các admin đang kết nối (userId -> socketId)
const adminSockets = new Map();

const initSocket = (httpServer) => {
  io = socketIo(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log("Socket.IO server initialized.");

  // Middleware xác thực cho Socket.IO (chỉ cho admin)
  // Client sẽ gửi token qua query hoặc auth object khi kết nối
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    // console.log('[Socket Auth] Token received:', token);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("role name").lean();

        if (user && user.role === "admin") {
          socket.user = user; // Gắn thông tin admin vào socket
          console.log(
            `[Socket Auth] Admin authenticated: ${user.name} (ID: ${user._id})`
          );
          next();
        } else {
          console.log(
            "[Socket Auth] Token valid but user is not admin or not found."
          );
          next(
            new Error("Authentication error: Not an admin or user not found.")
          );
        }
      } catch (err) {
        console.error("[Socket Auth] Token verification failed:", err.message);
        next(new Error("Authentication error: Token invalid or expired."));
      }
    } else {
      console.log("[Socket Auth] No token provided for socket connection.");
      next(new Error("Authentication error: No token provided."));
    }
  });

  io.on("connection", (socket) => {
    // Chỉ xử lý nếu socket đã được xác thực là admin
    if (socket.user && socket.user.role === "admin") {
      console.log(
        `Admin connected: ${socket.user.name} (Socket ID: ${socket.id})`
      );
      adminSockets.set(socket.user._id.toString(), socket.id); // Lưu socket ID của admin

      // Xử lý khi admin ngắt kết nối
      socket.on("disconnect", () => {
        console.log(
          `Admin disconnected: ${socket.user.name} (Socket ID: ${socket.id})`
        );
        // Xóa admin khỏi danh sách đang kết nối (nếu socketId khớp)
        if (adminSockets.get(socket.user._id.toString()) === socket.id) {
          adminSockets.delete(socket.user._id.toString());
        }
      });

    } else {
      // Nếu không phải admin (hoặc xác thực thất bại ở middleware io.use), ngắt kết nối
      console.log(
        "[Socket Connection] Non-admin or unauthenticated socket tried to connect. Disconnecting."
      );
      socket.disconnect(true);
    }
  });

  return io;
};

// Hàm để lấy instance io từ các module khác
const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

// Hàm gửi thông báo đến tất cả admin đang online
// Hoặc gửi đến một room cụ thể nếu bạn dùng room
const emitToAdmins = (eventName, data) => {
  if (!io) {
    console.warn("Socket.io not initialized, cannot emit event.");
    return;
  }
  console.log(
    `[Socket Emit] Emitting event "${eventName}" to all admins. Data:`,
    data ? JSON.stringify(data).substring(0, 100) + "..." : "No data"
  );
  io.to(Array.from(adminSockets.values())).emit(eventName, data); // Gửi tới các socket ID của admin
};

module.exports = { initSocket, getIo, emitToAdmins };
