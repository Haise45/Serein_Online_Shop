const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestId: {
      type: String,
      default: null,
    },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

// Đảm bảo chỉ có user hoặc guestId tồn tại
wishlistSchema.index(
  { user: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { user: { $exists: true } },
  }
);
wishlistSchema.index(
  { guestId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { guestId: { $exists: true } },
  }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;
