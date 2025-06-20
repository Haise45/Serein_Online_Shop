require("dotenv").config();
const { generateOrderItemsHTML } = require("./emailParts");

const requestAdminNotificationTemplate = (
  requestType,
  order,
  requestDetails
) => {
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  // Cần có ADMIN_URL trong .env hoặc dùng tạm link frontend
  const adminOrderUrl = `${
    process.env.ADMIN_URL ||
    (process.env.FRONTEND_URL || "http://localhost:3000") + "/admin"
  }/orders/${order._id}`;
  const requestTypeText =
    requestType === "cancellation " ? "HỦY ĐƠN HÀNG" : "TRẢ HÀNG/HOÀN TIỀN";
  const statusColor = requestType === "cancellation" ? "#ffc107" : "#dc3545"; // Vàng cho hủy, Đỏ cho refund
  const formatCurrency = (amount) =>
    amount?.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) ||
    "";

  const generateImageHTML = (urls) => {
    if (!urls || urls.length === 0) return "";
    let html =
      '<p style="margin-top:15px;"><strong>Hình ảnh đính kèm:</strong></p><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
    urls.forEach((url) => {
      // Đảm bảo URL là tuyệt đối
      const absoluteUrl = url.startsWith("http")
        ? url
        : `${
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
          }${url}`;
      html += `<a href="${absoluteUrl}" target="_blank" style="display: inline-block; border: 1px solid #ccc; border-radius: 4px; padding: 2px;"><img src="${absoluteUrl}" alt="Attachment" style="display: block; max-width: 80px; max-height: 80px;"></a>`;
    });
    html += "</div>";
    return html;
  };

  return `
<!DOCTYPE html><html lang="vi">
<head>
    <meta charset="UTF-8"><title>Yêu Cầu ${requestTypeText} Mới - Đơn #${order._id
    .toString()
    .slice(-6)}</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .button { background-color: #0d6efd; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; }
       .header h2 { margin: 0; font-size: 24px; font-weight: 600; }
       .footer { text-align: center; padding: 20px; margin-top: 30px; font-size: 12px; color: #6c757d; }
       blockquote { border-left: 4px solid #e9ecef; padding-left: 15px; margin: 15px 0; font-style: italic; color: #495057; }
    </style>
</head>
<body>
    <div style="background-color: #f4f4f7; padding: 20px;">
        <div class="content">
            <div class="header">
                <h2 style="color:${statusColor};">⚠️ Có Yêu Cầu ${requestTypeText} Mới</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào đội ngũ Admin,</p>
                <p>Khách hàng <strong>${
                  order.user?.name || "(Không tên)"
                }</strong> (Email: ${
    order.user?.email || order.guestOrderEmail || "(Không email)"
  }) vừa gửi yêu cầu <strong>${requestTypeText.toLowerCase()}</strong> cho đơn hàng <strong>#${order._id
    .toString()
    .slice(-6)}</strong>.</p>
                <p><strong>Lý do của khách hàng:</strong></p>
                <blockquote>${
                  requestDetails?.reason
                    ? requestDetails.reason.replace(/\n/g, "<br>")
                    : "(Không có lý do)"
                }</blockquote>
                ${generateImageHTML(requestDetails?.imageUrls)}

                ${generateOrderItemsHTML(order.orderItems)}

                <p style="text-align:center; margin: 30px 0;">
                    <a href="${adminOrderUrl}" class="button" target="_blank">Xem và Xử Lý Ngay</a>
                </p>
            </div>
            <div class="footer">Thông báo tự động từ hệ thống ${shopName}.</div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = requestAdminNotificationTemplate;
