const Product = require("../models/Product");
const Category = require("../models/Category");
const Attribute = require("../models/Attribute");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");
const sanitizeHtml = require("../utils/sanitize");
const { createAdminNotification } = require("../utils/notificationUtils");
const {
  getCategoryDescendants,
  fetchAndMapCategories,
} = require("../utils/categoryUtils");

const LOW_STOCK_THRESHOLD = 10; // Ngưỡng cảnh báo tồn kho thấp

// =================================================================
// --- HELPER FUNCTIONS ---
// =================================================================

/**
 * Xây dựng bộ lọc MongoDB từ query params để tìm kiếm sản phẩm.
 * @param {object} query - req.query từ Express.
 * @param {boolean} isAdmin - Cờ xác định quyền admin.
 * @returns {Promise<object>} - Object filter cho Mongoose.
 */
const buildFilter = async (query, isAdmin = false) => {
  const andConditions = [];

  // --- 1. Lọc cơ bản (dựa trên quyền) ---
  if (isAdmin) {
    if (query.isActive !== undefined)
      andConditions.push({ isActive: query.isActive === "true" });
    if (query.isPublished !== undefined)
      andConditions.push({ isPublished: query.isPublished === "true" });
  } else {
    andConditions.push({ isPublished: true });
  }

  // --- 2. Lọc theo Category (hỗ trợ slug và lấy cả con cháu) ---
  if (query.category) {
    const categoryDoc = await Category.findOne({
      slug: query.category,
      isActive: true,
    }).lean();
    if (categoryDoc) {
      const categoryMap = await fetchAndMapCategories({ isActive: true });
      const descendantIds = getCategoryDescendants(
        categoryDoc._id,
        categoryMap
      );
      const categoryIds = [
        categoryDoc._id,
        ...descendantIds.map((id) => new mongoose.Types.ObjectId(id)),
      ];
      andConditions.push({ category: { $in: categoryIds } });
    } else {
      // Nếu không tìm thấy category, trả về điều kiện không bao giờ khớp
      andConditions.push({
        _id: new mongoose.Types.ObjectId("000000000000000000000000"),
      });
    }
  }

  // --- 3. Lọc theo khoảng giá ---
  if (query.minPrice || query.maxPrice) {
    const priceCondition = {};
    if (!isNaN(Number(query.minPrice)))
      priceCondition.$gte = Number(query.minPrice);
    if (!isNaN(Number(query.maxPrice)))
      priceCondition.$lte = Number(query.maxPrice);
    if (Object.keys(priceCondition).length > 0) {
      // Điều kiện OR cho giá được bọc và push vào mảng AND chính
      andConditions.push({
        $or: [{ price: priceCondition }, { "variants.price": priceCondition }],
      });
    }
  }

  // --- 4. Lọc theo thuộc tính (đã chuyển sang dùng ObjectId) ---
  if (query.attributes && typeof query.attributes === "object") {
    for (const attrLabel in query.attributes) {
      // Tìm Attribute document dựa trên label (VD: "Màu sắc")
      const attributeDoc = await Attribute.findOne({ label: attrLabel }).lean();
      if (!attributeDoc) continue;

      const valueStrings = String(query.attributes[attrLabel])
        .split(",")
        .map((v) => v.trim());

      if (valueStrings.length > 0) {
        // --- LOGIC TÌM KIẾM GIÁ TRỊ BẰNG REGEX ---

        // Tạo một mảng các điều kiện $or cho regex
        // Ví dụ: valueStrings = ["Hồng", "Xanh"]
        // -> orConditions = [ { value: /^Hồng/i }, { value: /^Xanh/i } ]
        const orConditions = valueStrings.map((v) => ({
          // Regex: Bắt đầu bằng (^) chuỗi tìm kiếm, không phân biệt hoa thường (i)
          value: { $regex: new RegExp(`^${v}`, "i") },
        }));

        // Tìm tất cả các giá trị con khớp với bất kỳ điều kiện regex nào
        const matchingValues = attributeDoc.values.filter((subDoc) => {
          return orConditions.some((cond) =>
            cond.value.$regex.test(subDoc.value)
          );
        });

        // Lấy ra ID của các giá trị đã tìm thấy
        const valueIds = matchingValues.map((v) => v._id);

        if (valueIds.length > 0) {
          // Tạo điều kiện lọc: sản phẩm phải có biến thể khớp với
          // cả attribute ID và một trong các value ID tìm được.
          andConditions.push({
            "variants.optionValues": {
              $elemMatch: {
                attribute: attributeDoc._id,
                value: { $in: valueIds },
              },
            },
          });
        } else {
          // Nếu không tìm thấy giá trị nào khớp, trả về điều kiện không bao giờ đúng
          // để đảm bảo không có sản phẩm nào được trả về.
          andConditions.push({
            _id: new mongoose.Types.ObjectId("000000000000000000000000"),
          });
        }
      }
    }
  }

  // --- 5. Lọc theo đánh giá tối thiểu ---
  if (!isNaN(parseFloat(query.minRating))) {
    andConditions.push({
      averageRating: { $gte: parseFloat(query.minRating) },
    });
    andConditions.push({ numReviews: { $gt: 0 } });
  }

  // --- 6. Tìm kiếm Text ($text index) ---
  if (query.search) {
    let searchTerm = query.search.trim();
    if (searchTerm) {
      // Để tìm kiếm chính xác cụm từ, chúng ta cần bao nó trong dấu nháy kép.
      // Cần escape bất kỳ dấu nháy kép nào đã có sẵn trong chuỗi tìm kiếm.
      const exactPhraseSearchTerm = `"${searchTerm.replace(/"/g, '\\"')}"`;

      console.log(
        `[Filter Debug] Thêm điều kiện tìm kiếm cụm từ chính xác: ${exactPhraseSearchTerm}`
      );

      // Thêm điều kiện $text vào mảng andConditions để kết hợp đúng
      andConditions.push({ $text: { $search: exactPhraseSearchTerm } });
    }
  }

  // --- 7. Kết hợp cuối cùng (Logic này cần được làm gọn lại) ---
  if (andConditions.length === 0) {
    // Nếu không có điều kiện lọc nào, trả về object rỗng để lấy tất cả sản phẩm.
    return {};
  }

  // Nếu có điều kiện, gộp tất cả vào một mệnh đề $and duy nhất.
  return { $and: andConditions };
};

