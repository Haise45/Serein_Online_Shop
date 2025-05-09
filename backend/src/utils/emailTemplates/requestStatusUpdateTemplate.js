require("dotenv").config();

const requestStatusUpdateTemplate = (
  userName,
  order,
  actionType,
  isApproved,
  adminReason = null
) => {
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const frontendOrderUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/tai-khoan/don-hang/${order._id}`;
  const requestTypeText =
    actionType === "cancellation" ? "hủy đơn hàng" : "trả hàng/hoàn tiền";
  const statusText = isApproved
    ? actionType === "cancellation"
      ? "ĐÃ ĐƯỢC CHẤP NHẬN"
      : "ĐÃ ĐƯỢC CHẤP NHẬN"
    : actionType === "cancellation"
    ? "BỊ TỪ CHỐI"
    : "BỊ TỪ CHỐI";
  const statusColor = isApproved ? "#198754" : "#dc3545"; // Xanh lá cho chấp nhận, đỏ cho từ chối

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cập Nhật Yêu Cầu ${
      requestTypeText.charAt(0).toUpperCase() + requestTypeText.slice(1)
    } - Đơn #${order._id.toString().slice(-6)}</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #333333; background-color: #f4f4f7; }
       table { border-collapse: collapse; width: 100%; } td, th { padding: 0;  } a { color: #0d6efd; text-decoration: none; }
       .button { background-color: #0d6efd; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .button:hover { background-color: #0b5ed7; } .container { background-color: #f4f4f7; padding: 20px; }
       .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; } .header img { max-width: 150px; height: auto; margin-bottom: 15px;}
       .header h2 { margin: 0; font-size: 24px; font-weight: 600; } .footer { text-align: center; padding: 10px; margin-top: 30px; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
       .reason-box { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin-top: 15px; border-radius: 6px; font-size: 14px; }
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
                            <h2 style="color:${statusColor};">Yêu Cầu ${requestTypeText.toUpperCase()} ${statusText}</h2>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding-left: 20px; padding-right: 20px; font-size: 15px;">
                            <p>Xin chào ${userName || "quý khách"},</p>
                            <p>Yêu cầu ${requestTypeText} của bạn cho đơn hàng <strong>#${order._id
    .toString()
    .slice(-6)}</strong> đã được ${shopName} xử lý.</p>
                            <p>Kết quả: <strong style="color:${statusColor}; font-size: 1.1em;">${statusText}</strong></p>

                            ${
                              isApproved
                                ? `
                                ${
                                  actionType === "cancellation"
                                    ? "<p>Đơn hàng của bạn đã được hủy thành công. Nếu bạn đã thanh toán trước, chúng tôi sẽ tiến hành hoàn tiền theo chính sách trong thời gian sớm nhất.</p>"
                                    : ""
                                }
                                ${
                                  actionType === "refund"
                                    ? "<p>Yêu cầu hoàn tiền của bạn đã được chấp nhận. Chúng tôi sẽ xử lý hoàn tiền cho bạn theo chính sách trong thời gian sớm nhất.</p>"
                                    : ""
                                }
                            `
                                : `
                                ${
                                  adminReason
                                    ? `
                                <div class="reason-box">
                                    <strong>Lý do từ chối:</strong><br>
                                    ${adminReason.replace(/\n/g, "<br>")}
                                </div>
                                `
                                    : ""
                                }
                                <p style="margin-top: 15px;">Đơn hàng của bạn sẽ tiếp tục được xử lý theo trạng thái trước đó. Nếu bạn có thắc mắc, vui lòng liên hệ bộ phận hỗ trợ khách hàng.</p>
                            `
                            }

                            <p style="text-align:center; margin-top: 30px;">
                                <a href="${frontendOrderUrl}" class="button" target="_blank" style="color:#ffffff !important;">Xem lại chi tiết đơn hàng</a>
                            </p>
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
module.exports = requestStatusUpdateTemplate;
