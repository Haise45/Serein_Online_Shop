const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

// --- Helper: "Làm phẳng" các trường đa ngôn ngữ của một object ---
const flattenI18nObject = (obj, locale, fields) => {
  if (!obj) return obj;
  const newObj = { ...obj };
  for (const field of fields) {
    if (newObj[field] && typeof newObj[field] === "object") {
      newObj[field] = newObj[field][locale] || newObj[field].vi;
    }
  }
  return newObj;
};

// --- Hàm Helper: Xây dựng bộ lọc Category ---
const buildCategoryFilter = (query, isAdmin = false, locale = "vi") => {
  const filter = {}; // Khởi tạo đối tượng filter rỗng

  // 1. Lọc theo trạng thái hoạt động (isActive)
  if (isAdmin) {
    // Nếu là Admin:
    if (query.isActive === "true") {
      filter.isActive = true;
    } else if (query.isActive === "false") {
      filter.isActive = false;
    }
  } else {
    // Nếu là Client:
    filter.isActive = true;
  }

  // 2. Lọc theo danh mục cha (parent)
  if (query.parent !== undefined) {
    if (
      query.parent === "null" ||
      query.parent === null ||
      query.parent === ""
    ) {
      // Tìm các danh mục cấp cao nhất (không có cha)
      filter.parent = null;
    } else if (mongoose.Types.ObjectId.isValid(query.parent)) {
      // Tìm các danh mục con của một parent ID cụ thể
      filter.parent = new mongoose.Types.ObjectId(query.parent);
    } else {
      // Nếu parent không hợp lệ, trả về filter không match gì
      filter.parent = "invalid_id";
    }
  }

  // 3. Tìm kiếm theo tên (name) hoặc slug
  if (query.search) {
    const searchRegex = { $regex: query.search.trim(), $options: "i" };
    filter.$or = [
      { "name.vi": searchRegex },
      { "name.en": searchRegex },
      { slug: searchRegex },
    ];
  }

  // Ghi log để debug (tùy chọn)
  console.log("--- [Category Filter] ---");
  console.log(JSON.stringify(filter, null, 2));
  console.log("-------------------------");

  return filter;
};

// --- Hàm Helper: Xây dựng đối tượng sắp xếp Category ---
const buildCategorySort = (query, locale = "vi") => {
  const sort = {};
  // *** CẬP NHẬT: Sắp xếp theo trường ngôn ngữ cụ thể ***
  const sortField = query.sortBy === "name" ? `name.${locale}` : query.sortBy;
  if (query.sortBy && ["name", "createdAt"].includes(query.sortBy)) {
    sort[sortField] = query.sortOrder === "asc" ? 1 : -1;
  } else {
    sort.createdAt = 1; // Mặc định
  }

  // Ghi log để debug
  console.log("--- [Category Sort] ---");
  console.log(JSON.stringify(sort, null, 2));
  console.log("-----------------------");

  return sort;
};

