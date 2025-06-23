const Attribute = require("../models/Attribute");
const asyncHandler = require("../middlewares/asyncHandler");

// @desc    Tạo thuộc tính mới (VD: "Màu sắc", "Size")
// @route   POST /api/v1/attributes
// @access  Private/Admin
const createAttribute = asyncHandler(async (req, res) => {
  const { name, label } = req.body;
  const attribute = await Attribute.create({ name, label, values: [] });
  res.status(201).json(attribute);
});

// @desc    Lấy tất cả thuộc tính và các giá trị của chúng
// @route   GET /api/v1/attributes
// @access  Private/Admin
const getAttributes = asyncHandler(async (req, res) => {
  const attributes = await Attribute.find({}).sort({ name: 1 });
  res.status(200).json(attributes);
});

// @desc    Thêm một giá trị mới vào một thuộc tính đã có
// @route   POST /api/v1/attributes/:id/values
// @access  Private/Admin
const addAttributeValue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value, meta } = req.body;

  const attribute = await Attribute.findById(id);
  if (!attribute) {
    res.status(404);
    throw new Error("Không tìm thấy thuộc tính.");
  }

  // Kiểm tra xem giá trị đã tồn tại chưa
  const valueExists = attribute.values.some((v) => v.value === value);
  if (valueExists) {
    res.status(400);
    throw new Error(`Giá trị "${value}" đã tồn tại trong thuộc tính này.`);
  }

  // Thêm giá trị mới vào mảng
  attribute.values.push({ value, meta });
  await attribute.save();

  // Trả về giá trị vừa được thêm (có _id)
  const newValue = attribute.values[attribute.values.length - 1];
  res.status(201).json(newValue);
});

// @desc    Cập nhật một giá trị trong một thuộc tính
// @route   PUT /api/v1/attributes/:attributeId/values/:valueId
// @access  Private/Admin
const updateAttributeValue = asyncHandler(async (req, res) => {
  const { attributeId, valueId } = req.params;
  const { value, meta } = req.body;

  const attribute = await Attribute.findById(attributeId);
  if (!attribute) {
    res.status(404);
    throw new Error("Không tìm thấy thuộc tính.");
  }

  const valueToUpdate = attribute.values.id(valueId);
  if (!valueToUpdate) {
    res.status(404);
    throw new Error("Không tìm thấy giá trị thuộc tính.");
  }

  valueToUpdate.value = value || valueToUpdate.value;
  valueToUpdate.meta = meta || valueToUpdate.meta;

  await attribute.save();
  res.status(200).json(valueToUpdate);
});

// @desc    Xóa một giá trị khỏi một thuộc tính
// @route   DELETE /api/v1/attributes/:attributeId/values/:valueId
// @access  Private/Admin
const deleteAttributeValue = asyncHandler(async (req, res) => {
  const { attributeId, valueId } = req.params;

  // Sử dụng $pull để xóa subdocument khỏi mảng một cách hiệu quả
  const result = await Attribute.updateOne(
    { _id: attributeId },
    { $pull: { values: { _id: valueId } } }
  );

  if (result.modifiedCount === 0) {
    res.status(404);
    throw new Error("Không tìm thấy giá trị thuộc tính để xóa.");
  }

  res.status(200).json({ message: "Đã xóa giá trị thuộc tính." });
});

module.exports = {
  getAttributes,
  createAttribute,
  addAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
};
