"use client";

import FooterClient from "@/components/client/layout/FooterClient";
import NavbarClient from "@/components/client/layout/NavbarClient";
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
      <main className="mx-auto flex-grow bg-gray-100 px-4 py-8">
        {children}
      </main>
      <FooterClient />
    </>
  );
}
