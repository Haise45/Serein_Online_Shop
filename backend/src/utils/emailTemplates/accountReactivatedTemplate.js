require("dotenv").config();

const accountReactivatedTemplate = (userName) => {
  const shopName = process.env.SHOP_NAME || "Serein Shop";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"><title>Thông Báo Kích Hoạt Lại Tài Khoản</title>
     <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .button { background-color: #198754; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 6px; font-weight: 500; font-size: 15px; }
       .content { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
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
                <h2>Tài Khoản Đã Được Kích Hoạt Lại</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào ${userName || "bạn"},</p>
                <p>Chúng tôi vui mừng thông báo rằng tài khoản của bạn tại <strong>${shopName}</strong> đã được kích hoạt trở lại. Bây giờ bạn có thể đăng nhập và tiếp tục trải nghiệm mua sắm.</p>
                <p style="text-align:center; margin-top: 30px; margin-bottom: 30px;">
                    <a href="${loginUrl}" class="button" target="_blank">Đăng nhập ngay</a>
                </p>
                <p>Chúng tôi mong rằng bạn sẽ tuân thủ các chính sách của cửa hàng để đảm bảo một môi trường mua sắm an toàn và công bằng. Cảm ơn sự hợp tác của bạn.</p>
                <p style="margin-top: 25px;">Trân trọng,<br>Đội ngũ ${shopName}</p>
            </div>
             <div class="footer">© ${new Date().getFullYear()} ${shopName}.</div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = accountReactivatedTemplate;
