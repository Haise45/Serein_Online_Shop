// Hàm định dạng tiền tệ
const formatCurrency = (amount) => {
  if (typeof amount !== "number") return "";
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

// Hàm tạo bảng chi tiết sản phẩm
const generateOrderItemsHTML = (items) => {
  if (!items || items.length === 0) return "";

  let itemsHtml = `
    <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px;">Chi tiết sản phẩm</h3>
    <table style="width: 100%; margin-bottom: 20px; font-size: 14px;">
        <thead>
            <tr>
                <th style="background-color: #f1f1f1; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Sản phẩm</th>
                <th style="background-color: #f1f1f1; padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Số lượng</th>
                <th style="background-color: #f1f1f1; padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Đơn giá</th>
                <th style="background-color: #f1f1f1; padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Thành tiền</th>
            </tr>
        </thead>
        <tbody>`;

  items.forEach((item) => {
    const variantOptions =
      item.variant?.options
        ?.map((opt) => `${opt.attributeName}: ${opt.value}`)
        .join(" / ") || "";

    itemsHtml += `
            <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                    <img src="${
                      item.image || "https://via.placeholder.com/60"
                    }" alt="${
      item.name
    }" width="60" style="vertical-align: middle; margin-right: 12px; border-radius: 4px;">
                    <div style="vertical-align: middle;">
                        <span>${item.name}</span>
                        ${
                          variantOptions
                            ? `<br><small style="color: #6c757d;">${variantOptions}</small>`
                            : ""
                        }
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
                  item.quantity
                }</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(
                  item.price
                )}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">${formatCurrency(
                  item.price * item.quantity
                )}</td>
            </tr>
        `;
  });

  itemsHtml += `</tbody></table>`;
  return itemsHtml;
};

module.exports = {
  formatCurrency,
  generateOrderItemsHTML,
};