/**
 * Xây dựng đối tượng sắp xếp MongoDB từ query params.
 * @param {object} query - req.query từ Express.
 * @returns {object} - Object sort cho Mongoose.
 */
const buildSort = (query) => {
  const sort = {};
  const allowedSortFields = [
    "price",
    "name",
    "createdAt",
    "totalSold",
    "averageRating",
  ];

  // 1. Nếu có tìm kiếm text
  if (query.search && query.search.trim()) {
    if (query.sortBy && allowedSortFields.includes(query.sortBy)) {
      sort[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;
    } else {
      // Mặc định sắp xếp theo ngày tạo mới nhất khi tìm kiếm
      sort.createdAt = -1;
    }
  }
  // 2. Nếu không có tìm kiếm, nhưng có sortBy
  else if (query.sortBy && allowedSortFields.includes(query.sortBy)) {
    sort[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;
  }
  // 3. Mặc định cuối cùng
  else {
    sort.createdAt = -1;
  }

  return sort;
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/v1/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  // Tách các trường cần xử lý đặc biệt ra khỏi phần còn lại của dữ liệu
  const {
    description,
    category: categoryId,
    sku: mainSku,
    variants,
    salePrice,
    salePriceEffectiveDate,
    salePriceExpiryDate,
    ...restData // Các trường còn lại như name, price, images, attributes...
  } = req.body;

  // if (salePrice === "") salePrice = null;

  // if (variants && Array.isArray(variants)) {
  //   variants = variants.map((v) => {
  //     if (v.salePrice === "") {
  //       return { ...v, salePrice: null };
  //     }
  //     return v;
  //   });
  // }

  // --- 1. Kiểm tra sự tồn tại và trạng thái của Category ---
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    res.status(400);
    throw new Error("ID Danh mục không hợp lệ.");
  }
  const categoryExists = await Category.findOne({
    _id: categoryId,
    isActive: true,
  }).lean();
  if (!categoryExists) {
    res.status(404);
    throw new Error("Danh mục không tồn tại hoặc không hoạt động.");
  }
  // === 2. KIỂM TRA SKU TRÙNG LẶP ===

  // Tập hợp tất cả SKU từ request (cả chính và biến thể) vào một Set để kiểm tra trùng lặp
  const skusInRequest = new Set();

  // Thêm SKU chính (nếu có)
  if (mainSku) {
    skusInRequest.add(mainSku);
  }

  // Thêm SKU của các biến thể
  if (variants && Array.isArray(variants)) {
    for (const variant of variants) {
      if (!variant.sku) {
        // Schema validation nên bắt lỗi này, nhưng kiểm tra lại cho chắc chắn
        res.status(400);
        throw new Error(
          `Một biến thể thiếu SKU. Tất cả các biến thể phải có SKU.`
        );
      }
      if (skusInRequest.has(variant.sku)) {
        // Kiểm tra trùng lặp ngay trong dữ liệu gửi lên
        throw new Error(
          `SKU "${variant.sku}" bị trùng lặp trong dữ liệu gửi lên.`
        );
      }
      skusInRequest.add(variant.sku);
    }
  }

  // Nếu có bất kỳ SKU nào, kiểm tra sự tồn tại của chúng trong database
  if (skusInRequest.size > 0) {
    const querySKUs = Array.from(skusInRequest);
    const existingProduct = await Product.findOne({
      $or: [
        { sku: { $in: querySKUs } },
        { "variants.sku": { $in: querySKUs } },
      ],
    })
      .select("sku variants.sku")
      .lean(); // Chỉ cần lấy các trường SKU để kiểm tra

    if (existingProduct) {
      // Tìm ra chính xác SKU nào bị trùng để thông báo lỗi rõ ràng
      const conflictingSKU = querySKUs.find(
        (s) =>
          s === existingProduct.sku ||
          existingProduct.variants?.some((v) => v.sku === s)
      );
      res.status(400);
      throw new Error(
        `SKU "${conflictingSKU}" đã tồn tại trong hệ thống. Vui lòng chọn SKU khác.`
      );
    }
  }

  // === 3. XỬ LÝ LOGIC SALE CHO BIẾN THỂ ===
  let finalVariants = variants || [];
  if (variants && variants.length > 0) {
    // Kiểm tra xem có áp dụng sale từ sản phẩm chính không
    const applyMainSale =
      salePrice !== undefined &&
      salePrice !== null &&
      salePrice > 0 &&
      !variants.some((v) => v.salePrice !== undefined && v.salePrice !== null);

    if (applyMainSale) {
      console.log(
        `[CreateProduct] Áp dụng sale chính (${salePrice}) cho tất cả các biến thể.`
      );
      finalVariants = variants.map((v) => ({
        ...v,
        salePrice: salePrice,
        salePriceEffectiveDate: salePriceEffectiveDate || null,
        salePriceExpiryDate: salePriceExpiryDate || null,
      }));
    }
  }

  // --- 4. Tạo đối tượng Product mới ---
  const product = new Product({
    ...restData, // name, price, images, attributes...
    description: description ? sanitizeHtml(description) : "",
    category: categoryId,
    sku: mainSku || null,
    variants: finalVariants,
    salePrice: salePrice,
    salePriceEffectiveDate: salePriceEffectiveDate,
    salePriceExpiryDate: salePriceExpiryDate,
  });

  // --- 5. Lưu và Populate ---
  const createdProduct = await product.save();
  await createdProduct.populate([
    { path: "category", select: "name slug parent" },
    { path: "attributes.attribute", select: "name label" },
  ]);

  // --- 6. Trả về kết quả ---
  res.status(201).json(createdProduct);
});

