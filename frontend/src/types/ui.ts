export interface BreadcrumbItem {
  label: string;
  href?: string; // Optional, item cuối cùng có thể không có href
  isCurrent?: boolean; // Đánh dấu item hiện tại
}