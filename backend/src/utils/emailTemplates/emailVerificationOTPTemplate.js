const emailVerificationOTPTemplate = (userName, otp) => {
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  const logoUrl = process.env.SHOP_LOGO_URL || null;

  return `
<!DOCTYPE html><html lang="vi">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác Thực Địa Chỉ Email Của Bạn</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.6; color: #333333; background-color: #f4f4f7; }
       table { border-collapse: collapse; width: 100%; } td, th { padding: 0; vertical-align: top; } a { color: #0d6efd; text-decoration: none; }
       .button { background-color: #0d6efd; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .button:hover { background-color: #0b5ed7; } .container { background-color: #f4f4f7; padding: 20px 10px; }
       .content { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #dee2e6; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; } .header img { max-width: 150px; height: auto; margin-bottom: 15px;}
       .header h2 { color: #212529; margin: 0; font-size: 24px; font-weight: 600; } .footer { text-align: center; padding: 20px; margin-top: 30px; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
       .otp-code { font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0d6efd; background-color: #e9f5ff; padding: 10px 20px; border-radius: 6px; display: inline-block; margin: 20px 0; }
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
                            <h2>Xác Thực Địa Chỉ Email</h2>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding: 0 20px 0 20px; font-size: 15px;">
                            <p>Xin chào ${userName || "bạn"},</p>
                            <p>Cảm ơn bạn đã đăng ký tài khoản tại ${shopName}.</p>
                            <p>Vui lòng sử dụng mã OTP sau đây để hoàn tất việc xác thực địa chỉ email của bạn. Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
                            <div style="text-align:center;">
                                <span class="otp-code">${otp}</span>
                            </div>
                            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                            <p style="margin-top: 25px;">Trân trọng,<br>Đội ngũ ${shopName}</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="footer">
                            © ${new Date().getFullYear()} ${shopName}. Mọi quyền được bảo lưu.
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

module.exports = emailVerificationOTPTemplate;
