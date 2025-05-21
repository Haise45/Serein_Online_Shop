const Product = require("../models/Product");
const Category = require("../models/Category");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");
const sanitizeHtml = require("../utils/sanitize");
const { createAdminNotification } = require("../utils/notificationUtils");
const {
  getCategoryDescendants, // Import hàm mới
  fetchAndMapCategories,
} = require("../utils/categoryUtils");

const LOW_STOCK_THRESHOLD = 5; // Ngưỡng cảnh báo tồn kho thấp

// --- Hàm Helper: Xây dựng bộ lọc MongoDB từ query params ---
// Tham số: query (từ req.query), isAdmin (bool - xác định quyền để lọc khác nhau)
const buildFilter = async (query, isAdmin = false) => {
  const andConditions = []; // Sử dụng mảng này để gom các điều kiện AND

  // --- 1. Filter Cơ bản (Active/Published) ---
  if (isAdmin) {
    // Nếu là admin, chỉ áp dụng filter isActive/isPublished NẾU nó được truyền trong query
    if (query.isActive !== undefined) {
      andConditions.push({ isActive: query.isActive === "true" });
    }
    if (query.isPublished !== undefined) {
      andConditions.push({ isPublished: query.isPublished === "true" });
    }
    // Nếu admin KHÔNG truyền query.isActive hoặc query.isPublished,
    // thì sẽ không có điều kiện isActive/isPublished trong filter -> lấy tất cả.
  } else {
    // Người dùng thường luôn chỉ thấy sản phẩm đang hoạt động và đã công khai
    andConditions.push({ isActive: true });
    andConditions.push({ isPublished: true });
  }

  // 2. Filter theo Category (bao gồm cả con cháu)
  if (query.category || query.categoryId) {
    try {
      const categoryMap = await fetchAndMapCategories({ isActive: true });
      let targetCategory = null;

      if (query.category) {
        // Ưu tiên query.category (slug)
        const slugToFind = query.category;
        for (const cat of categoryMap.values()) {
          if (cat.slug === slugToFind) {
            targetCategory = cat;
            break;
          }
        }
        if (!targetCategory) {
          console.log(
            `[Filter] Category slug "${slugToFind}" không tồn tại hoặc không hoạt động.`
          );
          return {
            _id: new mongoose.Types.ObjectId("000000000000000000000000"),
          };
        }
      } else if (
        query.categoryId &&
        mongoose.Types.ObjectId.isValid(query.categoryId)
      ) {
        const idToFind = query.categoryId.toString(); // Chuyển ObjectId sang string để so sánh với key của Map
        targetCategory = categoryMap.get(idToFind);
        if (!targetCategory) {
          console.log(
            `[Filter] Category ID "${idToFind}" không tồn tại trong map hoặc không hoạt động.`
          );
          return {
            _id: new mongoose.Types.ObjectId("000000000000000000000000"),
          };
        }
      }

      if (targetCategory) {
        const categoryIdsToFilter = [targetCategory._id.toString()];
        const descendantIds = getCategoryDescendants(
          targetCategory._id,
          categoryMap
        );
        categoryIdsToFilter.push(...descendantIds);

        const objectIdArray = categoryIdsToFilter.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
        andConditions.push({ category: { $in: objectIdArray } });

        console.log(
          `[Filter] Lọc theo category "${targetCategory.name}" (ID: ${
            targetCategory._id
          }) và các con cháu. IDs: ${categoryIdsToFilter.join(", ")}`
        );
      } else if (
        query.categoryId &&
        !mongoose.Types.ObjectId.isValid(query.categoryId)
      ) {
        // Nếu categoryId được cung cấp nhưng không hợp lệ
        console.log(`[Filter] Category ID "${query.categoryId}" không hợp lệ.`);
        return { _id: new mongoose.Types.ObjectId("000000000000000000000000") };
      }
    } catch (error) {
      console.error("[Filter] Lỗi khi xử lý filter category:", error);
      return { _id: new mongoose.Types.ObjectId("000000000000000000000000") };
    }
  }

  // 3. Filter theo Khoảng giá
  let priceOrCondition = null;
  if (query.minPrice || query.maxPrice) {
    const priceFilter = {};
    const minPriceNum = Number(query.minPrice);
    const maxPriceNum = Number(query.maxPrice);

    if (!isNaN(minPriceNum) && minPriceNum >= 0) {
      priceFilter.$gte = minPriceNum; // Lớn hơn hoặc bằng minPrice
    }
    if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
      // Đảm bảo maxPrice >= minPrice nếu cả hai đều hợp lệ
      if (priceFilter.$gte === undefined || maxPriceNum >= priceFilter.$gte) {
        priceFilter.$lte = maxPriceNum; // Nhỏ hơn hoặc bằng maxPrice
      } else {
        console.warn(
          `[Filter] maxPrice (${maxPriceNum}) nhỏ hơn minPrice (${priceFilter.$gte}). Bỏ qua maxPrice.`
        );
      }
    }

    // Chỉ thêm filter giá nếu có điều kiện hợp lệ
    if (Object.keys(priceFilter).length > 0) {
      // Áp dụng lọc cho giá gốc HOẶC giá của bất kỳ biến thể nào (phổ biến)
      priceOrCondition = {
        $or: [
          { price: priceFilter },
          { variants: { $elemMatch: { price: priceFilter } } },
        ],
      };
    }
  }

  // 4. Filter theo Thuộc tính của Biến thể
  if (query.attributes && typeof query.attributes === "object") {
    // Danh sách các từ khóa chỉ sắc thái, sẽ không dùng regex "chứa" cho chúng
    // Bạn có thể mở rộng danh sách này
    const shadeKeywords = [
      "đất",
      "đậm",
      "nhạt",
      "pastel",
      "sáng",
      "tối",
      "light",
      "dark",
      "neon",
      "baby",
    ];

    for (const attrName in query.attributes) {
      if (Object.prototype.hasOwnProperty.call(query.attributes, attrName)) {
        const attrValuesQuery = query.attributes[attrName]; // Chuỗi giá trị từ query (vd: "Đỏ,Xanh")

        const queryValuesArray = String(attrValuesQuery)
          .split(",")
          .map((v) => v.trim().toLowerCase()) // Chuyển sang chữ thường để so sánh và regex
          .filter((v) => v);

        if (queryValuesArray.length > 0) {
          // Tạo điều kiện $or cho các giá trị được tìm kiếm
          // Ví dụ: attributes[Màu sắc]=Đỏ,Trắng -> tìm variant có màu chứa "đỏ" HOẶC màu chứa "trắng"
          const attributeOrConditions = queryValuesArray.map((queryValue) => {
            // Kiểm tra xem queryValue có phải là một từ khóa sắc thái không
            const isShadeQuery = shadeKeywords.some((keyword) =>
              queryValue.includes(keyword)
            );

            if (attrName.toLowerCase().includes("màu") && !isShadeQuery) {
              // Nếu là thuộc tính "Màu" và không phải là từ khóa sắc thái -> dùng regex
              // Tạo regex để tìm kiếm giá trị chứa queryValue, không phân biệt hoa thường
              // Ví dụ: queryValue = "đỏ" -> regex tìm "Đỏ", "đỏ", "Caro Đỏ Đen"
              // Chúng ta cần đảm bảo rằng từ được tìm là một từ hoàn chỉnh hoặc một phần của từ ghép
              // Ví dụ: tìm "đỏ" sẽ không khớp với "đông"
              // Sử dụng word boundaries (\b) nếu có thể, hoặc kiểm tra khoảng trắng/đầu/cuối chuỗi
              // Cách đơn giản hơn là không dùng word boundaries để "đỏ" khớp "đỏ đậm"
              return {
                attributeName: attrName,
                value: { $regex: new RegExp(queryValue, "i") }, // 'i' for case-insensitive
              };
            } else {
              // Các thuộc tính khác (Size, Chất liệu, ...) hoặc là từ khóa sắc thái -> khớp chính xác (case-insensitive)
              return {
                attributeName: attrName,
                // Khớp chính xác giá trị, không phân biệt hoa thường
                value: { $regex: new RegExp(`^${queryValue}$`, "i") },
              };
            }
          });

          andConditions.push({
            variants: {
              $elemMatch: {
                // Ít nhất một variant phải khớp
                optionValues: {
                  // Trong optionValues của variant đó
                  $elemMatch: {
                    // Ít nhất một optionValue phải khớp với một trong các điều kiện
                    $or: attributeOrConditions,
                  },
                },
              },
            },
          });
          console.log(
            `[Filter Debug] Đã thêm điều kiện lọc cho thuộc tính "${attrName}" với giá trị (hoặc chứa): "${queryValuesArray.join(
              ", "
            )}"`
          );
        }
      }
    }
  }

  // 5. Filter theo mininum ratting
  const minRatingQuery = parseFloat(query.minRating);
  if (!isNaN(minRatingQuery) && minRatingQuery >= 0 && minRatingQuery <= 5) {
    // Chỉ lọc sản phẩm có averageRating >= minRatingQuery
    // và phải có ít nhất 1 review (numReviews > 0) để rating có ý nghĩa
    andConditions.push({ averageRating: { $gte: minRatingQuery } });
    andConditions.push({ numReviews: { $gt: 0 } }); // Chỉ lọc SP có review
    console.log(
      `[Filter Debug] Thêm điều kiện lọc rating >= ${minRatingQuery}`
    );
  }

  // 6. Filter theo tìm kiếm Text ($text index) - Đặt cuối cùng để kết hợp đúng
  if (query.search) {
    console.log(
      `[Filter Debug] Thêm điều kiện tìm kiếm text: "${query.search}"`
    );
    andConditions.push({ $text: { $search: query.search } });
  }

  // --- 7. Kết hợp cuối cùng ---
  let finalFilter = {};

  // Nếu có các điều kiện AND (isActive, isPublished, category, attributes, search)
  if (andConditions.length > 0) {
    finalFilter.$and = andConditions;
  }

  // Nếu có điều kiện OR (từ giá)
  if (priceOrCondition) {
    // Nếu đã có $and, kết hợp $or vào cùng cấp
    if (finalFilter.$and) {
      // Để đảm bảo logic (A AND B AND C) AND (X OR Y)
      // Ta cần cấu trúc: { $and: [ { $and: [A,B,C] }, { $or: [X,Y] } ] } hoặc { $and: [A,B,C, {$or:[X,Y]}] }
      // Cách đơn giản là gộp tất cả vào một $and lớn
      finalFilter.$and = [...(finalFilter.$and || []), priceOrCondition];
    } else {
      // Nếu chỉ có $or (và không có điều kiện andConditions nào)
      // Cần phải đảm bảo các điều kiện cơ bản (isActive, isPublished) vẫn được áp dụng nếu là user thường
      if (!isAdmin) {
        finalFilter.$and = [
          { isActive: true },
          { isPublished: true },
          priceOrCondition,
        ];
      } else {
        // Nếu là admin và chỉ lọc giá
        Object.assign(finalFilter, priceOrCondition);
      }
    }
  }

  // Xử lý trường hợp không có filter nào cả (cho admin)
  // Nếu finalFilter vẫn rỗng và là admin, thì trả về {} để lấy tất cả
  if (isAdmin && Object.keys(finalFilter).length === 0) {
    console.log("[Filter] Admin không lọc gì, trả về filter rỗng.");
    return {};
  }
  if (
    !priceOrCondition &&
    finalFilter.$and &&
    finalFilter.$and.length === (isAdmin ? 0 : 2)
  ) {
    if (isAdmin && finalFilter.$and.length === 0) return {};
    if (
      !isAdmin &&
      finalFilter.$and.every(
        (cond) =>
          ("isActive" in cond && cond.isActive) ||
          ("isPublished" in cond && cond.isPublished)
      )
    ) {
      // Chỉ còn điều kiện mặc định, trả về filter này
    }
  }

  console.log("--- [Filter] Đối tượng Filter cuối cùng (trước khi trả về) ---");
  console.log(JSON.stringify(finalFilter, null, 2));
  console.log("--------------------------------------------------------");
  return finalFilter;
};