// @desc    Tạo danh mục mới
// @route   POST /api/v1/categories
// @access  Private/Admin
const createCategory = asyncHandler(async (req, res) => {
  // Dữ liệu đã được validate bởi middleware
  const { name, description, parent, image, isActive } = req.body;

  // Kiểm tra xem tên danh mục đã tồn tại chưa (dù đã có unique index ở DB)
  const nameExists = await Category.findOne({
    $or: [{ "name.vi": name.vi }, { "name.en": name.en }],
  });
  if (nameExists) {
    res.status(400);
    throw new Error(
      `Danh mục với tên "${name.vi}" hoặc "${name.en}" đã tồn tại.`
    );
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
  // Xác định context: user đang truy cập là admin hay client?
  const isAdmin = req.user && req.user.role === "admin";
  const locale = req.locale || "vi";

  // 1. Xây dựng đối tượng filter từ query params
  const filter = buildCategoryFilter(req.query, isAdmin);

  // 2. Xây dựng đối tượng sắp xếp
  const sort = buildCategorySort(req.query);

  // 3. Xử lý phân trang
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10; // Mặc định 10 mục/trang
  const skip = (page - 1) * limit;

  // --- Pipeline chính để tính toán dữ liệu ---
  // const calculationPipeline = [
  //   // Giai đoạn 1: Áp dụng filter ngay từ đầu
  //   { $match: filter },

  //   // Giai đoạn 2: Tìm tất cả các danh mục con cháu của mỗi danh mục
  //   {
  //     $graphLookup: {
  //       from: "categories", // Tên collection
  //       startWith: "$_id", // Bắt đầu từ _id của mỗi document
  //       connectFromField: "_id", // Trường nối từ
  //       connectToField: "parent", // Trường nối đến (parent của document khác)
  //       as: "descendants", // Tên mảng chứa tất cả con cháu
  //       depthField: "depth", // (Tùy chọn) Thêm trường cho biết độ sâu
  //     },
  //   },

  //   // Giai đoạn 3: Tạo một mảng chứa ID của chính nó và tất cả con cháu
  //   {
  //     $addFields: {
  //       allCategoryIds: {
  //         $concatArrays: [["$_id"], "$descendants._id"],
  //       },
  //     },
  //   },

  //   // Giai đoạn 4: Join với collection 'products' dựa trên mảng ID đã tạo
  //   {
  //     $lookup: {
  //       from: "products",
  //       localField: "allCategoryIds", // Mảng ID của danh mục (cha + con)
  //       foreignField: "category", // Trường category trong Product
  //       as: "allProducts", // Tên mảng chứa tất cả sản phẩm
  //     },
  //   },

  //   // Giai đoạn 5: Join với collection 'categories' để lấy thông tin parent (cho hiển thị)
  //   {
  //     $lookup: {
  //       from: "categories",
  //       localField: "parent",
  //       foreignField: "_id",
  //       as: "parentInfo",
  //     },
  //   },

  //   // Giai đoạn 6: Tạo các trường cuối cùng và định dạng lại
  //   {
  //     $addFields: {
  //       productCount: { $size: "$allProducts" }, // Đếm tổng số sản phẩm
  //       parent: { $ifNull: [{ $arrayElemAt: ["$parentInfo", 0] }, null] }, // Lấy parent hoặc set là null
  //     },
  //   },

  //   // Giai đoạn 7: Chọn lọc các trường cần trả về
  //   {
  //     $project: {
  //       name: 1,
  //       slug: 1,
  //       description: 1,
  //       image: 1,
  //       isActive: 1,
  //       createdAt: 1,
  //       updatedAt: 1,
  //       productCount: 1,
  //       "parent._id": 1,
  //       "parent.name": 1,
  //       "parent.slug": 1,
  //     },
  //   },
  // ];

  // Sử dụng một pipeline đơn giản hơn để lấy dữ liệu và tính toán
  const pipeline = [
    { $match: filter },
    // Lấy thông tin parent
    {
      $lookup: {
        from: "categories",
        localField: "parent",
        foreignField: "_id",
        as: "parentInfo",
      },
    },
    // Tính toán productCount sau
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        image: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        parent: { $arrayElemAt: ["$parentInfo", 0] },
      },
    },
  ];

  const [categories, totalCategories] = await Promise.all([
    Category.aggregate(pipeline).sort(sort).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);

  // *** "LÀM PHẲNG" DỮ LIỆU TRƯỚC KHI TRẢ VỀ ***
  const flattenedCategories = categories.map((cat) => {
    const flatCat = flattenI18nObject(cat, locale, ["name", "description"]);
    if (flatCat.parent) {
      flatCat.parent = flattenI18nObject(flatCat.parent, locale, ["name"]);
    }
    return flatCat;
  });

  // 4. Thực thi pipeline để lấy tổng số lượng và dữ liệu
  // const countPipeline = [...calculationPipeline, { $count: "total" }];

  // const [totalResult, categories] = await Promise.all([
  //   Category.aggregate(countPipeline),
  //   Category.aggregate(calculationPipeline).sort(sort).skip(skip).limit(limit),
  // ]);

  // const totalItems = totalResult.length > 0 ? totalResult[0].total : 0;
  // const totalPages = Math.ceil(totalItems / limit);

  // Debug log
  console.log("--- [Categories Result] ---");
  console.log("Total items found:", totalCategories);
  console.log("Categories returned:", categories.length);
  console.log("---------------------------");

  // 5. Trả về response
  res.status(200).json({
    currentPage: page,
    totalPages: Math.ceil(totalCategories / limit),
    totalCategories: totalCategories,
    limit: limit,
    categories: flattenedCategories,
  });
});

// @desc    Lấy chi tiết một danh mục bằng ID hoặc Slug
// @route   GET /api/v1/categories/:idOrSlug
// @access  Public (hoặc Private/Admin tùy yêu cầu)
const getCategoryByIdOrSlug = asyncHandler(async (req, res) => {
  const locale = req.locale || "vi";
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

  const flattenedCategory = flattenI18nObject(category, locale, [
    "name",
    "description",
  ]);
  res.json(flattenedCategory);
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

  // *** CẬP NHẬT: Kiểm tra trùng tên khi tên thay đổi ***
  if (name && (name.vi !== category.name.vi || name.en !== category.name.en)) {
    const nameExists = await Category.findOne({
      _id: { $ne: id },
      $or: [{ "name.vi": name.vi }, { "name.en": name.en }],
    });
    if (nameExists) {
      res.status(400);
      throw new Error(`Tên danh mục đã tồn tại.`);
    }
    category.name = name;
  }

  // Kiểm tra parent mới (nếu có)
  if (parent !== undefined) {
    // Cho phép đặt parent về null
    if (parent === null || parent === "") {
      category.parent = null;
    } else if (mongoose.Types.ObjectId.isValid(parent)) {
      if (parent.toString() === id.toString()) {
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
