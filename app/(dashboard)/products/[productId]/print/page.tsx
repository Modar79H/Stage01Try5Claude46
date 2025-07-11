
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

// Import your existing analysis components
import { ProductDescription } from "@/components/analysis/product-description";
import { SentimentAnalysis } from "@/components/analysis/sentiment-analysis";
import { VoiceOfCustomer } from "@/components/analysis/voice-of-customer";
import { FourWMatrix } from "@/components/analysis/four-w-matrix";
import { JTBDAnalysis } from "@/components/analysis/jtbd-analysis";
import { STPAnalysis } from "@/components/analysis/stp-analysis";
import { SWOTAnalysis } from "@/components/analysis/swot-analysis";
import { CustomerJourney } from "@/components/analysis/customer-journey";
import { CustomerPersonas } from "@/components/analysis/customer-personas";
import { CompetitionAnalysis } from "@/components/analysis/competition-analysis";
import { StrategicRecommendations } from "@/components/analysis/strategic-recommendations";

interface Product {
  id: string;
  name: string;
  brand: { name: string };
  reviewsCount: number;
  analyses: Array<{
    id: string;
    type: string;
    data: any;
    status: string;
  }>;
}

export default function PrintPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analysis data...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Product not found</div>
      </div>
    );
  }

  const completedAnalyses = product.analyses.filter(a => a.status === "completed");

  const getAnalysisComponent = (analysis: any) => {
    const props = {
      data: analysis.data,
      productId: product.id,
      productName: product.name,
    };

    switch (analysis.type) {
      case "product_description":
        return <ProductDescription key={analysis.id} {...props} />;
      case "sentiment":
        return <SentimentAnalysis key={analysis.id} {...props} />;
      case "voice_of_customer":
        return <VoiceOfCustomer key={analysis.id} {...props} />;
      case "four_w_matrix":
        return <FourWMatrix key={analysis.id} {...props} />;
      case "jtbd":
        return <JTBDAnalysis key={analysis.id} {...props} />;
      case "stp":
        return <STPAnalysis key={analysis.id} {...props} />;
      case "swot":
        return <SWOTAnalysis key={analysis.id} {...props} />;
      case "customer_journey":
        return <CustomerJourney key={analysis.id} {...props} />;
      case "personas":
        return <CustomerPersonas key={analysis.id} {...props} />;
      case "competition":
        return <CompetitionAnalysis key={analysis.id} {...props} />;
      case "strategic_recommendations":
        return <StrategicRecommendations key={analysis.id} {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="print-container" data-analysis-loaded="true">
      <style jsx global>{`
        @media print {
          .print-container {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
        }
        
        body {
          background: white;
          margin: 0;
          padding: 0;
        }
        
        .print-container {
          background: white;
          padding: 20px;
          max-width: none;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #5546e1 0%, #6b59e6 100%);
          color: white;
          border-radius: 12px;
        }
        
        .print-title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .print-subtitle {
          font-size: 18px;
          opacity: 0.9;
        }
        
        .print-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #5546e1;
        }
        
        .print-section {
          margin-bottom: 40px;
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .print-section h2 {
          color: #5546e1;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        /* Ensure charts render properly */
        canvas, svg {
          max-width: 100% !important;
          height: auto !important;
        }
        
        /* Hide interactive elements */
        button, .cursor-pointer {
          display: none !important;
        }
        
        /* Ensure good contrast for printing */
        .text-gray-600 {
          color: #4b5563 !important;
        }
        
        .text-gray-500 {
          color: #6b7280 !important;
        }
      `}</style>

      {/* Header */}
      <div className="print-header avoid-break">
        <div className="print-title">Product Analysis Report</div>
        <div className="print-subtitle">{product.name}</div>
      </div>

      {/* Product Information */}
      <div className="print-info avoid-break">
        <h3 className="text-lg font-semibold mb-3">Product Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Product:</strong> {product.name}
          </div>
          <div>
            <strong>Brand:</strong> {product.brand.name}
          </div>
          <div>
            <strong>Reviews Analyzed:</strong> {product.reviewsCount.toLocaleString()}
          </div>
          <div>
            <strong>Generated:</strong> {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="print-section avoid-break">
        <h2>Table of Contents</h2>
        <div className="space-y-2">
          {completedAnalyses.map((analysis, index) => {
            const titles: Record<string, string> = {
              product_description: "Product Description",
              sentiment: "Sentiment Analysis",
              voice_of_customer: "Voice of Customer",
              four_w_matrix: "4W Matrix",
              jtbd: "Jobs to be Done",
              stp: "STP Analysis",
              swot: "SWOT Analysis",
              customer_journey: "Customer Journey",
              personas: "Customer Personas",
              competition: "Competition Analysis",
              strategic_recommendations: "Strategic Recommendations",
            };
            
            return (
              <div key={analysis.id} className="flex justify-between">
                <span>{index + 1}. {titles[analysis.type] || analysis.type}</span>
                <span>Page {index + 2}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Sections */}
      {completedAnalyses.map((analysis, index) => (
        <div key={analysis.id} className={`print-section ${index > 0 ? 'page-break' : ''}`}>
          {getAnalysisComponent(analysis)}
        </div>
      ))}

      {/* Mark as loaded for Puppeteer */}
      <div style={{ display: 'none' }} data-analysis-loaded="true"></div>
    </div>
  );
}