// --- Hàm Helper: Xây dựng đối tượng sắp xếp MongoDB ---
const buildSort = (query) => {
  const sort = {};
  // Ưu tiên sắp xếp theo điểm liên quan nếu có tìm kiếm text
  if (query.search) {
    sort.score = { $meta: "textScore" };
  }
  // Xử lý sortBy và sortOrder
  if (query.sortBy) {
    // Danh sách các trường cho phép sắp xếp (để bảo mật và tránh lỗi)
    const allowedSortFields = [
      "price",
      "name",
      "createdAt",
      "updatedAt",
      "totalSold",
      "averageRating",
    ];
    if (allowedSortFields.includes(query.sortBy)) {
      const sortOrder = query.sortOrder === "desc" ? -1 : 1; // Mặc định là 'asc' (1)
      // Chỉ thêm nếu sortBy không phải là 'score' hoặc không có tìm kiếm text (vì score đã được ưu tiên)
      if (!query.search || query.sortBy !== "score") {
        sort[query.sortBy] = sortOrder;
      }
    } else {
      console.warn(
        `[Sort] Sắp xếp theo trường "${query.sortBy}" không được phép. Bỏ qua.`
      );
    }
  }
  // Sắp xếp mặc định nếu không có tiêu chí nào (và không có search)
  if (Object.keys(sort).length === 0) {
    sort.createdAt = -1; // Mới nhất trước
  } else if (query.search && Object.keys(sort).length === 1 && sort.score) {
    // Nếu chỉ có sort theo score, thêm tiêu chí phụ để ổn định kết quả (ví dụ: mới nhất)
    sort.createdAt = -1;
  }
  console.log("--- [Sort] Đối tượng Sort cuối cùng ---");
  console.log(JSON.stringify(sort, null, 2)); // Log để debug
  console.log("------------------------------------");
  return sort;
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/v1/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  // Dữ liệu sản phẩm đã được xác thực bởi middleware validateRequest(createProductSchema)
  const { name, description, category, variants, sku, ...restData } = req.body;

  // --- 1. Kiểm tra sự tồn tại và trạng thái của Category ---
  if (!mongoose.Types.ObjectId.isValid(category)) {
    res.status(400);
    throw new Error("ID Danh mục không hợp lệ.");
  }
  // Chỉ cho phép gán vào category đang active
  const categoryExists = await Category.findOne({
    _id: category,
    isActive: true,
  }).lean();
  if (!categoryExists) {
    res.status(404);
    throw new Error("Danh mục không tồn tại hoặc không hoạt động.");
  }

  // --- 2. Kiểm tra trùng lặp SKU ---
  const skusInRequest = new Set(); // Dùng Set để kiểm tra trùng ngay trong request và với DB
  // Thêm SKU chính vào Set nếu có
  if (sku) {
    if (skusInRequest.has(sku))
      throw new Error(`SKU "${sku}" bị trùng lặp trong dữ liệu gửi lên.`);
    skusInRequest.add(sku);
  }
  // Thêm SKU của các biến thể vào Set
  if (variants && variants.length > 0) {
    for (const v of variants) {
      if (v.sku) {
        if (skusInRequest.has(v.sku))
          throw new Error(
            `SKU biến thể "${v.sku}" bị trùng lặp trong dữ liệu gửi lên.`
          );
        skusInRequest.add(v.sku);
      } else {
        // Schema validation nên bắt lỗi này, nhưng kiểm tra lại cho chắc
        res.status(400);
        throw new Error("Tất cả các biến thể phải có SKU.");
      }
    }
  }
  // Kiểm tra các SKU trong Set với Database
  if (skusInRequest.size > 0) {
    const querySKUs = Array.from(skusInRequest);
    // Tìm bất kỳ sản phẩm nào (không phải chính nó - dù đây là tạo mới nên k cần) có SKU chính hoặc SKU biến thể trùng
    const existingProductWithSKU = await Product.findOne({
      $or: [
        { sku: { $in: querySKUs } },
        { "variants.sku": { $in: querySKUs } },
      ],
    }).lean(); // Dùng lean() vì chỉ cần kiểm tra sự tồn tại
    if (existingProductWithSKU) {
      // Tìm ra SKU nào bị trùng để báo lỗi cụ thể hơn
      const conflictingSKU = querySKUs.find(
        (s) =>
          s === existingProductWithSKU.sku ||
          existingProductWithSKU.variants?.some((v) => v.sku === s)
      );
      res.status(400);
      throw new Error(`SKU "${conflictingSKU}" đã tồn tại trong hệ thống.`);
    }
  }

  // Áp dụng logic sale cho variants khi tạo mới
  if (variants && variants.length > 0) {
    const mainProductHasSalePrice =
      salePrice !== undefined && salePrice !== null;
    const anyVariantHasSpecificSalePrice = variants.some(
      (v) => v.salePrice !== undefined && v.salePrice !== null
    );

    if (mainProductHasSalePrice && !anyVariantHasSpecificSalePrice) {
      finalVariants = variants.map((v) => ({
        ...v,
        salePrice: salePrice,
        salePriceEffectiveDate: salePriceEffectiveDate || null,
        salePriceExpiryDate: salePriceExpiryDate || null,
      }));
      console.log(
        `[CreateProduct] Áp dụng sale chính cho tất cả các Variants mới.`
      );
    }
  }

  // --- 3. Tạo đối tượng Product mới ---
  const product = new Product({
    name,
    description: description ? sanitizeHtml(description) : "",
    category, // Lưu ID category
    variants: variants || [], // Đảm bảo là mảng rỗng nếu không có
    sku: sku || null, // Đảm bảo là null nếu không có
    salePrice, // salePrice cho sản phẩm chính
    salePriceEffectiveDate,
    salePriceExpiryDate,
    ...restData, // Các trường còn lại như description, price, images, isPublished...
  });

  // --- 4. Lưu sản phẩm vào DB ---
  // Các middleware pre('save') trong model (tạo slug, kiểm tra stock) sẽ được kích hoạt
  const createdProduct = await product.save();

  // --- 5. Populate thông tin category sau khi lưu ---
  // Làm cho response trả về có đầy đủ thông tin category thay vì chỉ ID
  await createdProduct.populate("category", "name slug parent");

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
  const sort = buildSort(req.query); // Hàm helper đã tạo

  // --- Xây dựng projection (chọn lọc các trường trả về) ---
  let projection = {};

  // Các trường cần thiết cho hiển thị danh sách sản phẩm
  const selectFieldsForList = {
    name: 1,
    slug: 1,
    price: 1, // Giá gốc
    salePrice: 1, // Giá sale (nếu có)
    salePriceEffectiveDate: 1,
    salePriceExpiryDate: 1,
    images: { $slice: 2 }, // Lấy 2 ảnh đầu tiên (cho hover đổi ảnh)
    category: 1, // Sẽ được populate
    averageRating: 1,
    numReviews: 1,
    totalSold: 1,
    createdAt: 1, // Để tính isNew
    isPublished: 1, // Cho admin và logic
    isActive: 1, // Cho admin và logic
    attributes: 1, // <<< Lấy attributes để biết có "Màu sắc" không
    variants: {
      _id: 1,
      sku: 1, // Có thể cần SKU nếu click màu chọn variant
      price: 1,
      salePrice: 1,
      salePriceEffectiveDate: 1,
      salePriceExpiryDate: 1,
      images: { $slice: 2 }, // Ảnh riêng của variant
      optionValues: 1, // QUAN TRỌNG: để lấy màu sắc, size
      stockQuantity: 1, // Có thể cần để check còn hàng không
    },
  };

  // Nếu có tìm kiếm text, thêm trường 'score' vào projection
  if (req.query.search) {
    projection.score = { $meta: "textScore" };
  }

  // --- Thực hiện Query ---
  // Query lấy danh sách sản phẩm
  const productsQuery = Product.find(filter) // Áp dụng bộ lọc
    .populate("category", "name slug parent") // Lấy thông tin 'name' và 'slug' của category liên kết
    .select({ ...projection, ...selectFieldsForList }) // Chọn lọc các trường cần thiết và score (nếu có)
    .sort(sort) // Áp dụng sắp xếp
    .skip(skip) // Bỏ qua các sản phẩm của trang trước
    .limit(limit); // Giới hạn số lượng sản phẩm trên trang này

  // Query đếm tổng số sản phẩm thỏa mãn bộ lọc (để tính tổng số trang)
  const totalProductsQuery = Product.countDocuments(filter);

  // Thực thi cả 2 query song song để tiết kiệm thời gian
  const [products, totalProducts] = await Promise.all([
    productsQuery.exec(), // Thực thi query lấy danh sách
    totalProductsQuery.exec(), // Thực thi query đếm
  ]);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(totalProducts / limit);

  // --- Trả về kết quả phân trang ---
  res.json({
    currentPage: page, // Trang hiện tại
    totalPages: totalPages, // Tổng số trang
    totalProducts: totalProducts, // Tổng số sản phẩm khớp filter
    limit: limit, // Số sản phẩm mỗi trang
    products: products, // Mảng sản phẩm của trang hiện tại
  });
});

