const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");
const { createAdminNotification } = require("../utils/notificationUtils");

// --- Hàm Helper Tính toán Rating ---
const calculateAndUpdateProductRating = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  try {
    const stats = await Review.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          isApproved: true,
        },
      },
      {
        $group: {
          _id: "$product",
          numReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const updateData = { numReviews: 0, averageRating: 0 }; // Giá trị mặc định nếu không có review

    if (stats.length > 0) {
      updateData.numReviews = stats[0].numReviews;
      // Làm tròn rating trước khi cập nhật
      updateData.averageRating = Math.round(stats[0].averageRating * 10) / 10;
    }

    // Cập nhật Product bằng ID đã được xác thực
    await Product.findByIdAndUpdate(productId, updateData);

    console.log(
      `[Rating Calc] Đã cập nhật Product ${productId}: numReviews=${updateData.numReviews}, averageRating=${updateData.averageRating}`
    );
  } catch (error) {
    console.error(
      `[Rating Calc] Lỗi khi tính toán rating cho Product ${productId}:`,
      error
    );
  }
};

// --- Hàm Helper: Xây dựng bộ lọc Review ---
const buildReviewFilter = (query, isAdmin = false, productIdParam = null) => {
  const filter = {}; // Khởi tạo filter

  // 1. Lọc theo Sản phẩm cụ thể (nếu productId được truyền từ URL params)
  if (productIdParam && mongoose.Types.ObjectId.isValid(productIdParam)) {
    filter.product = new mongoose.Types.ObjectId(productIdParam);
  }
  // Nếu admin lọc theo productId từ query param (ghi đè nếu có)
  else if (
    isAdmin &&
    query.productId &&
    mongoose.Types.ObjectId.isValid(query.productId)
  ) {
    filter.product = new mongoose.Types.ObjectId(query.productId);
  }

  // 2. Lọc theo trạng thái duyệt (isApproved)
  if (!isAdmin) {
    // Public chỉ thấy review đã duyệt
    filter.isApproved = true;
  } else {
    // Admin có thể lọc theo isApproved
    if (query.isApproved !== undefined) {
      filter.isApproved = query.isApproved === "true";
    }
  }

  // 3. Lọc theo Rating
  const ratingQuery = parseInt(query.rating, 10);
  if (!isNaN(ratingQuery) && ratingQuery >= 1 && ratingQuery <= 5) {
    filter.rating = ratingQuery;
  }

  // 4. Lọc những review có ảnh người dùng
  if (query.hasUserImages === "true") {
    // Tìm những review có trường userImages tồn tại VÀ không phải là mảng rỗng
    filter.userImages = { $exists: true, $ne: [] };
  } else if (query.hasUserImages === "false") {
    filter.userImages = { $or: [{ $exists: false }, { $eq: [] }] }; // Không có hoặc là mảng rỗng
  }

  // 5. Lọc theo User (chỉ Admin)
  if (
    isAdmin &&
    query.userId &&
    mongoose.Types.ObjectId.isValid(query.userId)
  ) {
    filter.user = new mongoose.Types.ObjectId(query.userId);
  }

  // 6. Tìm kiếm theo Nội dung Comment (Admin & Public) - Dùng Regex
  if (query.searchComment) {
    filter.comment = { $regex: query.searchComment.trim(), $options: "i" }; // Tìm kiếm không phân biệt hoa thường
  }

  // 7. Tìm kiếm theo Thông tin Sản phẩm (Tên/SKU - Chỉ Admin, cần Aggregation)
  // Phần này phức tạp hơn, tạm thời bỏ qua trong filter đơn giản này.
  // Admin nên tìm productId trước rồi lọc theo productId.

  console.log("--- [Review Filter] Đối tượng Filter cuối cùng ---");
  console.log(JSON.stringify(filter, null, 2));
  console.log("---------------------------------------------");
  return filter;
};

// --- Hàm Helper: Xây dựng đối tượng sắp xếp Review ---
const buildReviewSort = (query) => {
  const sort = {};
  const allowedSortFields = ["createdAt", "rating", "updatedAt", "approvedAt"];
  if (query.sortBy && allowedSortFields.includes(query.sortBy)) {
    const sortOrder = query.sortOrder === "asc" ? 1 : -1; // Mặc định desc
    sort[query.sortBy] = sortOrder;
  } else {
    // Mặc định sắp xếp theo ngày tạo mới nhất
    sort.createdAt = -1;
  }
  console.log("--- [Review Sort] Đối tượng Sort cuối cùng ---");
  console.log(JSON.stringify(sort, null, 2));
  console.log("-------------------------------------------");
  return sort;
};

