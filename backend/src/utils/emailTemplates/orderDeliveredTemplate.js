require("dotenv").config();

const orderDeliveredTemplate = (userName, order) => {
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const frontendOrderUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/my-orders/${order._id}`;
  const refundPolicyUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/policy`; // Cần có trang này trên frontend

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đơn Hàng #${order._id
      .toString()
      .slice(-6)} Đã Giao Thành Công</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #333333; background-color: #f4f4f7; }
       table { border-collapse: collapse; width: 100%; } td, th { padding: 0; vertical-align: top; } a { color: #0d6efd; text-decoration: none; }
       .button { background-color: #198754; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .button:hover { background-color: #157347; } .container { background-color: #f4f4f7; padding: 20px; }
       .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; } .header img { max-width: 150px; height: auto; margin-bottom: 15px;}
       .header h2 { color: #198754; margin: 0; font-size: 24px; font-weight: 600; } .footer { text-align: center; padding: 10px; margin-top: 30px; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
    </style>
</head>
<body>
    <table class="container" role="presentation" cellpadding="0" cellspacing="0">
        <tr>
            <td>
                <table class="content" role="presentation" cellpadding="0" cellspacing="0">
                    <!-- Header -->
                    <tr>
                        <td class="header">
                            ${
                              logoUrl
                                ? `<img src="${logoUrl}" alt="${shopName} Logo"><br><br>`
                                : ""
                            }
                            <h2>Đơn Hàng Đã Giao Thành Công!</h2>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding-left: 20px; padding-right: 20px;">
                            <p style="margin-bottom:15px; font-size: 15px;">Xin chào ${
                              userName || "quý khách"
                            },</p>
                            <p style="margin-bottom:15px; font-size: 15px;">Chúng tôi vui mừng thông báo đơn hàng <strong>#${order._id
                              .toString()
                              .slice(
                                -6
                              )}</strong> của bạn đã được giao thành công đến địa chỉ nhận hàng.</p>
                            <p style="margin-bottom:25px; font-size: 15px;">${shopName} hy vọng bạn hài lòng với sản phẩm và trải nghiệm mua sắm lần này!</p>

                            <p style="text-align:center; margin-top: 30px;">
                                <a href="${frontendOrderUrl}" class="button" target="_blank" style="background-color:#6c757d; color:#ffffff !important;">Xem lại đơn hàng</a>
                                <!-- Thêm nút đánh giá nếu muốn -->
                                <!-- <a href="..." class="button" target="_blank" style="margin-left: 10px;">Đánh giá sản phẩm</a> -->
                            </p>
                            <p style="margin-top: 25px; font-size: 13px; color: #6c757d;">Nếu có bất kỳ vấn đề gì với sản phẩm hoặc bạn có nhu cầu đổi/trả, vui lòng tham khảo <a href="${refundPolicyUrl}" target="_blank" style="color:#0d6efd;">Chính sách đổi trả</a> của chúng tôi hoặc liên hệ bộ phận Chăm sóc khách hàng để được hỗ trợ.</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="footer">
                            © ${new Date().getFullYear()} ${shopName}. Mọi quyền được bảo lưu.<br>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};
module.exports = orderDeliveredTemplate;
