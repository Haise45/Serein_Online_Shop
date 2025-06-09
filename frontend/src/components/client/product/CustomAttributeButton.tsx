"use client";

import classNames from "classnames";
import { FiCheck, FiSlash } from "react-icons/fi";

// Map tên màu sang mã hex
const colorMappings: { [key: string]: string } = {
  // Đen & Xám
  đen: "#000000",
  "đen xám": "#2D3748",
  "xám đậm": "#4A5568",
  xám: "#A0AEC0",
  "xám nhạt": "#CBD5E0",
  ghi: "#A0AEC0",
  than: "#36454F",
  // Trắng & Be
  trắng: "#FFFFFF",
  kem: "#FFFDD0",
  be: "#F5F5DC",
  ngà: "#FFFFF0",
  "vàng kem": "#F0E68C",
  // Xanh dương
  "xanh navy": "#2C5282",
  "xanh dương đậm": "#2B6CB0",
  "xanh dương": "#4299E1",
  "xanh da trời": "#63B3ED",
  "xanh dương nhạt": "#BEE3F8",
  "xanh coban": "#0047AB",
  "xanh lam": "#4299E1",
  "xanh biển": "#0077BE",
  // Xanh lá
  "xanh lá đậm": "#2F855A",
  "xanh lá cây": "#48BB78",
  "xanh lá": "#48BB78",
  "xanh rêu": "#556B2F",
  "xanh bạc hà": "#98FF98",
  "xanh olive": "#808000",
  "xanh lá mạ": "#C1FFC1",
  "xanh ngọc": "#AFEEEE",
  "xanh cổ vịt": "#008080",
  // Đỏ
  "đỏ tươi": "#FF0000",
  đỏ: "#E53E3E",
  "đỏ đô": "#8B0000",
  "đỏ cam": "#FF4500",
  "đỏ gạch": "#B22222",
  "đỏ rượu": "#722F37",
  // Hồng
  "hồng đậm": "#DB2777",
  "hồng cánh sen": "#FF69B4",
  "hồng phấn": "#FFD1DC",
  hồng: "#FBB6CE",
  "hồng đất": "#E75480",
  "hồng cam": "#FFB3A7",
  // Vàng
  "vàng tươi": "#FFFF00",
  vàng: "#ECC94B",
  "vàng đậm": "#D69E2E",
  "vàng nghệ": "#FFBF00",
  "vàng chanh": "#FFFACD",
  "vàng đồng": "#B87333",
  "vàng bò": "#DAA520",
  // Cam
  "cam đậm": "#DD6B20",
  cam: "#F59E0B",
  "cam đất": "#CC5500",
  "cam nhạt": "#FED7AA",
  // Tím
  tím: "#805AD5",
  "tím đậm": "#6B46C1",
  "tím than": "#581C87",
  "tím nhạt": "#D6BCFA",
  "tím lavender": "#E6E6FA",
  "tím cà": "#6A0DAD",
  // Kim loại & đặc biệt
  bạc: "#C0C0C0",
  "vàng gold": "#FFD700",
  đồng: "#B87333",
  "đa sắc":
    "linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)",
  "họa tiết": "#E5E7EB", // Màu xám nhẹ cho họa tiết
};

const getColorStyle = (colorName: string): React.CSSProperties => {
  const lowerColorName = colorName.toLowerCase().trim();
  const mappedColor = colorMappings[lowerColorName];
  if (mappedColor) {
    if (mappedColor.startsWith("linear-gradient")) {
      return { background: mappedColor };
    }
    return { backgroundColor: mappedColor };
  }
  // Fallback nếu không tìm thấy màu chính xác
  for (const key in colorMappings) {
    if (lowerColorName.includes(key)) {
      if (colorMappings[key].startsWith("linear-gradient")) {
        return { background: colorMappings[key] };
      }
      return { backgroundColor: colorMappings[key] };
    }
  }
  return { backgroundColor: "#E5E7EB" }; // Màu xám mặc định nếu không khớp
};

interface CustomAttributeButtonProps {
  value: string;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  type?: "color" | "text";
}

const CustomAttributeButton: React.FC<CustomAttributeButtonProps> = ({
  value,
  isSelected,
  isDisabled,
  onClick,
  type = "text",
}) => {
  const isColorType = type === "color";

  const buttonBaseClasses =
    "flex items-center justify-center border text-xs font-medium uppercase transition-all duration-150 sm:flex-1 relative focus:outline-none";

  const colorSpecificClasses =
    "aspect-square h-8 w-8 p-0 sm:h-9 sm:w-9 rounded-full";
  const textSpecificClasses = "min-w-[4rem] px-3 py-2 sm:py-2.5 rounded-md";

  const disabledClasses =
    "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400";
  const enabledClasses = "cursor-pointer";

  // Style cho trạng thái được chọn
  const selectedColorClasses =
    "border-indigo-600 ring-2 ring-indigo-600 ring-offset-1";
  const selectedTextClasses =
    "border-transparent bg-indigo-600 text-white shadow-md hover:bg-indigo-700";

  // Style mặc định
  const defaultColorClasses = "border-gray-300 bg-white";
  const defaultTextClasses =
    "border-gray-300 bg-white text-gray-700 hover:bg-gray-50";
  const activeRingClasses =
    "focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={classNames(
        buttonBaseClasses,
        isColorType ? colorSpecificClasses : textSpecificClasses, // Áp dụng class kích thước và bo góc theo type
        isDisabled ? disabledClasses : enabledClasses,
        isSelected && !isDisabled
          ? isColorType
            ? selectedColorClasses
            : selectedTextClasses
          : isColorType
            ? defaultColorClasses
            : defaultTextClasses,
        !isDisabled ? activeRingClasses : "",
      )}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      // Thêm title cho nút màu để hiển thị tên màu khi hover
      title={isColorType ? value : undefined}
    >
      <span className="sr-only">{value}</span>

      {isColorType ? (
        <span
          aria-hidden="true"
          className={classNames(
            "h-full w-full rounded-full border border-black/10",
            (getColorStyle(value).backgroundColor === "#FFFFFF" ||
              getColorStyle(value).backgroundColor === "#FFFFF0" || // Ivory
              getColorStyle(value).backgroundColor === "#FFFDD0") &&
              !isSelected &&
              !isDisabled // Cream
              ? "border-gray-400" // Viền rõ hơn cho màu trắng/sáng khi không được chọn
              : "border-transparent", // Mặc định không có viền cho span màu nếu button đã có viền
          )}
          style={getColorStyle(value)}
        />
      ) : (
        value // Hiển thị text cho nút không phải màu
      )}

      {/* Icon Check cho màu được chọn */}
      {isColorType && isSelected && !isDisabled && (
        <span className="absolute inset-0 flex items-center justify-center">
          <FiCheck
            className="h-4 w-4 text-white mix-blend-difference"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.6))" }} // Tăng độ đậm của shadow
          />
        </span>
      )}

      {/* Icon gạch chéo nếu option bị disable */}
      {isDisabled && type !== "color" && (
        <span className="absolute inset-0 flex items-center justify-center opacity-50">
          <FiSlash className="h-3/4 w-3/4 rotate-[20deg] transform text-gray-400 mix-blend-difference" />
        </span>
      )}
      {isDisabled && type === "color" && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-500/30">
          <FiSlash className="h-1/2 w-1/2 text-white/70 mix-blend-difference" />
        </span>
      )}
    </button>
  );
};

export default CustomAttributeButton;