// @desc    Lấy chi tiết một sản phẩm bằng ID hoặc Slug
// @route   GET /api/v1/products/:idOrSlug
// @access  Public
const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const idOrSlug = req.params.idOrSlug; // Lấy ID hoặc Slug từ URL
  let product = null; // Khởi tạo product là null
  const isAdmin = req.user?.role === "admin"; // Kiểm tra quyền admin (nếu user đã đăng nhập)

  // Xây dựng điều kiện query cơ bản
  const queryConditions = {};
  if (!isAdmin) {
    // Nếu không phải admin, chỉ lấy sản phẩm đang hoạt động
    queryConditions.isActive = true;
  }

  // Ưu tiên tìm bằng ID nếu idOrSlug là một ObjectId hợp lệ
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    queryConditions._id = idOrSlug; // Thêm điều kiện tìm theo ID
    product = await Product.findOne(queryConditions).populate(
      "category",
      "name slug image parent"
    ); // Lấy đủ thông tin category
  }

  // Nếu không phải ID hợp lệ hoặc không tìm thấy bằng ID, thử tìm bằng Slug
  if (!product) {
    // Reset điều kiện _id nếu đã tìm bằng ID thất bại
    if (queryConditions._id) delete queryConditions._id;
    queryConditions.slug = idOrSlug; // Thêm điều kiện tìm theo slug
    product = await Product.findOne(queryConditions).populate(
      "category",
      "name slug image parent"
    );
  }

  // Nếu sau cả 2 lần tìm vẫn không thấy sản phẩm
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm.");
  }

  // Kiểm tra trạng thái isPublished nếu người dùng không phải admin
  if (!product.isPublished && !isAdmin) {
    res.status(404); // Trả về 404 thay vì 403 để không tiết lộ sản phẩm tồn tại nhưng chưa publish
    throw new Error("Sản phẩm này không tồn tại hoặc chưa được công khai.");
  }

  // Trả về toàn bộ thông tin chi tiết của sản phẩm tìm được
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
  // Dùng cách này thay vì findByIdAndUpdate để tận dụng Mongoose pre-save hooks và xử lý variant dễ hơn
  Object.keys(updateData).forEach((key) => {
    if (key !== "variants" && key !== "_id") {
      // Không cập nhật variants ở đây, không cập nhật _id
      // Chỉ cập nhật stockQuantity nếu không có variant (hoặc mảng variant gửi lên rỗng)
      if (
        key === "stockQuantity" &&
        updateData.variants &&
        updateData.variants.length > 0
      ) {
        // Bỏ qua cập nhật stockQuantity nếu có gửi variant lên
        return;
      }
      product[key] = updateData[key];
    }
  });

  // --- Bước 5: Xử lý cập nhật mảng Variants VÀ LOGIC SALE MỚI ---
  if (updateData.variants !== undefined) {
    // Kiểm tra xem có salePrice nào được set cho sản phẩm chính không
    const mainProductHasSalePrice =
      updateData.salePrice !== undefined && updateData.salePrice !== null;

    // Kiểm tra xem có bất kỳ variant nào trong payload có salePrice được set riêng không
    const anyVariantHasSpecificSalePrice = updateData.variants.some(
      (v) => v.salePrice !== undefined && v.salePrice !== null
    );

    let variantsToUpdate = updateData.variants.map((variantData) => {
      // Tìm variant hiện có bằng _id để giữ lại các trường không được gửi lên
      const existingVariant = product.variants.find(
        (v) =>
          v._id &&
          variantData._id &&
          v._id.toString() === variantData._id.toString()
      );

      let finalVariantData = { ...existingVariant?.toObject(), ...variantData };

      if (mainProductHasSalePrice && !anyVariantHasSpecificSalePrice) {
        // Áp dụng sale từ sản phẩm chính cho variant này
        finalVariantData.salePrice = updateData.salePrice;
        finalVariantData.salePriceEffectiveDate =
          updateData.salePriceEffectiveDate || null;
        finalVariantData.salePriceExpiryDate =
          updateData.salePriceExpiryDate || null;
        console.log(
          `[UpdateProduct] Áp dụng sale chính cho Variant ID: ${
            finalVariantData._id || "Mới"
          }, SKU: ${finalVariantData.sku}. Sale Price: ${
            finalVariantData.salePrice
          }`
        );
      } else if (variantData.salePrice === undefined && existingVariant) {
        // Nếu không có salePrice trong payload cho variant này,
        // và không rơi vào trường hợp apply sale chính, thì giữ nguyên salePrice cũ của variant (nếu có)
        // hoặc để là null nếu variantData.salePrice là null (nghĩa là client muốn xóa sale của variant)
        finalVariantData.salePrice = variantData.hasOwnProperty("salePrice")
          ? variantData.salePrice
          : existingVariant.salePrice;
        finalVariantData.salePriceEffectiveDate = variantData.hasOwnProperty(
          "salePriceEffectiveDate"
        )
          ? variantData.salePriceEffectiveDate
          : existingVariant.salePriceEffectiveDate;
        finalVariantData.salePriceExpiryDate = variantData.hasOwnProperty(
          "salePriceExpiryDate"
        )
          ? variantData.salePriceExpiryDate
          : existingVariant.salePriceExpiryDate;
      } else {
        // Nếu variant có salePrice riêng trong payload, hoặc đây là variant mới không có sale chính áp dụng
        // thì các trường salePrice, salePriceEffectiveDate, salePriceExpiryDate sẽ lấy từ variantData
        // (đã được gán qua spread operator ở trên)
        // Nếu variantData.salePrice là null, nó sẽ xóa sale của variant đó.
        // Nếu variantData.salePrice không được gửi (undefined), và không có sale chính áp dụng,
        // thì nó sẽ giữ nguyên salePrice của variant cũ (nếu là update) hoặc là null (nếu là tạo mới).
        // Dòng này đảm bảo nếu client gửi salePrice: null cho variant, nó sẽ được áp dụng
        if (variantData.hasOwnProperty("salePrice")) {
          finalVariantData.salePrice = variantData.salePrice;
          finalVariantData.salePriceEffectiveDate =
            variantData.salePriceEffectiveDate || null;
          finalVariantData.salePriceExpiryDate =
            variantData.salePriceExpiryDate || null;
        }
      }
      return finalVariantData;
    });
    product.variants = variantsToUpdate;
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

  // --- Bước 6: Lưu sản phẩm (Các pre-save hook sẽ chạy) ---
  const updatedProductResult = await product.save();

  // --- Bước 7: Populate lại thông tin cần thiết ---
  await updatedProductResult.populate("category", "name slug");

  // --- Bước 8: Trả về kết quả ---
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
      `/admin/products/edit/${product._id}`, // Link sửa sản phẩm
      { productId: product._id }
    );
  } else if (product.stockQuantity <= LOW_STOCK_THRESHOLD) {
    await createAdminNotification(
      "Sản phẩm sắp hết hàng!",
      `Sản phẩm "${product.name}" (SKU: ${
        product.sku || "N/A"
      }) sắp hết hàng (Tồn kho: ${product.stockQuantity}).`,
      "PRODUCT_LOW_STOCK",
      `/admin/products/edit/${product._id}`,
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
  const product = await Product.findById(productId);
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
  const variantName = `${product.name} (${variant.optionValues
    .map((o) => o.value)
    .join("/")})`;
  if (variant.stockQuantity <= 0) {
    await createAdminNotification(
      "Biến thể hết hàng!",
      `Biến thể "${variantName}" (SKU: ${variant.sku}) của sản phẩm "${product.name}" đã hết hàng (Tồn kho: 0).`,
      "PRODUCT_OUT_OF_STOCK", // Có thể tạo type riêng: VARIANT_OUT_OF_STOCK
      `/admin/products/edit/${product._id}`, // Link sửa sản phẩm
      { productId: product._id, variantId: variant._id }
    );
  } else if (variant.stockQuantity <= LOW_STOCK_THRESHOLD) {
    await createAdminNotification(
      "Biến thể sắp hết hàng!",
      `Biến thể "${variantName}" (SKU: ${variant.sku}) của sản phẩm "${product.name}" sắp hết hàng (Tồn kho: ${variant.stockQuantity}).`,
      "PRODUCT_LOW_STOCK", // Có thể tạo type riêng: VARIANT_LOW_STOCK
      `/admin/products/edit/${product._id}`,
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
