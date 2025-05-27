require("dotenv").config();

// Hàm này nhận tên người dùng và chi tiết đơn hàng
const orderConfirmationTemplate = (userName, order, guestTrackingUrl = null) => {
  const shopName = process.env.SHOP_NAME || "Cửa Hàng Của Bạn";
  const logoUrl = process.env.SHOP_LOGO_URL || null;
  // URL mặc định nếu là user đăng nhập
  let orderDetailUrl = `${process.env.FRONTEND_URL}/profile/orders/${order._id}`;

  // Định dạng tiền tệ Việt Nam
  const formatCurrency = (amount) => {
    if (typeof amount !== "number") return "";
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  // Tạo các hàng trong bảng sản phẩm
  const generateOrderItemsHTML = (items) => {
    let itemsHtml = "";
    items.forEach((item) => {
      // Xử lý thông tin biến thể (nếu có)
      let variantOptions = "";
      if (
        item.variant &&
        item.variant.options &&
        item.variant.options.length > 0
      ) {
        variantOptions = ` (${item.variant.options
          .map((opt) => `${opt.attributeName}: ${opt.value}`)
          .join(", ")})`;
      }

      itemsHtml += `
              <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                      <img src="${item.image || "placeholder_url"}" alt="${
        item.name
      }" width="50" style="vertical-align: middle; margin-right: 10px; border-radius: 4px;">
                      <span style="vertical-align: middle;">${
                        item.name
                      }${variantOptions}</span>
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
                    item.quantity
                  }</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
                    item.price
                  )}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
                    item.price * item.quantity
                  )}</td>
              </tr>
          `;
    });
    return itemsHtml;
  };

  // --- CẬP NHẬT PHẦN TRACKING ---
  let trackingSection = "";
  if (guestTrackingUrl) {
    trackingSection = `
      <p style="font-size: 13px; line-height: 1.5; color: #333333; margin-bottom: 15px;">
        Bạn có thể theo dõi tình trạng đơn hàng của mình bằng cách nhấp vào liên kết sau:
      </p>
      <p style="text-align: center; margin-bottom: 25px;">
        <a href="${guestTrackingUrl}" target="_blank" style="background-color: #007bff; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 13px; display: inline-block;">
          Theo dõi đơn hàng của bạn
        </a>
      </p>
    `;
  } else if (order.user) {
    // Nếu là user đã đăng nhập, hướng dẫn họ vào tài khoản
    trackingSection = `
      <p style="font-size: 13px; line-height: 1.5; color: #333333; margin-bottom: 15px;">
        Bạn có thể xem chi tiết và theo dõi đơn hàng này trong mục "Đơn hàng của tôi" khi đăng nhập vào tài khoản.
      </p>
      <p style="text-align: center; margin-bottom: 25px;">
        <a href="${orderDetailUrl}" target="_blank" style="background-color: #007bff; color: white !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 13px; display: inline-block;">
          Xem đơn hàng của tôi
        </a>
      </p>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      table { border-collapse: collapse; width: 100%; }
      td, th { padding: 0;  }
      a { color: #007bff; text-decoration: none; }
      .button { background-color: #007bff; color: #ffffff !important; padding: 12px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px; font-weight: bold; }
      .button:hover { background-color: #0056b3; }
      .container { background-color: #f8f9fa; padding: 20px; }
      .content { background-color: #ffffff; max-width: 680px; margin: 0 auto; padding: 30px; border: 1px solid #e9ecef; border-radius: 8px; }
      .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9ecef; margin-bottom: 20px; }
      .footer { text-align: center; padding: 10px; margin-top: 20px; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef; }
      .order-summary { margin-top: 20px; }
      .order-summary td { padding: 5px 0; }
      .order-summary .label { font-weight: bold; width: 70%; text-align: right; padding-right: 15px; }
      .order-summary .value { text-align: right; }
      .total { font-weight: bold; font-size: 1.1em; }
      th { background-color: #f1f1f1; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; }
      th.center { text-align: center; }
      th.right { text-align: right; }
  </style>
</head>
<body>
  <table class="container" role="presentation">
      <tr>
          <td>
              <table class="content" role="presentation">
                  <!-- Header -->
                  <tr>
                      <td class="header">
                          ${
                            logoUrl
                              ? `<img src="${logoUrl}" alt="${shopName} Logo" width="150"><br><br>`
                              : ""
                          }
                          <h2 style="color:#343a40;margin:0;">Xác Nhận Đơn Hàng #${order._id
                            .toString()
                            .slice(-6)}</h2>
                      </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                        <td style="padding-left: 20px; padding-right: 20px;">
                            <p style="margin-bottom:15px;">Xin chào ${
                              userName || "quý khách"
                            },</p>
                            <p style="margin-bottom:15px;">Cảm ơn bạn đã đặt hàng tại ${shopName}! Đơn hàng của bạn đã được ghi nhận và đang chờ xử lý.</p>
                            
                            <!-- NẾU LÀ GUEST VÀ KHÔNG CÓ URL TRACKING (DỰ PHÒNG) THÌ THÔNG BÁO MÃ ĐƠN HÀNG -->
                            ${
                              !order.user && !guestTrackingUrl
                                ? `<p style="margin-bottom:25px;">Mã đơn hàng của bạn là: <strong>#${order._id
                                    .toString()
                                    .slice(
                                      -6
                                    )}</strong>. Vui lòng lưu lại mã này để tra cứu khi cần thiết.</p>`
                                : '<p style="margin-bottom:25px;">Dưới đây là chi tiết đơn hàng của bạn:</p>'
                            }
                            
                            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Chi tiết sản phẩm</h3>
                          <table style="width: 100%; margin-bottom: 20px;">
                              <thead>
                                  <tr>
                                      <th>Sản phẩm</th>
                                      <th class="center">Số lượng</th>
                                      <th class="right">Đơn giá</th>
                                      <th class="right">Thành tiền</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${generateOrderItemsHTML(order.orderItems)}
                              </tbody>
                          </table>

                          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">Tổng cộng</h3>
                          <table class="order-summary" style="width:100%; max-width: 350px; margin-left: auto;">
                              <tr>
                                  <td class="label">Tạm tính:</td>
                                  <td class="value">${formatCurrency(
                                    order.itemsPrice
                                  )}</td>
                              </tr>
                              ${
                                order.discountAmount > 0
                                  ? `
                              <tr>
                                  <td class="label">Giảm giá (${
                                    order.appliedCouponCode || ""
                                  }):</td>
                                  <td class="value" style="color: green;">-${formatCurrency(
                                    order.discountAmount
                                  )}</td>
                              </tr>`
                                  : ""
                              }
                              <tr>
                                  <td class="label">Phí vận chuyển:</td>
                                  <td class="value">${formatCurrency(
                                    order.shippingPrice
                                  )}</td>
                              </tr>
                              <!-- Thêm thuế nếu có -->
                              <!-- <tr>
                                  <td class="label">Thuế VAT:</td>
                                  <td class="value">${formatCurrency(
                                    order.taxPrice
                                  )}</td>
                              </tr> -->
                              <tr class="total">
                                  <td class="label" style="border-top: 1px solid #ccc; padding-top: 10px;">Tổng cộng:</td>
                                  <td class="value" style="border-top: 1px solid #ccc; padding-top: 10px;">${formatCurrency(
                                    order.totalPrice
                                  )}</td>
                              </tr>
                          </table>

                           <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">Thông tin giao hàng</h3>
                           <p>
                               <strong>Người nhận:</strong> ${
                                 order.shippingAddress.fullName
                               }<br>
                               <strong>Điện thoại:</strong> ${
                                 order.shippingAddress.phone
                               }<br>
                               <strong>Địa chỉ:</strong> ${
                                 order.shippingAddress.street
                               }, ${order.shippingAddress.communeName}, ${
    order.shippingAddress.districtName
  }, ${order.shippingAddress.provinceName}<br>
                               <strong>Thanh toán:</strong> ${
                                 order.paymentMethod === "COD"
                                   ? "Thanh toán khi nhận hàng"
                                   : order.paymentMethod === "BANK_TRANSFER"
                                   ? "Chuyển khoản ngân hàng"
                                   : order.paymentMethod === "PAYPAL"
                                   ? "Thanh toán qua PayPal"
                                   : "Phương thức thanh toán không xác định"
                               }
                           </p>
                            ${trackingSection} <!-- HIỂN THỊ trackingSection ĐÃ TẠO Ở TRÊN -->
                            
                          <p style="margin-top: 25px;">Chúng tôi sẽ thông báo cho bạn khi đơn hàng được vận chuyển.</p>
                      </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                      <td class="footer">
                          © ${new Date().getFullYear()} ${shopName}. All rights reserved.<br>
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

module.exports = orderConfirmationTemplate;
