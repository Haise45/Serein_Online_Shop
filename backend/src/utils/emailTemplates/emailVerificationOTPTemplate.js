const emailVerificationOTPTemplate = (userName, otp) => {
  const shopName = process.env.SHOP_NAME || "Serein Shop";
  const logoUrl = process.env.SHOP_LOGO_URL || null;

  return `
<!DOCTYPE html><html lang="vi">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác Thực Địa Chỉ Email Của Bạn</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .content { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; }
       .header h2 { color: #0d6efd; margin: 0; font-size: 24px; font-weight: 600; }
       .footer { text-align: center; padding: 20px; margin-top: 30px; font-size: 12px; color: #6c757d; }
       .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d6efd; background-color: #e7f1ff; padding: 12px 24px; border-radius: 8px; display: inline-block; margin: 20px 0; border: 1px dashed #b8d4fe; }
    </style>
</head>
<body>
    <div style="background-color: #f4f4f7; padding: 20px;">
        <div class="content">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" alt="${shopName} Logo" style="max-width: 150px; margin-bottom: 15px;"><br>` : ""}
                <h2>Xác Thực Địa Chỉ Email</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào ${userName || "bạn"},</p>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>${shopName}</strong>.</p>
                <p>Vui lòng sử dụng mã OTP sau đây để hoàn tất việc xác thực email. Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
                <div style="text-align:center;">
                    <div class="otp-code">${otp}</div>
                </div>
                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
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

module.exports = emailVerificationOTPTemplate;