// @desc    Lấy danh sách sản phẩm (có filter, sort, pagination)
// @route   GET /api/v1/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1; // Lấy trang hiện tại, mặc định là 1
  const limit = parseInt(req.query.limit, 10) || 10; // Lấy số lượng item mỗi trang, mặc định là 10
  const skip = (page - 1) * limit; // Tính số lượng bỏ qua

  // Xác định xem người dùng có phải admin không (có thể dùng để hiển thị/ẩn sản phẩm nháp)
  // Middleware protect không bắt buộc cho route này, nên cần check req.user tồn tại
  const isAdmin = req.user?.role === "admin";

  // --- Xây dựng bộ lọc và sắp xếp ---
  const filter = await buildFilter(req.query, isAdmin); // Chờ vì có thể query Category
  const sortOptions = buildSort(req.query); // Hàm helper đã tạo

  // Các trường cần thiết để hiển thị trên danh sách
  const projection = {
    name: 1,
    slug: 1,
    price: 1,
    salePrice: 1,
    salePriceEffectiveDate: 1,
    salePriceExpiryDate: 1,
    sku: 1,
    images: { $slice: 2 },
    category: 1,
    averageRating: 1,
    numReviews: 1,
    totalSold: 1,
    createdAt: 1,
    isPublished: 1,
    isActive: 1,
    "variants.optionValues": 1,
    "variants.images": { $slice: 2 },
    "variants.price": 1,
    "variants.sku": 1,
    "variants.salePrice": 1,
    "variants.salePriceEffectiveDate": 1,
    "variants.salePriceExpiryDate": 1,
    "variants.stockQuantity": 1,
    "variants._id": 1,
  };

  // Nếu có tìm kiếm text, thêm trường 'score' vào projection
  if (req.query.search) {
    projection.score = { $meta: "textScore" };
  }

  // --- Thực hiện Query ---
  // Query lấy danh sách sản phẩm
  let productsQuery = Product.find(filter) // Áp dụng bộ lọc
    .populate("category", "name slug parent") // Lấy thông tin 'name' và 'slug' của category liên kết
    .select(projection)
    .sort(sortOptions)
    .skip(skip) // Bỏ qua các sản phẩm của trang trước
    .limit(limit); // Giới hạn số lượng sản phẩm trên trang này

  // Áp dụng collation NẾU sắp xếp theo tên VÀ KHÔNG phải là tìm kiếm text (vì textScore đã ưu tiên)
  if (req.query.sortBy === "name") {
    productsQuery = productsQuery.collation({
      locale: "vi", // Hoặc "en", tùy ngôn ngữ tên sản phẩm
      strength: 2, // Điều chỉnh strength nếu cần (1, 2, hoặc 3)
    });
  }

  const [products, totalProducts] = await Promise.all([
    productsQuery.exec(),
    Product.countDocuments(filter),
  ]);

  res.json({
    currentPage: page,
    totalPages: Math.ceil(totalProducts / limit),
    totalProducts: totalProducts,
    limit: limit,
    products: products,
  });
});

