import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

const locales = ["vi", "en"];

/**
 * Hàm này chỉ được gọi khi không có cookie ngôn ngữ,
 * để xác định ngôn ngữ mặc định cho người dùng mới dựa trên cài đặt của admin.
 */
async function getAdminDefaultLocale(): Promise<"vi" | "en"> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const response = await fetch(`${apiUrl}/settings`, {
      // Thêm option này để tránh caching quá mạnh ở Edge
      next: { revalidate: 60 }, // 60 giây
    });
    if (!response.ok) {
      console.error(
        'Middleware: Failed to fetch settings, using fallback "vi".',
      );
      return "vi";
    }
    const settings = await response.json();
    return settings.clientSettings?.defaultLanguage || "vi";
  } catch (error) {
    console.error(
      'Middleware: Error fetching settings, using fallback "vi".',
      error,
    );
    return "vi";
  }
}

export default async function middleware(request: NextRequest) {
  // 1. Kiểm tra cookie lựa chọn ngôn ngữ của người dùng trước
  const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;

  let defaultLocale: "vi" | "en";

  if (localeCookie && locales.includes(localeCookie)) {
    // 2. Nếu có cookie hợp lệ, ưu tiên lựa chọn của người dùng
    defaultLocale = localeCookie as "vi" | "en";
  } else {
    // 3. Nếu không có cookie (người dùng mới), LẤY CÀI ĐẶT TỪ ADMIN
    defaultLocale = await getAdminDefaultLocale();
  }

  const handle = createMiddleware({
    locales,
    defaultLocale: defaultLocale,
    localePrefix: "always", // Luôn hiển thị locale trên URL để rõ ràng

    // Vẫn tắt phát hiện tự động để tránh xung đột
    localeDetection: false,
  });

  return handle(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
