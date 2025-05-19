"use client";
import classNames from "classnames";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

interface StarRatingProps {
  rating: number; // Số điểm từ 0 đến 5
  size?: number; // Kích thước của sao, ví dụ 16, 20, 24
  className?: string; // Class Tailwind tùy chỉnh
  starColor?: string; // Màu của sao đầy và nửa sao
}

export default function StarRating({
  rating,
  size = 16,
  className = "",
  starColor = "text-yellow-400", // Mặc định màu vàng
}: StarRatingProps) {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.25 && rating % 1 <= 0.75; // Ngưỡng cho nửa sao
  const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);

  const stars = [];

  // Sao đầy
  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} size={size} className={starColor} />);
  }

  // Nửa sao
  if (hasHalfStar) {
    stars.push(<FaStarHalfAlt key="half" size={size} className={starColor} />);
  }

  // Sao rỗng
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <FaRegStar key={`empty-${i}`} size={size} className="text-gray-300" />,
    ); // Sao rỗng màu xám
  }

  return (
    <div className={classNames("flex items-center space-x-0.5", className)}>
      {stars}
    </div>
  );
}
