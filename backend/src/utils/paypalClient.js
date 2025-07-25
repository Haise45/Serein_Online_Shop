const axios = require("axios");

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_API_BASE,
  EXCHANGE_RATE_API_KEY,
  EXCHANGE_RATE_API_URL,
} = process.env;

/**
 * Lấy Access Token từ PayPal. Token này cần cho mọi request API sau đó.
 * @returns {Promise<string>} Access token.
 */
async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error(
      "PayPal Client ID hoặc Client Secret chưa được cấu hình trong file .env"
    );
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  try {
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Failed to get PayPal access token:", error.response?.data);
    throw new Error("Không thể lấy access token của PayPal.");
  }
}

/**
 * Lấy tỷ giá chuyển đổi từ VND sang USD bằng ExchangeRate-API.
 * @returns {Promise<number>} Tỷ giá. Ví dụ: 0.00004.
 */
async function getVndToUsdRate() {
  if (!EXCHANGE_RATE_API_KEY || !EXCHANGE_RATE_API_URL) {
    console.warn(
      "ExchangeRate-API key/url not found. Using default fallback rate."
    );
    return 1 / 26000; // Tỷ giá dự phòng
  }
  try {
    const url = `${EXCHANGE_RATE_API_URL}${EXCHANGE_RATE_API_KEY}/latest/VND`;
    const response = await axios.get(url);

    const rate = response.data?.conversion_rates?.USD;
    if (!rate) {
      throw new Error("USD rate not found in API response.");
    }
    return rate;
  } catch (error) {
    console.error(
      "Failed to fetch exchange rate, using default fallback rate.",
      error.message
    );
    return 1 / 26000; // Tỷ giá dự phòng
  }
}

/**
 * Tạo một đơn hàng trên hệ thống PayPal với các giá trị tiền tệ đã được tính toán.
 * Thay vì gửi chi tiết từng item, chúng ta gửi tổng tiền hàng và khoản giảm giá.
 * @param {object} orderPayload - Dữ liệu đơn hàng.
 * @param {number} orderPayload.subtotalUSD - Tổng giá trị các sản phẩm trước khi giảm giá, đã quy đổi sang USD.
 * @param {number} orderPayload.discountUSD - Tổng số tiền được giảm giá, đã quy đổi sang USD.
 * @param {number} orderPayload.totalAmountUSD - Số tiền cuối cùng khách hàng phải trả, đã quy đổi sang USD.
 * @param {object} orderPayload.shippingDetails - Thông tin địa chỉ giao hàng.
 * @param {string} orderPayload.orderDescription - Mô tả ngắn gọn về đơn hàng.
 * @returns {Promise<object>} Dữ liệu đơn hàng từ PayPal.
 */
async function createPayPalOrder(orderPayload) {
  // Trích xuất các giá trị từ payload
  const {
    subtotalUSD,
    discountUSD,
    totalAmountUSD,
    shippingDetails,
    orderDescription,
  } = orderPayload;

  // Lấy access token để xác thực với PayPal
  const accessToken = await getPayPalAccessToken();
  const url = `${PAYPAL_API_BASE}/v2/checkout/orders`;

  // Xây dựng payload chi tiết cho API của PayPal
  const payload = {
    intent: "CAPTURE", // Ý định là "bắt" (hoàn tất) thanh toán ngay sau khi người dùng đồng ý
    purchase_units: [
      {
        description:
          orderDescription || "Thanh toán cho đơn hàng tại Serein Shop", // Mô tả chung cho đơn hàng
        amount: {
          currency_code: "USD", // Luôn là USD cho PayPal
          value: totalAmountUSD.toFixed(2), // Số tiền cuối cùng, làm tròn 2 chữ số thập phân

          // Phân tách chi tiết số tiền để hiển thị cho khách hàng
          breakdown: {
            // Tổng giá trị của tất cả các sản phẩm
            item_total: {
              currency_code: "USD",
              value: subtotalUSD.toFixed(2),
            },
            // Khoản giảm giá (phải là số dương)
            discount: {
              currency_code: "USD",
              value: discountUSD.toFixed(2),
            },
            // Có thể thêm các trường khác như shipping, tax... ở đây nếu cần
            // shipping: { currency_code: 'USD', value: '...' }
          },
        },
        // thông tin chi tiết sẽ được hiển thị qua `description` và `breakdown`
        shipping: {
          name: {
            full_name: shippingDetails.fullName,
          },
          address: {
            address_line_1: shippingDetails.street,
            admin_area_2: shippingDetails.districtName,
            admin_area_1: shippingDetails.provinceName,
            postal_code: "700000", // Mã bưu chính chung, PayPal yêu cầu
            country_code: "VN",
          },
        },
      },
    ],
    application_context: {
      shipping_preference: "SET_PROVIDED_ADDRESS", // Ưu tiên địa chỉ do mình cung cấp
      user_action: "PAY_NOW",
    },
  };

  try {
    // Gửi request đến PayPal
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    // Log lỗi chi tiết từ PayPal để dễ dàng debug
    console.error(
      "Failed to create PayPal order:",
      JSON.stringify(error.response?.data, null, 2)
    );
    throw new Error("Không thể tạo đơn hàng trên hệ thống PayPal.");
  }
}

/**
 * Hoàn tất (capture) một thanh toán đã được người dùng duyệt.
 * @param {string} paypalOrderId - ID của đơn hàng trên PayPal (do hàm createPayPalOrder trả về).
 * @returns {Promise<object>} Dữ liệu giao dịch đã được capture từ PayPal.
 */
async function capturePayPalOrder(paypalOrderId) {
  const accessToken = await getPayPalAccessToken();
  const url = `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`;
  try {
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Failed to capture PayPal order:",
      JSON.stringify(error.response?.data, null, 2)
    );
    throw new Error("Không thể hoàn tất thanh toán PayPal.");
  }
}

/**
 * Hoàn tiền cho một giao dịch đã được capture thành công.
 * @param {string} captureId - ID của giao dịch capture (lưu trong `paymentResult` của đơn hàng).
 * @param {string} reason - Lý do hoàn tiền (hiển thị cho khách hàng).
 * @returns {Promise<object>} Dữ liệu về giao dịch hoàn tiền từ PayPal.
 */
async function refundPayPalOrder(captureId, reason = "Customer request") {
  const accessToken = await getPayPalAccessToken();
  const url = `${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`;
  const payload = {
    note_to_payer: reason,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log(
      `[PayPal Refund] Successfully refunded capture ${captureId}. Refund ID: ${response.data.id}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `[PayPal Refund] Failed to refund capture ${captureId}:`,
      JSON.stringify(error.response?.data, null, 2)
    );
    const paypalError =
      error.response?.data?.details?.[0]?.description ||
      "Không thể hoàn tiền qua PayPal.";
    throw new Error(paypalError);
  }
}

module.exports = {
  getPayPalAccessToken,
  createPayPalOrder,
  capturePayPalOrder,
  refundPayPalOrder,
  getVndToUsdRate,
};