// @desc    Lấy chi tiết một sản phẩm bằng ID hoặc Slug
// @route   GET /api/v1/products/:idOrSlug
// @access  Public
const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isAdmin = req.user?.role === "admin";

  // 1. Tìm sản phẩm gốc
  const initialFilter = {};
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    initialFilter._id = new mongoose.Types.ObjectId(idOrSlug);
  } else {
    initialFilter.slug = idOrSlug;
  }
  if (!isAdmin) {
    initialFilter.isPublished = true;
  }

  const product = await Product.findOne(initialFilter).lean();

  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm.");
  }

  // 2. Thu thập tất cả các ID cần populate từ sản phẩm đã tìm thấy
  const categoryId = product.category;
  const attributeIds = new Set();
  const valueIds = new Set();

  product.attributes.forEach((attr) => {
    attributeIds.add(attr.attribute.toString());
    attr.values.forEach((valId) => valueIds.add(valId.toString()));
  });

  product.variants.forEach((variant) => {
    variant.optionValues.forEach((opt) => {
      attributeIds.add(opt.attribute.toString());
      valueIds.add(opt.value.toString());
    });
  });

  // 3. Thực hiện các truy vấn song song để lấy dữ liệu liên quan
  const [categoryData, attributesData] = await Promise.all([
    Category.findById(categoryId).select("name slug image parent").lean(),
    Attribute.find({ _id: { $in: Array.from(attributeIds) } })
      .select("name label values")
      .lean(),
  ]);

  // 4. Tạo các Map để tra cứu nhanh (tối ưu hóa)
  const attributeMap = new Map(
    attributesData.map((attr) => [attr._id.toString(), attr])
  );
  const valueMap = new Map();
  attributesData.forEach((attr) => {
    attr.values.forEach((val) => {
      valueMap.set(val._id.toString(), val);
    });
  });

  // 5. "Làm giàu" (Hydrate) dữ liệu sản phẩm với thông tin đã populate

  // 5.1 Hydrate Category
  product.category = categoryData;

  // 5.2 Hydrate Attributes
  product.attributes = product.attributes
    .map((attr) => {
      const populatedAttribute = attributeMap.get(attr.attribute.toString());
      if (!populatedAttribute) return null; // Bỏ qua nếu không tìm thấy attribute
      const populatedValues = attr.values
        .map((valId) => valueMap.get(valId.toString()))
        .filter(Boolean); // Lọc bỏ giá trị không tìm thấy
      return {
        attribute: populatedAttribute,
        values: populatedValues,
      };
    })
    .filter(Boolean); // Lọc bỏ những thuộc tính null

  // 5.3 Hydrate Variants
  product.variants = product.variants.map((variant) => {
    const populatedOptions = variant.optionValues
      .map((opt) => {
        const populatedAttribute = attributeMap.get(opt.attribute.toString());
        const populatedValue = valueMap.get(opt.value.toString());
        if (!populatedAttribute || !populatedValue) return null; // Bỏ qua nếu không hợp lệ
        return {
          attribute: populatedAttribute,
          value: populatedValue,
        };
      })
      .filter(Boolean); // Lọc bỏ những option không hợp lệ

    // Thêm virtuals cho từng biến thể
    const now = new Date();
    const isOnSale =
      variant.salePrice &&
      variant.salePrice < variant.price &&
      (!variant.salePriceEffectiveDate ||
        variant.salePriceEffectiveDate <= now) &&
      (!variant.salePriceExpiryDate || variant.salePriceExpiryDate >= now);
    variant.isOnSale = isOnSale;
    variant.displayPrice = isOnSale ? variant.salePrice : variant.price;

    return { ...variant, optionValues: populatedOptions };
  });

  // 6. Thêm virtuals cho sản phẩm chính
  const now = new Date();
  const mainProductIsOnSale =
    product.salePrice &&
    product.salePrice < product.price &&
    (!product.salePriceEffectiveDate ||
      product.salePriceEffectiveDate <= now) &&
    (!product.salePriceExpiryDate || product.salePriceExpiryDate >= now);
  
  product.isOnSale = mainProductIsOnSale;
  product.displayPrice = mainProductIsOnSale ? product.salePrice : product.price;

  // 7. Trả về kết quả cuối cùng
  res.json(product);
});

