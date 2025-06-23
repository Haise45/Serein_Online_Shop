require("dotenv").config();
const { generateOrderItemsHTML } = require("./emailParts");

const requestStatusUpdateTemplate = (
  userName,
  order,
  actionType,
  isApproved,
  adminReason = null
) => {
  const shopName = process.env.SHOP_NAME || "Serein Shop";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const frontendOrderUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/profile/orders/${order._id}`;
  const requestTypeText =
    actionType === "cancellation" ? "hủy đơn hàng" : "trả hàng/hoàn tiền";
  const statusText = isApproved ? "ĐÃ ĐƯỢC CHẤP NHẬN" : "BỊ TỪ CHỐI";
  const statusColor = isApproved ? "#198754" : "#dc3545";

  return `
<!DOCTYPE html><html lang="vi">
<head>
    <meta charset="UTF-8"><title>Cập Nhật Yêu Cầu ${
      requestTypeText.charAt(0).toUpperCase() + requestTypeText.slice(1)
    }</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .button { background-color: #0d6efd; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; }
       .header h2 { margin: 0; font-size: 24px; font-weight: 600; }
       .footer { text-align: center; padding: 20px; margin-top: 30px; font-size: 12px; color: #6c757d; }
       .reason-box { background-color: #fff3f3; border: 1px solid #f5c6cb; padding: 15px; margin-top: 15px; border-radius: 6px; font-size: 14px; }
    </style>
</head>
<body>
    <div style="background-color: #f4f4f7; padding: 20px;">
        <div class="content">
            <div class="header">
                ${
                  logoUrl
                    ? `<img src="${logoUrl}" alt="${shopName} Logo" style="max-width: 150px; margin-bottom: 15px;"><br>`
                    : ""
                }
                <h2 style="color:${statusColor};">Yêu Cầu Của Bạn ${statusText}</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào ${userName || "quý khách"},</p>
                <p>Yêu cầu ${requestTypeText} của bạn cho đơn hàng <strong>#${order._id
    .toString()
    .slice(-6)}</strong> đã được xử lý.</p>
                <p>Kết quả: <strong style="color:${statusColor}; font-size: 1.1em;">${statusText}</strong></p>

                ${generateOrderItemsHTML(order.orderItems)}

                ${
                  isApproved
                    ? actionType === "cancellation"
                      ? "<p>Đơn hàng đã được hủy thành công. Nếu đã thanh toán, chúng tôi sẽ tiến hành hoàn tiền sớm nhất.</p>"
                      : "<p>Yêu cầu hoàn tiền đã được chấp nhận. Chúng tôi sẽ xử lý hoàn tiền sớm nhất.</p>"
                    : (adminReason
                        ? `<div class="reason-box"><strong>Lý do từ chối:</strong><br>${adminReason.replace(
                            /\n/g,
                            "<br>"
                          )}</div>`
                        : "") +
                      "<p style='margin-top: 15px;'>Đơn hàng sẽ tiếp tục được xử lý. Vui lòng liên hệ hỗ trợ nếu bạn có thắc mắc.</p>"
                }

                <p style="text-align:center; margin: 30px 0;">
                    <a href="${frontendOrderUrl}" class="button" target="_blank">Xem lại chi tiết đơn hàng</a>
                </p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} ${shopName}.</div>
        </div>
    </div>
</body>
</html>`;
};
module.exports = requestStatusUpdateTemplate;
