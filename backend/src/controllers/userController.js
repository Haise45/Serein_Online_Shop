const User = require("../models/User");
const Order = require("../models/Order");
const accountSuspendedTemplate = require("../utils/emailTemplates/accountSuspendedTemplate");
const accountReactivatedTemplate = require("../utils/emailTemplates/accountReactivatedTemplate");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");
const emailVerificationOTPTemplate = require("../utils/emailTemplates/emailVerificationOTPTemplate");

// @desc    Get user profile
// @route   GET /api/v1/users/profile
// @access  Private (requires token)
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user is attached by the 'protect' middleware
  const user = req.user;
  if (user) {
    // Tìm địa chỉ mặc định trong mảng addresses
    const defaultAddress = user.addresses.find(
      (addr) => addr.isDefault === true
    );

    // Xây dựng đối tượng response
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      defaultAddress: defaultAddress || null,
    };

    res.json(userProfile);
  } else {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }

  // --- 1. Cập nhật Tên ---
  if (req.body.name !== undefined) {
    user.name = req.body.name || user.name; // Cho phép xóa tên nếu gửi rỗng, hoặc giữ nguyên nếu không gửi
  }

  // --- 2. Cập nhật Email (Yêu cầu xác thực lại) ---
  if (req.body.email && req.body.email.toLowerCase().trim() !== user.email) {
    const newEmail = req.body.email.toLowerCase().trim();

    // Validate định dạng email mới (có thể dùng regex từ User model)
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(newEmail)) {
      res.status(400);
      throw new Error("Địa chỉ email mới không hợp lệ.");
    }

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) {
      res.status(400);
      throw new Error("Email này đã được sử dụng bởi tài khoản khác.");
    }

    // Lưu email mới nhưng đánh dấu là chưa xác thực
    user.email = newEmail;
    user.isEmailVerified = false;

    // Tạo và gửi OTP xác thực cho email mới
    const verificationOTP = user.createEmailVerificationOTP();
    try {
      const emailHtml = emailVerificationOTPTemplate(
        user.name,
        verificationOTP
      );
      await sendEmail({
        email: user.email, // Gửi đến email MỚI
        subject: `Xác Thực Địa Chỉ Email Mới Tại ${
          process.env.SHOP_NAME || "Shop"
        }`,
        message: `Mã OTP để xác thực địa chỉ email mới của bạn là: ${verificationOTP}. Mã này có hiệu lực trong 10 phút.`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error(
        `Lỗi gửi email OTP cho email mới ${user.email}:`,
        emailError
      );
    }
  }

  // --- 3. Cập nhật Mật khẩu (YÊU CẦU MẬT KHẨU CŨ) ---
  if (req.body.password) {
    // Nếu người dùng muốn đặt mật khẩu mới
    if (!req.body.currentPassword) {
      res.status(400);
      throw new Error(
        "Vui lòng nhập mật khẩu hiện tại để thay đổi mật khẩu mới."
      );
    }
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      res.status(401); // Unauthorized
      throw new Error("Mật khẩu hiện tại không chính xác.");
    }

    if (req.body.password.length < 6) {
      res.status(400);
      throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
    }

    if (req.body.password === req.body.currentPassword) {
      res.status(400);
      throw new Error("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
    }

    user.password = req.body.password; // Mongoose pre-save hook sẽ hash
  }

  // --- 4. Cập nhật Số điện thoại (Kiểm tra unique) ---
  const newPhone = req.body.phone;
  if (newPhone !== undefined && newPhone.trim() !== user.phone) {
    const phoneToUpdate = newPhone.trim();
    if (phoneToUpdate === "") {
      // Nếu người dùng muốn xóa SĐT
      user.phone = null; // Hoặc undefined tùy schema
    } else {
      const phoneExists = await User.findOne({
        phone: phoneToUpdate,
        _id: { $ne: user._id },
      }); // Loại trừ chính user này
      if (phoneExists) {
        res.status(400);
        throw new Error(
          "Số điện thoại này đã được sử dụng bởi tài khoản khác."
        );
      }
      user.phone = phoneToUpdate;
    }
  }

  // --- 5. Lưu tất cả thay đổi ---
  const updatedUser = await user.save();

  // --- 6. Trả về thông tin User đã cập nhật (không bao gồm password) ---
  // Nếu email vừa được đổi và chưa xác thực, client cần biết điều này
  // để có thể hiển thị thông báo "Vui lòng xác thực email mới"
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email, // Email mới (có thể chưa xác thực)
    role: updatedUser.role,
    phone: updatedUser.phone,
    isEmailVerified: updatedUser.isEmailVerified, // Sẽ là false nếu email vừa được đổi
  });
});

