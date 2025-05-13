module.exports = {
  testEnvironment: "node", // Môi trường chạy test là Node.js
  // setupFilesAfterEnv: ["./jest.setup.js"], // File setup chạy sau khi môi trường được thiết lập
  testTimeout: 30000, // Tăng timeout nếu test cần thời gian (vd: DB memory khởi động)
};
