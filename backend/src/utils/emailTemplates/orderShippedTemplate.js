require("dotenv").config();

const orderShippedTemplate = (userName, order) => {
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const frontendOrderUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/my-orders/${order._id}`;
  // Giả sử bạn có thể thêm mã vận đơn vào đơn hàng sau này
  // const trackingNumber = order.trackingNumber || null;
  // const shippingCarrier = order.shippingCarrier || null;
  // const trackingLink = order.trackingLink || null; // Link tra cứu vận đơn

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đơn Hàng #${order._id.toString().slice(-6)} Đã Được Giao Đi</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #333333; background-color: #f4f4f7; }
       table { border-collapse: collapse; width: 100%; } td, th { padding: 0;  } a { color: #0d6efd; text-decoration: none; }
       .button { background-color: #0d6efd; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .button:hover { background-color: #0b5ed7; } .container { background-color: #f4f4f7; padding: 20px; }
       .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; } .header img { max-width: 150px; height: auto; margin-bottom: 15px;}
       .header h2 { color: #0d6efd; margin: 0; font-size: 24px; font-weight: 600; } .footer { text-align: center; padding: 10px; margin-top: 30px; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
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
                            <h2>Đơn Hàng Đã Được Giao Đi!</h2>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding-left: 20px; padding-right: 20px;">
                            <p style="margin-bottom:15px; font-size: 15px;">Xin chào ${
                              userName || "quý khách"
                            },</p>
                            <p style="margin-bottom:15px; font-size: 15px;">Tin vui! Đơn hàng <strong>#${order._id
                              .toString()
                              .slice(
                                -6
                              )}</strong> của bạn tại ${shopName} đã được bàn giao cho đơn vị vận chuyển.</p>
                            <p style="margin-bottom:25px; font-size: 15px;">Dự kiến thời gian giao hàng là trong vài ngày tới. Xin vui lòng chờ đợi.</p>

                            <p style="text-align:center; margin-top: 30px;">
                                <a href="${frontendOrderUrl}" class="button" target="_blank" style="color:#ffffff !important;">Xem lại đơn hàng</a>
                            </p>
                            <p style="margin-top: 25px; font-size: 15px;">Cảm ơn bạn đã mua sắm!</p>
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
module.exports = orderShippedTemplate;
