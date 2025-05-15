import { ReduxProvider } from "@/store/Provider";
import { Inter } from "next/font/google";
import AuthInitializerWrapper from "./AuthInitializerWrapper";
import "./globals.css";
import QueryProvider from "./QueryProvider";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <ReduxProvider>
          <QueryProvider>
            <div><Toaster position="top-right" reverseOrder={false} /></div>
            <AuthInitializerWrapper>{children}</AuthInitializerWrapper>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