// --- USER APIs ---

// @desc    Tạo review mới cho sản phẩm
// @route   POST /api/v1/products/:productId/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, orderId, userImages } = req.body;
  const productId = req.params.productId;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("ID đơn hàng không hợp lệ.");
  }

  // 1. Kiểm tra xem sản phẩm có tồn tại không
  const product = await Product.findById(productId).lean();
  if (!product) {
    res.status(400);
    throw new Error("Không tìm thấy sản phẩm.");
  }

  // 2. Kiểm tra xem user đã mua sản phẩm này trong đơn hàng đó chưa
  // Chỉ cần kiểm tra đơn hàng thuộc về user và đã giao thành công (Delivered)
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
    status: "Delivered",
    "orderItems.product": productId,
  }).lean();

  if (!order) {
    res.status(403);
    throw new Error(
      "Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng thành công từ đơn hàng này."
    );
  }

  // 3. Kiểm tra xem user đã review sản phẩm này trước đó chưa
  const existingReview = await Review.findOne({
    user: userId,
    product: productId,
  }).lean();

  if (existingReview) {
    res.status(400);
    throw new Error("Bạn đã đánh giá sản phẩm này trước đó.");
  }

  // 4. Tạo review mới
  const review = await Review.create({
    rating,
    comment,
    user: userId,
    product: productId,
    order: orderId,
    userImages: userImages || [], // Lưu ảnh user gửi
    isApproved: false, // Chờ admin duyệt
  });

  // --- Gửi thông báo cho Admin ---
  // Populate product để lấy tên cho thông báo
  const productForNotification = await Product.findById(productId)
    .select("name")
    .lean();
  await createAdminNotification(
    "Đánh giá sản phẩm mới",
    `Có đánh giá mới cho sản phẩm "${
      productForNotification?.name || "Không rõ"
    }" từ người dùng "${req.user.name}".`,
    "NEW_REVIEW_SUBMITTED",
    `/admin/reviews?isApproved=false`, // Link tới trang duyệt review
    { reviewId: review._id, productId: productId, userId: req.user._id }
  );

  res.status(201).json({
    message: "Đánh giá của bạn đã được gửi và đang chờ duyệt.",
    review,
  });
});

