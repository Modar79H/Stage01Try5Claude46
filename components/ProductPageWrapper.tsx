"use client";

import dynamic from "next/dynamic";
import { AnalysisStatusPoller } from "@/components/analysis-status-poller";

// Dynamically import ChatWidget to avoid SSR issues
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});

interface ProductPageWrapperProps {
  children: React.ReactNode;
  brandId: string;
  productId: string;
  brandName: string;
  productName: string;
  isProcessing?: boolean;
}

export default function ProductPageWrapper({
  children,
  brandId,
  productId,
  brandName,
  productName,
  isProcessing = false,
}: ProductPageWrapperProps) {
  return (
    <>
      {children}
      <AnalysisStatusPoller productId={productId} isProcessing={isProcessing} />
      <ChatWidget
        brandId={brandId}
        productId={productId}
        brandName={brandName}
        productName={productName}
      />
    </>
  );
}
