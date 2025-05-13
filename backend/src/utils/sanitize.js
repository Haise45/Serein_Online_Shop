const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/**
 * Làm sạch một chuỗi HTML để loại bỏ mã độc.
 * @param {string} dirtyHtml Chuỗi HTML cần làm sạch.
 * @returns {string} Chuỗi HTML đã được làm sạch.
 */
const sanitizeHtml = (dirtyHtml) => {
  if (!dirtyHtml || typeof dirtyHtml !== "string") {
    return "";
  }
  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true }, // Cho phép các thẻ HTML cơ bản
    // FORBID_TAGS: ['style'], // Cấm thêm thẻ nếu muốn
    // ADD_ATTR: ['target'], // Cho phép thêm thuộc tính target cho link
  });
};

module.exports = sanitizeHtml;