// @desc    User chỉnh sửa review của mình (một lần duy nhất, nếu chưa có admin reply)
// @route   PUT /api/v1/reviews/:reviewId
// @access  Private
const updateUserReview = asyncHandler(async (req, res) => {
  // --- Bước 1: Lấy dữ liệu đầu vào ---
  const reviewId = req.params.reviewId;
  const { rating, comment, userImages } = req.body;
  const userId = req.user._id;

  // --- Bước 2: Validate ID của review ---
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("ID đánh giá không hợp lệ.");
  }

  // --- Bước 3: Tìm review và kiểm tra quyền sở hữu ---
  // Tìm review dựa trên ID và đảm bảo nó thuộc về người dùng hiện tại.
  const review = await Review.findOne({
    _id: reviewId,
    user: userId, // Chỉ user tạo ra review mới có quyền sửa
  });

  // Nếu không tìm thấy review (hoặc không thuộc về user này)
  if (!review) {
    res.status(404);
    throw new Error(
      "Không tìm thấy đánh giá của bạn hoặc bạn không có quyền sửa."
    );
  }

  // --- Bước 4: Kiểm tra điều kiện cho phép sửa ---
  // Điều kiện 4.1: Nếu admin đã phản hồi review, không cho phép user sửa nữa.
  if (review.adminReply && review.adminReply.comment) {
    res.status(403);
    throw new Error(
      "Đánh giá này đã có phản hồi từ quản trị viên và không thể chỉnh sửa thêm."
    );
  }

  // Điều kiện 4.2: Kiểm tra xem review đã được chỉnh sửa trước đó chưa.
  // User chỉ được phép chỉnh sửa review của mình một lần duy nhất.
  if (review.isEdited) {
    res.status(403);
    throw new Error("Bạn chỉ có thể chỉnh sửa đánh giá này một lần.");
  }

  // --- Bước 5: Xác định và áp dụng các thay đổi ---
  let hasChanges = false; // Biến cờ để theo dõi xem có sự thay đổi thực sự nào không

  // Cập nhật rating nếu được cung cấp và khác với giá trị hiện tại
  if (rating !== undefined && review.rating !== rating) {
    review.rating = rating;
    hasChanges = true;
  }
  // Cập nhật comment nếu được cung cấp và khác với giá trị hiện tại
  if (comment !== undefined && review.comment !== comment) {
    review.comment = comment;
    hasChanges = true;
  }
  // Cập nhật userImages nếu được cung cấp
  if (userImages !== undefined) {
    review.userImages = userImages;
    hasChanges = true;
  }

  // Nếu không có trường nào được thay đổi so với dữ liệu hiện tại
  if (!hasChanges) {
    await review.populate("user", "name");
    return res.status(200).json({
      message: "Không có thông tin nào được thay đổi.",
      review: review,
    });
  }

  // --- Bước 6: Cập nhật trạng thái của review sau khi chỉnh sửa ---
  review.isEdited = true; // Đánh dấu là review này đã được chỉnh sửa
  const wasApprovedBeforeEdit = review.isApproved; // Lưu lại trạng thái duyệt trước khi sửa

  // Sau khi user sửa, review cần được duyệt lại bởi admin.
  review.isApproved = false; // Đặt lại trạng thái duyệt
  review.approvedBy = null; // Xóa thông tin người duyệt cũ
  review.approvedAt = null; // Xóa thời gian duyệt cũ

  // Xóa phản hồi cũ của admin nếu có, vì nội dung review đã thay đổi.
  // review.adminReply = null;

  // --- Bước 7: Lưu các thay đổi vào database ---
  await review.save();

  // --- Bước 8: Gửi thông báo cho Admin (nếu có) ---
  try {
    // Lấy tên sản phẩm để hiển thị trong thông báo
    const productForNotification = await Product.findById(review.product)
      .select("name")
      .lean();

    await createAdminNotification(
      "Đánh giá sản phẩm đã được sửa",
      `Đánh giá cho sản phẩm "${
        productForNotification?.name || "Không rõ"
      }" bởi "${req.user.name}" đã được chỉnh sửa và cần duyệt lại.`,
      "REVIEW_EDITED",
      `/admin/reviews?isApproved=false&reviewId=${review._id}`,
      { reviewId: review._id, productId: review.product, userId: req.user._id }
    );
  } catch (notificationError) {
    console.error(
      "Lỗi khi gửi thông báo admin về review đã sửa:",
      notificationError
    );
  }

  // --- Bước 9: Tính toán lại rating trung bình cho sản phẩm ---
  if (wasApprovedBeforeEdit) {
    await calculateAndUpdateProductRating(review.product);
  }

  // --- Bước 10: Chuẩn bị và gửi phản hồi cho client ---
  const populatedReview = await Review.findById(review._id)
    .populate("user", "name")
    .populate({ path: "adminReply.user", select: "name" })
    .lean();

  res.status(200).json({
    message: "Đánh giá của bạn đã được cập nhật và đang chờ duyệt lại.",
    review: populatedReview,
  });
});

// @desc    Lấy review của người dùng hiện tại cho một sản phẩm cụ thể
// @route   GET /api/v1/reviews/my-review?productId=<productId>
// @access  Private
const getMyReviewForProduct = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.query;

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("Vui lòng cung cấp ID sản phẩm hợp lệ.");
  }

  const review = await Review.findOne({
    user: userId,
    product: productId,
  })
    .populate("user", "name")
    .populate({ path: "adminReply.user", select: "name" })
    .lean();

  if (!review) {
    return res.status(200).json(null);
  }

  res.status(200).json(review);
});

// @desc    Lấy danh sách review đã duyệt của sản phẩm (có phân trang và lọc)
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error("ID sản phẩm không hợp lệ.");
  }

  // --- Sử dụng Filter và Sort Helpers ---
  // Truyền productId từ params vào buildReviewFilter
  const filter = buildReviewFilter(req.query, false, productId); // isAdmin=false
  const sort = buildReviewSort(req.query);

  // Chỉ lấy các trường cần thiết cho public view
  const selectFields = "rating comment user userImages createdAt adminReply";

  const reviewsQuery = Review.find(filter)
    .populate("user", "name")
    .populate({ path: "adminReply.user", select: "name" })
    .select(selectFields)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalReviewsQuery = Review.countDocuments(filter);

  const productExists = await Product.countDocuments({ _id: productId });
  if (productExists === 0) {
    res.status(404);
    throw new Error("Sản phẩm không tồn tại.");
  }

  const [reviews, totalReviews] = await Promise.all([
    reviewsQuery.exec(),
    totalReviewsQuery.exec(),
  ]);

  const totalPages = Math.ceil(totalReviews / limit);

  res.json({
    currentPage: page,
    totalPages: totalPages,
    totalReviews: totalReviews,
    limit: limit,
    reviews: reviews,
  });
});

