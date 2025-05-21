import AddedToCartPopupManager from "@/components/client/cart/AddedToCartPopupManager";
import { ReduxProvider } from "@/store/Provider";
import { Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";
import AuthInitializerWrapper from "./AuthInitializerWrapper";
import "./globals.css";
import QueryProvider from "./QueryProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata = {
  title: "Trang chủ chính thức | Serein Shop",
  description: "Mua sắm quần áo thời trang nam nữ chất lượng.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={montserrat.className}>
        <ReduxProvider>
          <QueryProvider>
            <div>
              <Toaster position="top-right" reverseOrder={false} />
            </div>
            <AuthInitializerWrapper>
              {children}
              <AddedToCartPopupManager />
            </AuthInitializerWrapper>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