// @desc    Cập nhật sản phẩm
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params; // Lấy ID sản phẩm cần cập nhật
  const updateData = req.body; // Lấy dữ liệu cập nhật từ body request (đã được validate)

  // --- 1. Kiểm tra ID sản phẩm hợp lệ ---
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  // --- 2. Tìm sản phẩm gốc trong DB ---
  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm.");
  }

  // --- 3. Kiểm tra các ràng buộc trước khi cập nhật ---
  // 3.1 Kiểm tra Category mới (nếu được cung cấp và khác category cũ)
  if (
    updateData.category &&
    updateData.category !== product.category.toString()
  ) {
    if (!mongoose.Types.ObjectId.isValid(updateData.category)) {
      res.status(400);
      throw new Error("ID Danh mục mới không hợp lệ.");
    }
    const categoryExists = await Category.findOne({
      _id: updateData.category,
      isActive: true,
    }).lean();
    if (!categoryExists) {
      res.status(404);
      throw new Error("Danh mục mới không tồn tại hoặc không hoạt động.");
    }
  }

  // 3.2 Kiểm tra trùng lặp SKU (phức tạp hơn vì phải loại trừ chính sản phẩm này)
  const skusInUpdateRequest = new Set(); // Kiểm tra trùng trong request
  const skusToCheckAgainstOthers = new Set(); // SKU mới hoặc thay đổi cần kiểm tra với DB

  // Kiểm tra SKU chính
  if (updateData.sku !== undefined) {
    // Chỉ xử lý nếu có gửi SKU lên
    const newSku = updateData.sku || null; // Chuẩn hóa SKU rỗng thành null
    if (newSku && skusInUpdateRequest.has(newSku))
      throw new Error(`SKU "${newSku}" bị trùng lặp trong dữ liệu cập nhật.`);
    if (newSku) skusInUpdateRequest.add(newSku);
    if (newSku !== (product.sku || null)) {
      // Chỉ check với DB nếu SKU thay đổi
      if (newSku) skusToCheckAgainstOthers.add(newSku); // Chỉ check SKU không rỗng
    }
    // Cập nhật SKU chính vào updateData để chuẩn bị gán
    updateData.sku = newSku;
  } else {
    // Nếu không gửi SKU chính lên, giữ nguyên SKU cũ
    updateData.sku = product.sku;
  }

  // Kiểm tra SKU biến thể (nếu có gửi mảng variants lên)
  if (updateData.variants !== undefined) {
    // Chỉ xử lý nếu có gửi mảng variants
    for (const newVar of updateData.variants) {
      if (!newVar.sku) {
        res.status(400);
        throw new Error("Tất cả các biến thể phải có SKU.");
      }
      if (skusInUpdateRequest.has(newVar.sku))
        throw new Error(
          `SKU biến thể "${newVar.sku}" bị trùng lặp trong dữ liệu cập nhật.`
        );
      skusInUpdateRequest.add(newVar.sku);

      // Tìm variant cũ tương ứng (nếu có _id)
      const oldVar = product.variants.find(
        (v) => v._id && newVar._id && v._id.toString() === newVar._id.toString()
      );
      // Chỉ cần kiểm tra với DB nếu:
      // 1. Đây là variant mới (không có oldVar)
      // 2. Hoặc là variant cũ nhưng SKU bị thay đổi
      if (!oldVar || (oldVar && newVar.sku !== oldVar.sku)) {
        skusToCheckAgainstOthers.add(newVar.sku);
      }
    }
  }

  // Thực hiện kiểm tra các SKU cần check với DB
  if (skusToCheckAgainstOthers.size > 0) {
    const querySKUs = Array.from(skusToCheckAgainstOthers);
    const existingProduct = await Product.findOne({
      _id: { $ne: id }, // Quan trọng: Loại trừ sản phẩm đang cập nhật
      $or: [
        { sku: { $in: querySKUs } },
        { "variants.sku": { $in: querySKUs } },
      ],
    }).lean();
    if (existingProduct) {
      const conflictingSKU = querySKUs.find(
        (s) =>
          s === existingProduct.sku ||
          existingProduct.variants?.some((v) => v.sku === s)
      );
      res.status(400);
      throw new Error(
        `SKU "${conflictingSKU}" đã được sử dụng bởi sản phẩm khác.`
      );
    }
  }

  // --- Bước 4: Cập nhật các trường đơn giản trực tiếp vào object product tìm được ---
  // Cập nhật các trường thông thường của sản phẩm
  const simpleFields = [
    "name",
    "description",
    "price",
    "sku",
    "category",
    "images",
    "isPublished",
    "isActive",
    "attributes",
  ];
  simpleFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      product[field] = updateData[field];
    }
  });

  // Cập nhật các trường sale của sản phẩm chính
  if (updateData.salePrice !== undefined) {
    product.salePrice = updateData.salePrice;
  }
  if (updateData.salePriceEffectiveDate !== undefined) {
    product.salePriceEffectiveDate = updateData.salePriceEffectiveDate;
  }
  if (updateData.salePriceExpiryDate !== undefined) {
    product.salePriceExpiryDate = updateData.salePriceExpiryDate;
  }

  // Xử lý logic cho variants nếu có
  if (updateData.variants !== undefined) {
    // Kiểm tra xem client có muốn áp dụng sale của sản phẩm chính cho tất cả các variant không.
    // Điều này xảy ra khi:
    // 1. Sản phẩm chính có giá sale.
    // 2. VÀ không có bất kỳ variant nào trong payload có giá sale riêng5
    const applyMainSaleToVariants =
      product.salePrice !== null && (product.salePrice > 0) & 6;
    !updateData.variants.some(
      (v) => v.salePrice !== null && v.salePrice !== undefined
    );

    if (applyMainSaleToVariants) {
      console.log(
        `[UpdateProduct] Chế độ: Áp dụng sale chính (${product.salePrice}) cho tất cả các biến thể.`
      );
    }

    const newVariantIds = new Set(
      updateData.variants.map((v) => v._id).filter(Boolean)
    );
    // Tạo mảng variants mới, xóa những cái cũ không có trong payload
    product.variants = product.variants.filter((v) =>
      newVariantIds.has(v._id.toString())
    );

    updateData.variants.forEach((variantData) => {
      const existingVariant = product.variants.id(variantData._id);

      if (existingVariant) {
        // --- Cập nhật variant đã có ---
        Object.assign(existingVariant, variantData); // Gán các giá trị mới
        if (applyMainSaleToVariants) {
          existingVariant.salePrice = product.salePrice;
          existingVariant.salePriceEffectiveDate =
            product.salePriceEffectiveDate;
          existingVariant.salePriceExpiryDate = product.salePriceExpiryDate;
        }
      } else {
        // --- Thêm variant mới ---
        if (applyMainSaleToVariants) {
          variantData.salePrice = product.salePrice;
          variantData.salePriceEffectiveDate = product.salePriceEffectiveDate;
          variantData.salePriceExpiryDate = product.salePriceExpiryDate;
        }
        product.variants.push(variantData);
      }
    });
  }

  // Đảm bảo stock chính = 0 nếu có variant
  if (product.variants && product.variants.length > 0) {
    product.stockQuantity = 0;
  } else {
    // Nếu xóa hết variant và không có stockQuantity trong updateData, product.stockQuantity sẽ là giá trị cũ
    // Cần đảm bảo nó có giá trị nếu không có variant
    if (product.stockQuantity === undefined || product.stockQuantity === null) {
      product.stockQuantity =
        updateData.stockQuantity !== undefined ? updateData.stockQuantity : 0;
    }
  }

  // --- Bước 5: Lưu sản phẩm (Các pre-save hook sẽ chạy) ---
  const updatedProductResult = await product.save();

  // --- Bước 6: Populate lại thông tin cần thiết ---
  await updatedProductResult.populate("category", "name slug");

  // --- Bước : Trả về kết quả ---
  res.json(updatedProductResult);
});

