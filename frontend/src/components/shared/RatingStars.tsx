"use client";
import { FiStar } from "react-icons/fi";
import classNames from "classnames";

interface RatingStarsProps {
  rating: number;
  totalStars?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}
export default function RatingStars({
  rating,
  totalStars = 5,
  size = "md",
  className,
}: RatingStarsProps) {
  const starSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5; // Hoặc logic làm tròn khác

  return (
    <div className={classNames("flex items-center", className)}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <FiStar
            key={index}
            className={classNames(
              starSize,
              starValue <= fullStars ||
                (starValue === fullStars + 1 && hasHalfStar)
                ? "fill-current text-yellow-400"
                : "text-gray-300",
            )}
          />
        );
      })}
    </div>
  );
}
