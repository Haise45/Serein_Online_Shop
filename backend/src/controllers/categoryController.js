const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// @desc    Tạo danh mục mới
// @route   POST /api/v1/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  // Dữ liệu đã được validate bởi middleware
  const { name, description, parent, image, isActive } = req.body;

  // Kiểm tra xem tên danh mục đã tồn tại chưa (dù đã có unique index ở DB)
  const nameExists = await Category.findOne({ name });
  if (nameExists) {
    res.status(400);
    throw new Error(`Danh mục với tên "${name}" đã tồn tại.`);
  }

  // Kiểm tra xem parent ID có hợp lệ và tồn tại không (nếu được cung cấp)
  if (parent) {
    if (!mongoose.Types.ObjectId.isValid(parent)) {
      res.status(400);
      throw new Error("ID danh mục cha không hợp lệ.");
    }
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      res.status(404);
      throw new Error("Không tìm thấy danh mục cha.");
    }
  }

  const category = new Category({
    name,
    description,
    parent: parent || null,
    image,
    isActive, // Nếu không gửi thì sẽ lấy default từ schema
  });

  // Slug sẽ tự tạo bởi pre-save hook

  const createdCategory = await category.save();
  res.status(201).json(createdCategory);
});

// @desc    Lấy tất cả danh mục (có thể lấy dạng phẳng hoặc cây)
// @route   GET /api/v1/categories
// @access  Public (hoặc Private/Admin tùy yêu cầu)
const getCategories = asyncHandler(async (req, res) => {
  // Lấy tất cả danh mục (kể cả inactive - cho Admin) và có parent
  const categories = await Category.find()
    // .populate('parent', 'name slug') // Lấy thông tin parent nếu cần
    .sort("name");

  res.json(categories);
});

// @desc    Lấy chi tiết một danh mục bằng ID hoặc Slug
// @route   GET /api/v1/categories/:idOrSlug
// @access  Public (hoặc Private/Admin tùy yêu cầu)
const getCategoryByIdOrSlug = asyncHandler(async (req, res) => {
  const idOrSlug = req.params.idOrSlug;
  let category;

  // Kiểm tra xem param là ObjectId hợp lệ hay không
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    category = await Category.findOne({ _id: idOrSlug, isActive: true });
    //.populate('parent', 'name slug'); // Chỉ lấy category active
  }

  // Nếu không phải ID hoặc tìm bằng ID không thấy, thử tìm bằng slug
  if (!category) {
    category = await Category.findOne({ slug: idOrSlug, isActive: true });
    //.populate('parent', 'name slug');
  }

  // Nếu vẫn không tìm thấy
  if (!category) {
    res.status(404);
    throw new Error("Không tìm thấy danh mục.");
  }

  res.json(category);
});

// @desc    Cập nhật danh mục
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, parent, image, isActive } = req.body; // Dữ liệu đã validate

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID danh mục không hợp lệ.");
  }

  const category = await Category.findById(id);

  if (!category) {
    res.status(404);
    throw new Error("Không tìm thấy danh mục.");
  }

  // Kiểm tra trùng tên nếu tên được cập nhật và khác tên cũ
  if (name && name !== category.name) {
    const nameExists = await Category.findOne({ name });
    if (nameExists) {
      res.status(400);
      throw new Error(`Danh mục với tên "${name}" đã tồn tại.`);
    }
    category.name = name; // Slug sẽ tự cập nhật ở pre-save hook
  }

  // Kiểm tra parent mới (nếu có)
  if (parent !== undefined) {
    // Cho phép đặt parent về null
    if (parent === null || parent === "") {
      category.parent = null;
    } else if (mongoose.Types.ObjectId.isValid(parent)) {
      if (parent === id) {
        // Kiểm tra tự làm cha
        res.status(400);
        throw new Error("Danh mục không thể tự làm danh mục cha của chính nó.");
      }
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        res.status(404);
        throw new Error("Không tìm thấy danh mục cha mới.");
      }
      category.parent = parent;
    } else {
      res.status(400);
      throw new Error("ID danh mục cha mới không hợp lệ.");
    }
  }

  // Cập nhật các trường khác nếu có trong req.body
  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image; // Cho phép xóa ảnh bằng cách gửi '' hoặc null
  if (isActive !== undefined) category.isActive = isActive;

  const updatedCategory = await category.save(); // Trigger pre-save hook để cập nhật slug nếu name thay đổi
  res.json(updatedCategory);
});

// @desc    Xóa danh mục (Soft Delete)
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID danh mục không hợp lệ.");
  }

  const category = await Category.findById(id);

  if (!category) {
    res.status(404);
    throw new Error("Không tìm thấy danh mục.");
  }

  // Logic kiểm tra nâng cao (ví dụ: không cho xóa nếu còn danh mục con hoặc sản phẩm)
  const childCategoryExists = await Category.findOne({
    parent: id,
    isActive: true,
  });
  if (childCategoryExists) {
    res.status(400);
    throw new Error(
      "Không thể xóa danh mục vì còn danh mục con đang hoạt động."
    );
  }
  // Thêm kiểm tra Product
  const productExists = await Product.findOne({ category: id, isActive: true });
  if (productExists) {
    res.status(400);
    throw new Error(
      "Không thể xóa danh mục vì còn sản phẩm đang hoạt động thuộc danh mục này."
    );
  }

  // Thực hiện Soft Delete
  category.isActive = false;

  await category.save();

  res.status(200).json({ message: "Danh mục đã được xóa (ẩn) thành công." });
});

module.exports = {
  createCategory,
  getCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  deleteCategory,
};
