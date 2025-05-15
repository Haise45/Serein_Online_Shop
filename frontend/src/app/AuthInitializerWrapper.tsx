"use client";

import { useAuthInitializer } from "@/hooks/useAuthInitializer";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-100 to-white text-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-700 border-t-transparent" />
      <p className="mt-4 animate-pulse text-xl font-medium text-gray-800">
        Xin đợi một chút...
      </p>
    </div>
  );
}

export default function AuthInitializerWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthInitializing } = useAuthInitializer();

  if (isAuthInitializing) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