// @desc    User xóa review của mình
// @route   DELETE /api/v1/reviews/:reviewId/my
// @access  Private
const deleteMyReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("ID đánh giá không hợp lệ.");
  }

  const review = await Review.findOne({ _id: reviewId, user: userId });

  if (!review) {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá hoặc bạn không có quyền xóa.");
  }

  const productId = review.product;
  const wasApproved = review.isApproved;

  await Review.deleteOne({ _id: reviewId });

  if (wasApproved) {
    await calculateAndUpdateProductRating(productId);
  }

  res.status(200).json({ message: "Đánh giá của bạn đã được xóa thành công." });
});

// --- ADMIN APIs ---

// @desc    Lấy tất cả reviews (Admin - có filter, sort, pagination)
// @route   GET /api/v1/reviews
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // --- Sử dụng Filter và Sort Helpers ---
  const filter = buildReviewFilter(req.query, true); // isAdmin=true
  const sort = buildReviewSort(req.query);

  // Admin cần xem nhiều thông tin hơn
  const reviewsQuery = Review.find(filter)
    .populate("user", "name email") // Lấy đầy đủ thông tin user
    .populate("product", "name slug sku") // Lấy đủ thông tin product
    .populate("approvedBy", "name") // Admin nào đã duyệt
    .populate("adminReply.user", "name") // Admin nào đã phản hồi
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const totalReviewsQuery = Review.countDocuments(filter);

  const [reviews, totalReviews] = await Promise.all([
    reviewsQuery.exec(),
    totalReviewsQuery.exec(),
  ]);

  const totalPages = Math.ceil(totalReviews / limit);

  res.json({
    currentPage: page,
    totalPages: totalPages,
    totalReviews: totalReviews,
    limit: limit,
    reviews: reviews,
  });
});

// @desc    Admin duyệt review
// @route   PUT /api/v1/reviews/:reviewId/approve
// @access  Private/Admin
const approveReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId;
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("ID đánh giá không hợp lệ.");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá.");
  }

  if (review.isApproved) {
    res.status(400);
    throw new Error("Đánh giá này đã được duyệt trước đó.");
  }

  review.isApproved = true;
  review.approvedBy = req.user._id;
  review.approvedAt = Date.now();

  await review.save();

  // Tính toán lại rating cho sản phẩm
  await calculateAndUpdateProductRating(review.product);

  await review.populate("user", "name email");
  await review.populate("product", "name slug");

  res.json({
    message: "Đánh giá đã được duyệt.",
    review,
  });
});

// @desc    Admin từ chối/ẩn review
// @route   PUT /api/v1/reviews/:reviewId/reject
// @access  Private/Admin
const rejectReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId;
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("ID đánh giá không hợp lệ.");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá.");
  }

  const wasApproved = review.isApproved;
  review.isApproved = false;

  await review.save();

  // Tính toán lại rating nếu review này TRƯỚC ĐÓ đã được duyệt
  if (wasApproved) {
    await calculateAndUpdateProductRating(review.product);
  }

  await review.populate("user", "name email");
  await review.populate("product", "name slug");

  res.json({ message: "Đánh giá đã được ẩn/từ chối.", review });
});

// @desc    Admin xóa hẳn review
// @route   DELETE /api/v1/reviews/:reviewId
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId;
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("ID đánh giá không hợp lệ.");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá.");
  }

  const productId = review.product; // Lưu lại productId trước khi xóa
  const wasApproved = review.isApproved; // Lưu trạng thái cũ

  await Review.deleteOne({ _id: reviewId });

  // Tính toán lại rating nếu review này TRƯỚC ĐÓ đã được duyệt
  if (wasApproved) {
    await calculateAndUpdateProductRating(productId);
  }

  res.status(200).json({ message: "Đánh giá đã được xóa thành công." });
});

// @desc    Admin phản hồi một review
// @route   POST /api/v1/reviews/:reviewId/reply
// @access  Private/Admin
const addAdminReply = asyncHandler(async (req, res) => {
  const reviewId = req.params.reviewId;
  const { comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    res.status(400);
    throw new Error("ID đánh giá không hợp lệ.");
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Không tìm thấy đánh giá.");
  }
  if (!review.isApproved) {
    res.status(400);
    throw new Error("Không thể phản hồi review chưa được duyệt.");
  }

  review.adminReply = {
    user: req.user._id,
    comment: comment,
  };

  await review.save();
  await review.populate("user", "name email");
  await review.populate("product", "name slug");
  await review.populate("adminReply.user", "name");

  res
    .status(201)
    .json({ message: "Đã thêm phản hồi của quản trị viên.", review });
});

module.exports = {
  // User
  createReview,
  getProductReviews,
  getMyReviewForProduct,
  updateUserReview,
  deleteMyReview,
  // Admin
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  addAdminReply,
};
