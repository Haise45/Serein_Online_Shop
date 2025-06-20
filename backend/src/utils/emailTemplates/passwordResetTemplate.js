require("dotenv").config();

const passwordResetTemplate = (userName, resetUrl) => {
  const shopName = process.env.SHOP_NAME || "Serein Shop";
  const logoUrl = process.env.SHOP_LOGO_URL || null;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"><title>Yêu Cầu Đặt Lại Mật Khẩu</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .button { background-color: #0d6efd; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .button:hover { background-color: #0b5ed7; }
       .content { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; }
       .header h2 { color: #0d6efd; margin: 0; font-size: 24px; font-weight: 600; }
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
                <h2>Yêu Cầu Đặt Lại Mật Khẩu</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào ${userName || "bạn"},</p>
                <p>Bạn nhận được email này vì đã có yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>${shopName}</strong>.</p>
                <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn sau <strong>10 phút</strong>.</p>
                <p style="text-align:center; margin: 30px 0;">
                    <a href="${resetUrl}" class="button" target="_blank">Đặt Lại Mật Khẩu</a>
                </p>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>
                <p style="margin-top: 25px;">Trân trọng,<br>Đội ngũ ${shopName}</p>
            </div>
            <div class="footer">
                © ${new Date().getFullYear()} ${shopName}.
            </div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = passwordResetTemplate;