// --- Admin Only Routes  ---

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search;
  const role = req.query.role;
  const isActive = req.query.isActive;

  // --- Filter ---
  const matchStage = {};
  if (search) {
    const searchRegex = new RegExp(search, "i");
    matchStage.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }
  if (role && ["admin", "customer"].includes(role)) {
    matchStage.role = role;
  }
  if (isActive !== undefined) {
    matchStage.isActive = isActive === "true";
  }

  // --- Aggregation Pipeline ---
  const aggregationPipeline = [
    // Giai đoạn 1: Lọc người dùng
    { $match: matchStage },
    // Giai đoạn 2: Join với collection 'orders' để đếm số đơn hàng
    {
      $lookup: {
        from: "orders", // Tên collection của Order model
        localField: "_id",
        foreignField: "user",
        as: "orders",
      },
    },
    // Giai đoạn 3: Join đơn hàng đã hoàn thành (Processing, Shipped, Delivered)
    {
      $lookup: {
        from: "orders",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$user", "$$userId"] },
                  { $in: ["$status", ["Processing", "Shipped", "Delivered"]] },
                ],
              },
            },
          },
        ],
        as: "completedOrders",
      },
    },

    // Giai đoạn 4: Định dạng đầu ra
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        isEmailVerified: 1,
        isActive: 1,
        createdAt: 1,
        orderCount: { $size: "$orders" },
        totalSpent: { $sum: "$completedOrders.totalPrice" },
      },
    },

    // Giai đoạn 5: Sắp xếp
    { $sort: { createdAt: -1 } },

    // Giai đoạn 6: Phân trang
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const results = await User.aggregate(aggregationPipeline);

  const users = results[0].paginatedResults;
  const totalUsers = results[0].totalCount[0]
    ? results[0].totalCount[0].count
    : 0;
  const totalPages = Math.ceil(totalUsers / limit);

  res.json({
    users,
    totalUsers,
    totalPages,
    currentPage: page,
    limit,
  });
});

// @desc    Get user by ID for Admin (bao gồm cả các đơn hàng)
// @route   GET /api/v1/users/:id/details
// @access  Private/Admin
const getUserDetailsById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400);
    throw new Error("User ID không hợp lệ.");
  }

  const userDetailsPipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "user",
        // Chỉ lấy các đơn hàng đã hoàn thành hoặc đang xử lý để tính chi tiêu
        pipeline: [
          {
            $match: { status: { $in: ["Processing", "Shipped", "Delivered"] } },
          },
        ],
        as: "completedOrders",
      },
    },
    {
      $project: {
        // Lấy tất cả các trường gốc của User
        name: 1,
        email: 1,
        phone: 1,
        role: 1,
        isActive: 1,
        isEmailVerified: 1,
        createdAt: 1,
        addresses: 1, // Lấy cả địa chỉ nếu cần
        // Tính toán các trường mới
        totalSpent: { $sum: "$completedOrders.totalPrice" },
        orderCount: { $size: "$completedOrders" }, // (Tùy chọn) Có thể đếm lại số đơn hàng đã hoàn thành
      },
    },
  ];

  const userDetailsPromise = User.aggregate(userDetailsPipeline);

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (page - 1) * limit;

  const ordersPromise = Order.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select("_id status totalPrice createdAt orderItems")
    .lean();

  const totalOrdersPromise = Order.countDocuments({ user: userId });

  // Chạy song song các query
  const [userDetailsResult, orders, totalOrders] = await Promise.all([
    userDetailsPromise,
    ordersPromise,
    totalOrdersPromise,
  ]);

  const user = userDetailsResult[0]; // Kết quả aggregation luôn là một mảng

  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng.");
  }

  const totalPages = Math.ceil(totalOrders / limit);

  res.json({
    user,
    orders: {
      items: orders,
      currentPage: page,
      totalPages,
      totalOrders,
    },
  });
});

// @desc    Update a user's status (ban/unban) by Admin
// @route   PUT /api/v1/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, reason, suspensionEndDate } = req.body;

  if (typeof isActive !== "boolean") {
    res.status(400);
    throw new Error("Trường 'isActive' là bắt buộc và phải là kiểu boolean.");
  }

  // Nếu đình chỉ thì phải có lý do
  if (isActive === false && !reason) {
    res.status(400);
    throw new Error("Vui lòng cung cấp lý do đình chỉ tài khoản.");
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID người dùng không hợp lệ.");
  }
  if (req.user._id.toString() === id) {
    res.status(400);
    throw new Error("Bạn không thể thay đổi trạng thái của chính mình.");
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Không thể thay đổi trạng thái của tài khoản admin khác.");
  }

  user.isActive = isActive;
  let emailHtml;
  let emailSubject;

  if (isActive === false) {
    // Đình chỉ tài khoản
    user.suspensionReason = reason;
    user.suspensionEndDate = suspensionEndDate || null;
    emailHtml = accountSuspendedTemplate(user.name, reason, suspensionEndDate);
    emailSubject = `[Quan trọng] Tài khoản của bạn tại ${process.env.SHOP_NAME} đã bị đình chỉ`;
  } else {
    // Kích hoạt lại tài khoản
    user.suspensionReason = null;
    user.suspensionEndDate = null;
    emailHtml = accountReactivatedTemplate(user.name);
    emailSubject = `Tài khoản của bạn tại ${process.env.SHOP_NAME} đã được kích hoạt lại`;
  }

  await user.save();

  // Gửi email thông báo cho người dùng
  try {
    await sendEmail({
      email: user.email,
      subject: emailSubject,
      html: emailHtml,
    });
  } catch (emailError) {
    console.error(
      `Lỗi gửi email cập nhật trạng thái cho ${user.email}:`,
      emailError
    );
    // Không ném lỗi ra ngoài để không làm hỏng response thành công
  }

  res
    .status(200)
    .json({ message: `Đã cập nhật trạng thái người dùng thành công.` });
});

