require("dotenv").config();

const accountSuspendedTemplate = (
  userName,
  reason,
  suspensionEndDate = null
) => {
  const shopName = process.env.SHOP_NAME || "Serein Shop";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const contactEmail = process.env.SHOP_CONTACT_EMAIL || "support@serein.shop";

  const endDateText = suspensionEndDate
    ? `Việc đình chỉ này có hiệu lực đến hết ngày: <strong>${new Date(
        suspensionEndDate
      ).toLocaleDateString("vi-VN")}</strong>.`
    : "Việc đình chỉ này là vô thời hạn cho đến khi có thông báo mới từ chúng tôi.";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"><title>Thông Báo Đình Chỉ Tài Khoản</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .content { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; }
       .header h2 { color: #dc3545; margin: 0; font-size: 24px; font-weight: 600; }
       .reason-box { background-color: #fff3f3; border: 1px solid #f5c6cb; padding: 15px; margin-top: 15px; border-radius: 6px; }
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
                <h2>Thông Báo Đình Chỉ Tài Khoản</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào ${userName || "bạn"},</p>
                <p>Chúng tôi rất tiếc phải thông báo rằng tài khoản của bạn tại <strong>${shopName}</strong> đã bị đình chỉ do vi phạm chính sách của chúng tôi.</p>
                <div class="reason-box">
                    <strong>Lý do đình chỉ:</strong><br>
                    <p style="margin-top: 5px; font-style: italic;">${reason.replace(
                      /\n/g,
                      "<br>"
                    )}</p>
                </div>
                <p style="margin-top: 20px;">${endDateText}</p>
                <p>Trong thời gian này, bạn sẽ không thể đăng nhập và thực hiện các giao dịch trên hệ thống. Nếu bạn cho rằng đây là một sự nhầm lẫn hoặc muốn khiếu nại, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi tại <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
                <p style="margin-top: 25px;">Trân trọng,<br>Đội ngũ ${shopName}</p>
            </div>
             <div class="footer">© ${new Date().getFullYear()} ${shopName}.</div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = accountSuspendedTemplate;