// @desc    Xóa sản phẩm (Soft Delete)
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params; // Lấy ID sản phẩm từ URL

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  // Sử dụng findByIdAndUpdate để thực hiện xóa mềm
  // Đặt isActive = false và isPublished = false để ẩn sản phẩm khỏi mọi nơi
  const product = await Product.findByIdAndUpdate(
    id,
    { isActive: false, isPublished: false }, // Cập nhật trạng thái
    { new: false } // Không cần trả về document mới, chỉ cần biết có cập nhật được không
  );

  // Nếu product trả về là null, nghĩa là không tìm thấy sản phẩm với ID đó
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm.");
  }

  // Trả về thông báo thành công
  res.status(200).json({ message: "Sản phẩm đã được xóa (ẩn) thành công." });
});

// @desc    Điều chỉnh tồn kho sản phẩm chính (khi không có variant)
// @route   PUT /api/v1/products/:id/stock
// @access  Private/Admin
const updateProductStock = asyncHandler(async (req, res) => {
  const { id } = req.params; // ID sản phẩm
  const { change, set } = req.body; // Dữ liệu: change (số lượng thay đổi +/-) hoặc set (đặt giá trị mới)

  // --- 1. Validate Input ---
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }
  if (change === undefined && set === undefined) {
    res.status(400);
    throw new Error(
      'Vui lòng cung cấp "change" (số lượng thay đổi) hoặc "set" (số lượng mới).'
    );
  }
  if (change !== undefined && typeof change !== "number") {
    res.status(400);
    throw new Error('"change" phải là một số.');
  }
  // "set" phải là số nguyên không âm
  if (
    set !== undefined &&
    (typeof set !== "number" || set < 0 || !Number.isInteger(set))
  ) {
    res.status(400);
    throw new Error('"set" phải là một số nguyên không âm.');
  }
  // Không cho phép cả change và set cùng lúc
  if (change !== undefined && set !== undefined) {
    res.status(400);
    throw new Error('Không thể cung cấp cả "change" và "set" cùng lúc.');
  }

  // --- 2. Tìm sản phẩm và kiểm tra điều kiện ---
  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm.");
  }
  // Quan trọng: Chỉ cho phép cập nhật stock chính nếu sản phẩm KHÔNG CÓ biến thể
  if (product.variants && product.variants.length > 0) {
    res.status(400);
    throw new Error(
      "Sản phẩm này có biến thể, vui lòng điều chỉnh tồn kho của từng biến thể."
    );
  }

  // --- 3. Tính toán và cập nhật tồn kho ---
  let finalQuantity;
  if (set !== undefined) {
    finalQuantity = set; // Đặt số lượng mới
  } else {
    // Dùng 'change'
    // Đảm bảo stockQuantity hiện tại là số, nếu không thì coi như 0
    const currentStock =
      typeof product.stockQuantity === "number" ? product.stockQuantity : 0;
    finalQuantity = currentStock + change; // Tính số lượng mới dựa trên thay đổi
  }

  // Kiểm tra kết quả không âm
  if (finalQuantity < 0) {
    res.status(400);
    throw new Error(
      `Số lượng tồn kho không thể là số âm (kết quả tính toán: ${finalQuantity}).`
    );
  }

  // Cập nhật tồn kho và lưu lại
  product.stockQuantity = finalQuantity;
  await product.save();

  // --- Gửi thông báo tồn kho ---
  if (product.stockQuantity <= 0) {
    await createAdminNotification(
      "Sản phẩm hết hàng!",
      `Sản phẩm "${product.name}" (SKU: ${
        product.sku || "N/A"
      }) đã hết hàng (Tồn kho: 0).`,
      "PRODUCT_OUT_OF_STOCK",
      `/admin/products/${product._id}/edit`, // Link sửa sản phẩm
      { productId: product._id }
    );
  } else if (product.stockQuantity <= LOW_STOCK_THRESHOLD) {
    await createAdminNotification(
      "Sản phẩm sắp hết hàng!",
      `Sản phẩm "${product.name}" (SKU: ${
        product.sku || "N/A"
      }) sắp hết hàng (Tồn kho: ${product.stockQuantity}).`,
      "PRODUCT_LOW_STOCK",
      `/admin/products/${product._id}/edit`,
      { productId: product._id }
    );
  }

  // --- 4. Trả về kết quả ---
  res.json({
    productId: product._id,
    sku: product.sku || "N/A", // Hiển thị SKU chính nếu có
    newStockQuantity: product.stockQuantity, // Trả về số lượng tồn kho mới
  });
});

