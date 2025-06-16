// src/components/admin/layout/AdminFooter.tsx
"use client";
import { CFooter } from "@coreui/react";
import React from "react";

const AdminFooter: React.FC = () => {
  return (
    <CFooter className="border-top px-4">
      <div>
        <a
          href="https://serein.io.vn"
          target="_blank"
          rel="noopener noreferrer"
        >
          Serein Shop
        </a>
        <span className="ms-1">
          © {new Date().getFullYear()} creativeLabs.
        </span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Powered by</span>
        <a
          href="https://coreui.io/react"
          target="_blank"
          rel="noopener noreferrer"
        >
          CoreUI for React
        </a>
      </div>
    </CFooter>
  );
};

export default AdminFooter;
