"use client";

import FooterClient from "@/components/client/FooterClient";
import NavbarClient from "@/components/client/NavbarClient";
import { useAuthAutoRefresh } from "@/hooks/useAuth";
import React from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthAutoRefresh();
  return (
    <>
      <NavbarClient />
      <main className="mx-auto bg-gray-100 flex-grow px-4 py-8">{children}</main>
      <FooterClient />
    </>
  );
}
