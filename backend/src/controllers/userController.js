const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

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
  const user = await User.findById(req.user._id); // Find user by ID from token

  if (user) {
    // Update fields if they are provided in the request body
    user.name = req.body.name || user.name;

    // Handle password update separately and securely
    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.status(400);
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      }
      // Password will be hashed by the pre-save hook
      user.password = req.body.password;
    }

    // --- Xử lý cập nhật Email (kiểm tra unique nếu email thay đổi) ---
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        res.status(400);
        throw new Error("Email này đã được sử dụng bởi tài khoản khác.");
      }
      user.email = req.body.email;
    } else if (req.body.email === user.email) {
      // Không làm gì nếu email gửi lên giống email cũ
    } else {
      user.email = user.email; // Giữ nguyên email cũ nếu không có email trong req.body
    }

    // --- Xử lý cập nhật Phone (kiểm tra unique nếu phone thay đổi) ---
    const newPhone = req.body.phone;
    if (newPhone !== undefined && newPhone !== user.phone) {
      // Chỉ kiểm tra unique nếu phone được gửi lên và khác phone hiện tại
      const phoneExists = await User.findOne({ phone: newPhone });
      if (phoneExists) {
        // Đã có user khác dùng SĐT này
        res.status(400);
        throw new Error(
          "Số điện thoại này đã được sử dụng bởi tài khoản khác."
        );
      }
      // Nếu không bị trùng, cập nhật SĐT
      user.phone = newPhone;
    } else if (newPhone === undefined) {
      // Giữ nguyên phone nếu không có trong req.body
      user.phone = user.phone;
    }
    // Trường hợp newPhone === user.phone thì không cần làm gì

    const updatedUser = await user.save();

    // Respond with updated user info (excluding password)
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      addresses: updatedUser.addresses,
    });
  } else {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }
});

// --- Admin Only Routes  ---

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  // Thêm logic phân trang, tìm kiếm nếu cần
  const users = await User.find({}).select("-password"); // Lấy tất cả user, loại bỏ password
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }
});

// @desc    Delete a user by ID (Admin only)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("ID người dùng không hợp lệ.");
  }

  // Không cho phép admin tự xóa chính mình
  if (req.user._id.toString() === id) {
    res.status(400);
    throw new Error("Bạn không thể xóa tài khoản admin của chính mình.");
  }

  const user = await User.findById(id);

  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại.");
  }

  // Kiểm tra xem người dùng có phải là admin không (để tránh xóa nhầm admin khác nếu logic thay đổi)
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Không thể xóa tài khoản admin khác.");
    // Hoặc có thể cho phép xóa admin khác nếu cần, tùy yêu cầu
  }

  // Thực hiện xóa user
  await User.deleteOne({ _id: id }); // Sử dụng deleteOne hoặc findByIdAndDelete
  // Có thể thêm logic xóa các dữ liệu liên quan khác ở đây nếu cần (ví dụ: đơn hàng của user đó? - cân nhắc kỹ)
  res.status(200).json({ message: "Người dùng đã được xóa thành công." });
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
  getUserById, // Admin
  deleteUser, // Admin
  // Địa chỉ
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