// @desc    Điều chỉnh tồn kho của một biến thể cụ thể
// @route   PUT /api/v1/products/:productId/variants/:variantId/stock
// @access  Private/Admin
const updateVariantStock = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params; // Lấy ID sản phẩm và ID biến thể
  const { change, set } = req.body; // Dữ liệu: change hoặc set

  // --- 1. Validate Input ---
  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !mongoose.Types.ObjectId.isValid(variantId)
  ) {
    res.status(400);
    throw new Error("ID sản phẩm hoặc biến thể không hợp lệ.");
  }
  if (change === undefined && set === undefined) {
    res.status(400);
    throw new Error(
      'Vui lòng cung cấp "change" (số lượng thay đổi) hoặc "set" (số lượng mới).'
    );
  }
  if (change !== undefined && typeof change !== "number") {
    res.status(400);
    throw new Error('"change" phải là một số.');
  }
  if (
    set !== undefined &&
    (typeof set !== "number" || set < 0 || !Number.isInteger(set))
  ) {
    res.status(400);
    throw new Error('"set" phải là một số nguyên không âm.');
  }
  if (change !== undefined && set !== undefined) {
    res.status(400);
    throw new Error('Không thể cung cấp cả "change" và "set" cùng lúc.');
  }

  // --- 2. Tìm sản phẩm và biến thể ---
  const product = await Product.findById(productId).populate({
    path: "attributes.attribute",
    select: "label values",
  });
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm.");
  }
  if (!product.variants || product.variants.length === 0) {
    res.status(400);
    throw new Error("Sản phẩm này không có biến thể.");
  }

  // Tìm sub-document variant bằng hàm id() của MongooseArray
  const variant = product.variants.id(variantId);
  if (!variant) {
    res.status(404);
    throw new Error("Không tìm thấy biến thể với ID này trong sản phẩm.");
  }

  // --- 3. Tính toán và cập nhật tồn kho biến thể ---
  let finalQuantity;
  if (set !== undefined) {
    finalQuantity = set;
  } else {
    const currentStock =
      typeof variant.stockQuantity === "number" ? variant.stockQuantity : 0;
    finalQuantity = currentStock + change;
  }

  // Kiểm tra kết quả không âm
  if (finalQuantity < 0) {
    res.status(400);
    throw new Error(
      `Số lượng tồn kho biến thể không thể là số âm (kết quả tính toán: ${finalQuantity}).`
    );
  }

  // Cập nhật tồn kho cho biến thể
  variant.stockQuantity = finalQuantity;
  await product.save();

  // --- Gửi thông báo tồn kho cho biến thể ---
  // 1. Tạo các Map để tra cứu tên thuộc tính và giá trị
  const attributeMap = new Map();
  product.attributes.forEach(attrWrapper => {
      if(attrWrapper.attribute) { // Đảm bảo attribute được populate
        const valueMap = new Map(attrWrapper.attribute.values.map(val => [val._id.toString(), val.value]));
        attributeMap.set(attrWrapper.attribute._id.toString(), {
            label: attrWrapper.attribute.label,
            values: valueMap
        });
      }
  });

  // 2. Xây dựng chuỗi tên hiển thị
  const variantDisplayName = variant.optionValues
    .map((opt) => {
        const attrInfo = attributeMap.get(opt.attribute.toString());
        if (!attrInfo) return '?';
        const valueName = attrInfo.values.get(opt.value.toString());
        return valueName || '?';
    })
    .join(" / ");

  const variantNameForNotification = `${product.name} (${variantDisplayName})`;

   if (variant.stockQuantity <= 0) {
    await createAdminNotification(
      "Biến thể hết hàng!",
      `Biến thể "${variantNameForNotification}" (SKU: ${variant.sku}) của sản phẩm "${product.name}" đã hết hàng (Tồn kho: 0).`,
      "PRODUCT_OUT_OF_STOCK",
      `/admin/products/${product._id}/edit`,
      { productId: product._id, variantId: variant._id }
    );
  } else if (variant.stockQuantity <= LOW_STOCK_THRESHOLD) {
    await createAdminNotification(
      "Biến thể sắp hết hàng!",
      `Biến thể "${variantNameForNotification}" (SKU: ${variant.sku}) của sản phẩm "${product.name}" sắp hết hàng (Tồn kho: ${variant.stockQuantity}).`,
      "PRODUCT_LOW_STOCK",
      `/admin/products/${product._id}/edit`,
      { productId: product._id, variantId: variant._id }
    );
  }

  // --- 4. Trả về kết quả ---
  res.json({
    productId: product._id,
    variantId: variant._id,
    variantSku: variant.sku, // Hiển thị SKU của biến thể
    newStockQuantity: variant.stockQuantity, // Số lượng tồn kho mới của biến thể
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProductByIdOrSlug,
  updateProduct,
  deleteProduct,
  updateProductStock,
  updateVariantStock,
};
