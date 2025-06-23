require("dotenv").config();
const { generateOrderItemsHTML } = require("./emailParts");

const orderConfirmationTemplate = (
  userName,
  order,
  guestTrackingUrl = null
) => {
  const shopName = process.env.SHOP_NAME || "Serein Shop";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  const orderDetailUrl = `${process.env.FRONTEND_URL}/profile/orders/${order._id}`;
  const { formatCurrency } = require("./emailParts");

  let trackingSection = "";
  if (guestTrackingUrl) {
    trackingSection = `<p style="text-align: center; margin: 30px 0;"><a href="${guestTrackingUrl}" target="_blank" class="button" style="background-color: #0d6efd; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500; display: inline-block;">Theo dõi đơn hàng</a></p>`;
  } else if (order.user) {
    trackingSection = `<p style="text-align: center; margin: 30px 0;"><a href="${orderDetailUrl}" target="_blank" class="button" style="background-color: #0d6efd; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 500; display: inline-block;">Xem đơn hàng của tôi</a></p>`;
  }

  return `
<!DOCTYPE html><html lang="vi">
<head>
    <meta charset="UTF-8"><title>Xác Nhận Đơn Hàng #${order._id
      .toString()
      .slice(-6)}</title>
    <style>
       body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; }
       .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border-radius: 8px; border: 1px solid #dee2e6; }
       .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 25px; }
       .header h2 { color: #198754; margin: 0; font-size: 24px; font-weight: 600; }
       .footer { text-align: center; padding: 20px; margin-top: 30px; font-size: 12px; color: #6c757d; }
       .order-summary { margin-top: 20px; font-size: 14px; }
       .order-summary td { padding: 6px 0; }
       .mobile-label { display: none; }

       @media screen and (max-width: 600px) {
           .content { padding: 20px 15px !important; width: 100% !important; box-sizing: border-box; }
           .product-table thead { display: none !important; }
           .product-table tr, .product-table td { display: block !important; width: 100% !important; box-sizing: border-box; }
           .product-table tr { border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 15px; }
           .product-table tbody tr:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
           .product-table td { border: none !important; padding: 8px 0 !important; text-align: right !important; overflow: auto; }
           .product-table td.product-cell { display: block !important; padding-top: 0 !important; padding-bottom: 10px !important; text-align: left !important; }
           .product-table td.product-cell img { margin-bottom: 10px; }
           .mobile-label { display: inline-block !important; font-weight: bold; float: left; }
           .order-summary-wrapper { display: block !important; }
           .order-summary { width: 100% !important; max-width: 100% !important; }
           .button { width: 100% !important; box-sizing: border-box; text-align: center; }
       }
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
                <h2>Xác Nhận Đơn Hàng</h2>
            </div>
            <div style="padding: 0 10px; font-size: 15px;">
                <p>Xin chào ${userName || "quý khách"},</p>
                <p>Cảm ơn bạn đã đặt hàng tại <strong>${shopName}</strong>! Đơn hàng #${order._id
    .toString()
    .slice(-6)} của bạn đã được ghi nhận và đang chờ xử lý.</p>
                ${generateOrderItemsHTML(order.orderItems)}
                <div class="order-summary-wrapper" style="display: flex; justify-content: flex-end;">
                  <table class="order-summary" style="width:100%; max-width: 380px; margin-left: auto;">
                      <tr><td>Tạm tính:</td><td style="text-align:right;">${formatCurrency(
                        order.itemsPrice
                      )}</td></tr>
                      ${
                        order.discountAmount > 0
                          ? `<tr><td>Giảm giá (${
                              order.appliedCouponCode || ""
                            }):</td><td style="text-align:right; color: #198754;">-${formatCurrency(
                              order.discountAmount
                            )}</td></tr>`
                          : ""
                      }
                      <tr><td>Phí vận chuyển:</td><td style="text-align:right;">${formatCurrency(
                        order.shippingPrice
                      )}</td></tr>
                      <tr style="font-weight: bold; font-size: 1.1em;"><td style="border-top: 1px solid #ccc; padding-top: 10px;">Tổng cộng:</td><td style="text-align:right; border-top: 1px solid #ccc; padding-top: 10px;">${formatCurrency(
                        order.totalPrice
                      )}</td></tr>
                  </table>
                </div>
                <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">Thông tin giao hàng</h3>
                <p><strong>Người nhận:</strong> ${
                  order.shippingAddress.fullName
                }<br>
                   <strong>Điện thoại:</strong> ${
                     order.shippingAddress.phone
                   }<br>
                   <strong>Địa chỉ:</strong> ${order.shippingAddress.street}, ${
    order.shippingAddress.communeName
  }, ${order.shippingAddress.districtName}, ${
    order.shippingAddress.provinceName
  }<br>
                   <strong>Thanh toán:</strong> ${
                     {
                       COD: "Thanh toán khi nhận hàng (COD)",
                       BANK_TRANSFER: "Chuyển khoản ngân hàng",
                       PAYPAL: "Thanh toán bằng PayPal",
                     }[order.paymentMethod] || order.paymentMethod
                   }
                </p>
                ${trackingSection}
                <p style="margin-top: 25px;">Chúng tôi sẽ gửi thông báo tiếp theo khi đơn hàng được vận chuyển.</p>
            </div>
            <div class="footer">© ${new Date().getFullYear()} ${shopName}.</div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = orderConfirmationTemplate;
