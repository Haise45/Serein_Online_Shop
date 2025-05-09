require("dotenv").config();

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
    requestType === "cancellation" ? "HỦY ĐƠN HÀNG" : "TRẢ HÀNG/HOÀN TIỀN";
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
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Yêu Cầu ${requestTypeText} Mới - Đơn #${order._id
    .toString()
    .slice(-6)}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #333333; background-color: #f4f4f7; }
        table { border-collapse: collapse; width: 100%; } td, th { padding: 0;  } a { color: #0d6efd; text-decoration: none; }
        .button { background-color: #0d6efd; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
        .button:hover { background-color: #0b5ed7; } .container { background-color: #f4f4f7; padding: 20px; }
        .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .header { text-align: center; padding: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; } .header img { max-width: 150px; height: auto; margin-bottom: 15px;}
        .header h2 { margin: 0; font-size: 24px; font-weight: 600; } .footer { text-align: center; padding: 10px; margin-top: 30px; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
        ul { padding-left: 20px; margin-top: 5px; } li { margin-bottom: 5px; }
        blockquote { border-left: 4px solid #e9ecef; padding-left: 15px; margin: 15px 0; font-style: italic; color: #495057; }
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
                            <h2 style="color:${statusColor};">⚠️ Có Yêu Cầu ${requestTypeText} Mới</h2>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding-left: 20px; padding-right: 20px; font-size: 15px;">
                            <p>Xin chào đội ngũ Admin,</p>
                            <p>Khách hàng <strong>${
                              order.user?.name || "(Không tên)"
                            }</strong> (Email: ${
    order.user?.email || "(Không email)"
  }) vừa gửi yêu cầu <strong>${requestTypeText.toLowerCase()}</strong> cho đơn hàng <strong>#${order._id
    .toString()
    .slice(-6)}</strong>.</p>
                            <p style="margin-top: 20px;"><strong>Lý do khách hàng cung cấp:</strong></p>
                            <blockquote>
                                ${
                                  requestDetails?.reason
                                    ? requestDetails.reason.replace(
                                        /\n/g,
                                        "<br>"
                                      )
                                    : "(Khách hàng không cung cấp lý do)"
                                }
                            </blockquote>
                            ${generateImageHTML(requestDetails?.imageUrls)}

                            <p style="margin-top: 25px;"><strong>Thông tin tóm tắt đơn hàng:</strong></p>
                            <ul>
                                <li>Mã đơn hàng: ${order._id}</li>
                                <li>Ngày đặt: ${new Date(
                                  order.createdAt
                                ).toLocaleString("vi-VN")}</li>
                                <li>Tổng tiền: ${formatCurrency(
                                  order.totalPrice
                                )}</li>
                                <li>Trạng thái trước yêu cầu: ${
                                  order.previousStatus || order.status
                                }</li>
                            </ul>
                            <p style="text-align:center; margin-top: 30px;">
                                <a href="${adminOrderUrl}" class="button" target="_blank" style="color:#ffffff !important;">Xem và Xử Lý Ngay</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="footer">
                           Thông báo tự động từ hệ thống ${shopName}.
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
module.exports = requestAdminNotificationTemplate;
