import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Matcher để áp dụng middleware cho tất cả các route ngoại trừ các file tĩnh và API
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico).*)"],
};
