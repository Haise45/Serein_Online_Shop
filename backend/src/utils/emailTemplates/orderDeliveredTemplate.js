require("dotenv").config();
const { generateOrderItemsHTML } = require("./emailParts");

const orderDeliveredTemplate = (userName, order, guestTrackingUrl = null) => {
  const shopName = process.env.SHOP_NAME || "Serein Shop";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const refundPolicyUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/policy`;
  let orderDetailUrl = `${process.env.FRONTEND_URL}/profile/orders/${order._id}`;
  if (guestTrackingUrl) {
    orderDetailUrl = guestTrackingUrl;
  }

  return `
<!DOCTYPE html><html lang="vi">
<head>
    <meta charset="UTF-8"><title>Đơn Hàng #${order._id
      .toString()
      .slice(-6)} Đã Giao Thành Công</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .button { background-color: #6c757d; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; }
       .header h2 { color: #198754; margin: 0; font-size: 24px; font-weight: 600; }
       .footer { text-align: center; padding: 20px; margin-top: 30px; font-size: 12px; color: #6c757d; }
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
                <h2>Đơn Hàng Đã Giao Thành Công!</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào ${userName || "quý khách"},</p>
                <p>Chúng tôi vui mừng thông báo đơn hàng <strong>#${order._id
                  .toString()
                  .slice(-6)}</strong> của bạn đã được giao thành công.</p>
                <p>${shopName} hy vọng bạn hài lòng với sản phẩm và trải nghiệm mua sắm lần này!</p>

                ${generateOrderItemsHTML(order.orderItems)}

                <p style="text-align:center; margin: 30px 0;">
                    <a href="${orderDetailUrl}" class="button" target="_blank">Xem lại đơn hàng</a>
                </p>
                <p style="font-size: 13px; color: #6c757d;">Nếu có vấn đề với sản phẩm, vui lòng tham khảo <a href="${refundPolicyUrl}" target="_blank">Chính sách đổi trả</a> của chúng tôi hoặc liên hệ bộ phận Chăm sóc khách hàng.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} ${shopName}.</div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = orderDeliveredTemplate;
