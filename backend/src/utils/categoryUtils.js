const Category = require("../models/Category");
const mongoose = require("mongoose");

/**
 * Lấy danh sách ID của tất cả các tổ tiên (cha, ông,...) của một category.
 * @param {string | mongoose.Types.ObjectId} categoryId - ID của category cần tìm tổ tiên.
 * @param {Map<string, any>} categoryMap - Một Map chứa tất cả category đã fetch (ID -> document) để tra cứu nhanh.
 * @returns {Promise<string[]>} - Mảng các chuỗi ID của tổ tiên.
 */
const getCategoryAncestors = async (categoryId, categoryMap) => {
  if (!categoryId) return [];

  const ancestors = [];
  let currentId = categoryId.toString();

  // Lặp tối đa ví dụ 10 cấp để tránh vòng lặp vô hạn nếu dữ liệu lỗi
  for (let i = 0; i < 10 && currentId; i++) {
    const category = categoryMap.get(currentId); // Tra cứu trong map đã fetch

    if (category && category.parent) {
      const parentId = category.parent.toString();
      ancestors.push(parentId); // Thêm ID cha vào danh sách
      currentId = parentId; // Di chuyển lên cấp cha
    } else {
      currentId = null; // Đã đến gốc hoặc không tìm thấy category trong map
    }
  }
  return ancestors; // Trả về mảng ID tổ tiên (dạng string)
};

// Hàm fetch và tạo map category một lần
const fetchAndMapCategories = async (filter = { isActive: true }) => {
  try {
    const categories = await Category.find(filter)
      .select("_id name parent")
      .lean(); // Chỉ lấy trường cần thiết
    const categoryMap = new Map();
    categories.forEach((cat) => categoryMap.set(cat._id.toString(), cat));
    return categoryMap;
  } catch (error) {
    console.error("Lỗi khi fetch và map categories:", error);
    return new Map(); // Trả về map rỗng nếu lỗi
  }
};

module.exports = {
  getCategoryAncestors,
  fetchAndMapCategories,
};
