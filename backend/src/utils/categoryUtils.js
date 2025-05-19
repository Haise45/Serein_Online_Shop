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
  for (let i = 0; i < 10 && currentId; i++) {
    const category = categoryMap.get(currentId);
    if (category && category.parent) {
      const parentId = category.parent.toString();
      ancestors.push(parentId);
      currentId = parentId;
    } else {
      currentId = null;
    }
  }
  return ancestors;
};

/**
 * Lấy danh sách ID của tất cả các category con cháu (descendants) của một category.
 * @param {string | mongoose.Types.ObjectId} parentCategoryId - ID của category cha.
 * @param {Map<string, any>} categoryMap - Một Map chứa tất cả category đã fetch.
 * @returns {string[]} - Mảng các chuỗi ID của category con cháu.
 */
const getCategoryDescendants = (parentCategoryId, categoryMap) => {
  if (!parentCategoryId) return [];

  const parentIdStr = parentCategoryId.toString();
  const descendants = [];
  const queue = [parentIdStr]; // Hàng đợi để duyệt theo chiều rộng (BFS)

  // Tạo một map parentId -> [childId1, childId2, ...] để duyệt nhanh
  const parentToChildrenMap = new Map();
  categoryMap.forEach((cat) => {
    if (cat.parent) {
      const pId = cat.parent.toString();
      if (!parentToChildrenMap.has(pId)) {
        parentToChildrenMap.set(pId, []);
      }
      parentToChildrenMap.get(pId).push(cat._id.toString());
    }
  });

  while (queue.length > 0) {
    const currentCatId = queue.shift();
    const children = parentToChildrenMap.get(currentCatId) || [];
    for (const childId of children) {
      if (!descendants.includes(childId)) {
        // Tránh thêm trùng lặp nếu có lỗi dữ liệu
        descendants.push(childId);
        queue.push(childId); // Thêm con vào hàng đợi để duyệt tiếp
      }
    }
  }
  return descendants;
};

// Hàm fetch và tạo map category một lần
const fetchAndMapCategories = async (filter = { isActive: true }) => {
  try {
    const categories = await Category.find(filter)
      .select("_id name slug parent isActive") // Thêm isActive
      .lean();
    const categoryMap = new Map();
    categories.forEach((cat) => categoryMap.set(cat._id.toString(), cat));
    return categoryMap;
  } catch (error) {
    console.error("Lỗi khi fetch và map categories:", error);
    return new Map();
  }
};

module.exports = {
  getCategoryAncestors,
  getCategoryDescendants,
  fetchAndMapCategories,
};
