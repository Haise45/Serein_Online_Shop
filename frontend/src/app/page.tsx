import FeatureBar from "@/components/client/FeatureBar";
import FooterClient from "@/components/client/FooterClient";
import HeroBanner from "@/components/client/HeroBanner";
import NavbarClient from "@/components/client/NavbarClient";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <NavbarClient />
      <HeroBanner />
      <FeatureBar />
      <main className="mx-auto min-h-screen flex-grow bg-gray-100 px-4 py-8">
        <div className="text-center">
          <h1 className="mb-6 text-4xl font-bold text-blue-600">
            Chào mừng đến với Serein Shop!
          </h1>
          <p className="mb-8 text-lg text-gray-700">
            Khám phá các sản phẩm tuyệt vời của chúng tôi.
          </p>
          <Link
            href="/products"
            className="rounded-lg bg-green-500 px-6 py-3 text-lg font-bold text-white transition duration-300 hover:bg-green-600"
          >
            Xem Sản Phẩm
          </Link>
        </div>
      </main>
      <FooterClient />
    </>
  );
}
