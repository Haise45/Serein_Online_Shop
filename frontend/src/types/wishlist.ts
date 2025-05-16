import { Product } from './product';

// WishlistItem có thể chỉ là Product nếu API trả về Product đã populate
// Hoặc nếu API chỉ trả về mảng ID, thì bạn cần populate ở client hoặc dùng ID
export type WishlistItem = Product; // Giả sử API /wishlist trả về mảng Product đã populate