require("dotenv").config();
const { generateOrderItemsHTML } = require("./emailParts");
const { formatCurrency } = require("./emailParts");

const requestAdminNotificationTemplate = (
  requestType,
  order,
  requestDetails
) => {
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  const adminOrderUrl = `${
    process.env.ADMIN_URL ||
    (process.env.FRONTEND_URL || "http://localhost:3000") + "/admin"
  }/orders/${order._id}`;
  const requestTypeText =
    requestType === "cancellation " ? "HỦY ĐƠN HÀNG" : "TRẢ HÀNG/HOÀN TIỀN";
  const statusColor = requestType === "cancellation" ? "#ffc107" : "#dc3545";

  const generateImageHTML = (urls) => {
    if (!urls || urls.length === 0) return "";
    let html =
      '<p style="margin-top:15px;"><strong>Hình ảnh đính kèm:</strong></p><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
    urls.forEach((url) => {
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
       .order-summary { margin-top: 20px; font-size: 14px; }
       .order-summary td { padding: 6px 0; }
       .mobile-label { display: none; }

       @media screen and (max-width: 600px) {
           .content { padding: 20px 15px !important; width: 100% !important; box-sizing: border-box; }
           .product-table thead { display: none !important; }
           .product-table tr, .product-table td { display: block !important; width: 100% !important; box-sizing: border-box; }
           .product-table tr { border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 15px; }
           .product-table tbody tr:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
           .product-table td { border: none !important; padding: 8px 0 !important; text-align: right !important; overflow: auto; }
           .product-table td.product-cell { display: block !important; padding-top: 0 !important; padding-bottom: 10px !important; text-align: left !important; }
           .product-table td.product-cell img { margin-bottom: 10px; }
           .mobile-label { display: inline-block !important; font-weight: bold; float: left; }
           .order-summary-wrapper { display: block !important; }
           .order-summary { width: 100% !important; max-width: 100% !important; }
           .button { width: 100% !important; box-sizing: border-box; text-align: center; }
       }
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
                <div class="order-summary-wrapper" style="display: flex; justify-content: flex-end;">
                  <table class="order-summary" style="width:100%; max-width: 380px; margin-left: auto;">
                      <tr><td>Tạm tính:</td><td style="text-align:right;">${formatCurrency(
                        order.itemsPrice
                      )}</td></tr>
                      ${
                        order.discountAmount > 0
                          ? `<tr><td>Giảm giá (${
                              order.appliedCouponCode || ""
                            }):</td><td style="text-align:right; color: #198754;">-${formatCurrency(
                              order.discountAmount
                            )}</td></tr>`
                          : ""
                      }
                      <tr><td>Phí vận chuyển:</td><td style="text-align:right;">${formatCurrency(
                        order.shippingPrice
                      )}</td></tr>
                      <tr style="font-weight: bold; font-size: 1.1em;"><td style="border-top: 1px solid #ccc; padding-top: 10px;">Tổng cộng:</td><td style="text-align:right; border-top: 1px solid #ccc; padding-top: 10px;">${formatCurrency(
                        order.totalPrice
                      )}</td></tr>
                  </table>
                </div>
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