// --- Hàm quản lý địa chỉ ---
// @desc    Get user addresses
// @route   GET /api/v1/users/addresses
// @access  Private
const getUserAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses"); // Chỉ lấy trường addresses
  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }
  res.json(user.addresses); // Trả về mảng địa chỉ
});

// @desc    Add a new address
// @route   POST /api/v1/users/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }

  const newAddress = req.body; // Dữ liệu đã được validate bởi middleware

  // Logic xử lý địa chỉ mặc định: Nếu địa chỉ mới là mặc định, bỏ mặc định ở các địa chỉ cũ
  if (newAddress.isDefault === true) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  } else if (user.addresses.length === 0) {
    // Nếu đây là địa chỉ đầu tiên, tự động đặt làm mặc định
    newAddress.isDefault = true;
  } else {
    // Nếu không chỉ định isDefault, mặc định là false (trừ khi là địa chỉ đầu tiên)
    newAddress.isDefault = newAddress.isDefault || false;
  }

  user.addresses.push(newAddress);
  await user.save();

  res.status(201).json(user.addresses); // Trả về danh sách địa chỉ mới nhất
});

// @desc    Update an existing address
// @route   PUT /api/v1/users/addresses/:addressId
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    res.status(400);
    throw new Error("ID địa chỉ không hợp lệ.");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }

  // Tìm sub-document địa chỉ cần cập nhật
  const address = user.addresses.id(addressId);
  if (!address) {
    res.status(404);
    throw new Error("Không tìm thấy địa chỉ.");
  }

  const updates = req.body; // Dữ liệu đã được validate

  // Logic xử lý địa chỉ mặc định khi cập nhật
  if (updates.isDefault === true && !address.isDefault) {
    user.addresses.forEach((addr) => {
      if (addr._id.toString() !== addressId) {
        // Bỏ mặc định ở các địa chỉ khác
        addr.isDefault = false;
      }
    });
  } else if (updates.isDefault === false) {
    // Kiểm tra xem nếu bỏ default cái này thì còn cái nào default không
    const otherDefaults = user.addresses.filter(
      (addr) => addr.isDefault && addr._id.toString() !== addressId
    );
    if (otherDefaults.length === 0 && user.addresses.length > 1) {
      // Nếu không còn cái nào default và có nhiều hơn 1 địa chỉ -> không cho phép bỏ default cái cuối cùng
      // Hoặc bạn có thể tự động chọn 1 cái khác làm default
      res.status(400);
      throw new Error("Phải có ít nhất một địa chỉ mặc định.");
    }
  }

  // Cập nhật các trường của sub-document
  Object.assign(address, updates);

  await user.save();
  res.json(user.addresses); // Trả về danh sách địa chỉ mới nhất
});

// @desc    Delete an address
// @route   DELETE /api/v1/users/addresses/:addressId
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    res.status(400);
    throw new Error("ID địa chỉ không hợp lệ.");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    res.status(404);
    throw new Error("Không tìm thấy địa chỉ.");
  }

  // Kiểm tra nếu xóa địa chỉ mặc định và còn địa chỉ khác
  if (address.isDefault === true && user.addresses.length > 1) {
    res.status(400);
    throw new Error(
      "Không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước."
    );
    // Hoặc: Tự động đặt địa chỉ khác làm mặc định trước khi xóa
    // const nextDefault = user.addresses.find(addr => addr._id.toString() !== addressId);
    // if(nextDefault) nextDefault.isDefault = true;
  }

  // Xóa sub-document khỏi mảng
  user.addresses.pull({ _id: addressId }); // Dùng pull của MongooseArray

  await user.save();
  res.json(user.addresses); // Trả về danh sách địa chỉ còn lại
});

// @desc    Set an address as default
// @route   PUT /api/v1/users/addresses/:addressId/default
// @access  Private
const setDefaultAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    res.status(400);
    throw new Error("ID địa chỉ không hợp lệ.");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }

  let foundAddress = false;
  user.addresses.forEach((addr) => {
    if (addr._id.toString() === addressId) {
      addr.isDefault = true;
      foundAddress = true;
    } else {
      addr.isDefault = false; // Bỏ mặc định ở các địa chỉ khác
    }
  });

  if (!foundAddress) {
    res.status(404);
    throw new Error("Không tìm thấy địa chỉ.");
  }

  await user.save();
  res.json(user.addresses); // Trả về danh sách địa chỉ mới nhất
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUsers, // Admin
  getUserDetailsById, // Admin
  updateUserStatus, // Admin
  // Địa chỉ
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
