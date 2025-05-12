const express = require('express');
const {
    getAdminNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} = require('../controllers/notificationController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả các route này chỉ dành cho Admin
router.use(protect, isAdmin);

// GET /api/v1/notifications/admin - Lấy danh sách thông báo cho admin
router.get('/admin', getAdminNotifications); // Hỗ trợ ?page, ?limit, ?isRead

// PUT /api/v1/notifications/admin/:id/mark-as-read - Đánh dấu đã đọc
router.put('/admin/:id/mark-as-read', markNotificationAsRead);

// PUT /api/v1/notifications/admin/mark-all-as-read - Đánh dấu tất cả đã đọc
router.put('/admin/mark-all-as-read', markAllNotificationsAsRead);

module.exports = router;