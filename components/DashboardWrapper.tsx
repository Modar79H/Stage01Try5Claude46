"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Dynamically import ChatWidget to avoid SSR issues
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const pathname = usePathname();

  // Don't render ChatWidget on product pages as they have their own contextual widget
  const isProductPage =
    pathname?.includes("/products/") && pathname.split("/").length === 3;

  return (
    <>
      {children}
      {!isProductPage && <ChatWidget />}
    </>
  );
}
