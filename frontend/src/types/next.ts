export interface PageSearchParams {
  [key: string]: string | string[] | undefined;
}

export interface PageProps {
  params: { [key: string]: string | string[] | undefined }; // For dynamic routes like /products/[slug]
  searchParams: PageSearchParams; // For query parameters like /products?category=abc
}
