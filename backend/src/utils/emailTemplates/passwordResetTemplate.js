require("dotenv").config();

// Hàm này nhận tên người dùng và URL đặt lại làm đối số
const passwordResetTemplate = (userName, resetUrl) => {
  // Lấy tên shop từ biến môi trường hoặc đặt giá trị mặc định
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  // Lấy URL logo từ biến môi trường hoặc đặt giá trị mặc định/null
  const logoUrl = process.env.SHOP_LOGO_URL || null; // Ví dụ: 'https://yourshop.com/logo.png'

  // Sử dụng template literals (dấu ``) để dễ dàng nhúng biến và viết HTML
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* CSS Reset cơ bản */
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; }
        table { border-collapse: collapse; width: 100%; }
        td { padding: 0; vertical-align: top; }
        a { color: #007bff; text-decoration: none; }
        .button { background-color: #007bff; color: #ffffff; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-weight: bold; }
        .button:hover { background-color: #0056b3; }
        .container { background-color: #f8f9fa; padding: 20px; }
        .content { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e9ecef; border-radius: 8px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 20px; }
        .footer { text-align: center; padding-block: 20px; margin-top: 20px; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
    </style>
</head>
<body>
    <table class="container" role="presentation" style="width:100%;background-color:#f8f9fa;padding:20px 0;" cellpadding="0" cellspacing="0">
        <tr>
            <td>
                <table class="content" role="presentation" style="max-width:600px;margin:0 auto;background-color:#ffffff;padding:30px;border:1px solid #e9ecef;border-radius:8px;" cellpadding="0" cellspacing="0">
                    <!-- Header -->
                    <tr>
                        <td class="header" style="text-align:center;padding-bottom:20px;border-bottom:1px solid #e9ecef;margin-bottom:20px;">
                            ${
                              logoUrl
                                ? `<img src="${logoUrl}" alt="${shopName} Logo" width="150"><br><br>`
                                : ""
                            }
                            <h2 style="color:#343a40;margin:0;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:20px; color:#343a40;">
                            <p style="margin-bottom:15px;">Xin chào ${
                              userName || "bạn"
                            },</p>
                            <p style="margin-bottom:15px;">Bạn nhận được email này vì đã có yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại ${shopName}.</p>
                            <p style="margin-bottom:25px;">Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
                            <p style="text-align:center;margin-bottom:25px;">
                                <a href="${resetUrl}" class="button" target="_blank" style="background-color:#007bff;color:#ffffff !important;padding:12px 25px;text-align:center;text-decoration:none;display:inline-block;border-radius:5px;font-weight:bold;">Đặt Lại Mật Khẩu</a>
                            </p>
                            <p style="margin-bottom:15px;">Liên kết này sẽ hết hạn sau <strong>10 phút</strong>.</p>
                            <p style="margin-bottom:15px;">Nếu nút trên không hoạt động, bạn có thể sao chép và dán URL sau vào trình duyệt:</p>
                            <p style="word-break:break-all;margin-bottom:25px;"><a href="${resetUrl}" target="_blank" style="color:#007bff;text-decoration:underline;">${resetUrl}</a></p>
                            <p style="margin-bottom:0;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="footer" style="text-align:center;padding:20px;margin-top:20px;font-size:12px;color:#6c757d;border-top:1px solid #e9ecef;">
                            © ${new Date().getFullYear()} ${shopName}. All rights reserved.<br>
                            <!-- Thêm địa chỉ hoặc thông tin liên hệ nếu cần -->
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

module.exports = passwordResetTemplate;
