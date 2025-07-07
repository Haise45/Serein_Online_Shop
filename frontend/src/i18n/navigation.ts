import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Các hook `usePathname`, `useRouter` đã được bản địa hóa
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
