// app/api/products/[productId]/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;

    // Get product with analyses
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        analyses: {
          where: { status: "completed" },
        },
      },
    });

    if (!product || product.brand.userId !== session.user.id) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.analyses.length === 0) {
      return NextResponse.json(
        { error: "No completed analyses to export" },
        { status: 400 },
      );
    }

    // Generate PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize = 12, isBold = false) => {
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont(undefined, "bold");
      } else {
        pdf.setFont(undefined, "normal");
      }

      const textLines = pdf.splitTextToSize(text, pageWidth - margin * 2);

      // Check if we need a new page
      if (yPosition + textLines.length * lineHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.text(textLines, margin, yPosition);
      yPosition += textLines.length * lineHeight + 3;
    };

    const addSection = (title: string, content: any) => {
      // Add some space before sections
      yPosition += 5;

      addText(title, 16, true);
      yPosition += 3;

      if (typeof content === "string") {
        addText(content);
      } else if (typeof content === "object") {
        addText(JSON.stringify(content, null, 2));
      }

      yPosition += 10;
    };

    // Title Page
    pdf.setFontSize(24);
    pdf.setFont(undefined, "bold");
    pdf.text("Product Analysis Report", margin, yPosition);
    yPosition += 20;

    pdf.setFontSize(16);
    pdf.setFont(undefined, "normal");
    pdf.text(`Product: ${product.name}`, margin, yPosition);
    yPosition += 10;
    pdf.text(`Brand: ${product.brand.name}`, margin, yPosition);
    yPosition += 10;
    pdf.text(
      `Reviews Analyzed: ${product.reviewsCount.toLocaleString()}`,
      margin,
      yPosition,
    );
    yPosition += 10;
    pdf.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      margin,
      yPosition,
    );
    yPosition += 20;

    // Table of Contents
    addText("Table of Contents", 18, true);
    const analysisTypes = [
      "Product Description",
      "Sentiment Analysis",
      "Voice of Customer",
      "4W Matrix",
      "Jobs to be Done",
      "STP Analysis",
      "SWOT Analysis",
      "Customer Journey",
      "Customer Personas",
      "Competition Analysis",
      "Strategic Recommendations",
    ];

    analysisTypes.forEach((type, index) => {
      const hasAnalysis = product.analyses.some((a) =>
        a.type
          .replace("_", " ")
          .toLowerCase()
          .includes(type.toLowerCase().split(" ")[0]),
      );
      addText(`${index + 1}. ${type} ${hasAnalysis ? "✓" : "(Not Available)"}`);
    });

    // Add analyses
    product.analyses.forEach((analysis) => {
      pdf.addPage();
      yPosition = margin;

      const analysisTitle = analysis.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      addText(analysisTitle, 20, true);

      // Add analysis content based on type
      try {
        const data = analysis.data;

        switch (analysis.type) {
          case "product_description":
            if (data.product_description) {
              addSection(
                "Product Summary",
                data.product_description.summary || "No summary available",
              );
              if (data.product_description.attributes) {
                addSection(
                  "Key Attributes",
                  data.product_description.attributes.join(", "),
                );
              }
              if (data.product_description.variations) {
                addSection(
                  "Product Variations",
                  data.product_description.variations.join(", "),
                );
              }
            }
            break;

          case "sentiment":
            if (data.sentiment_analysis) {
              addSection(
                "Customer Likes",
                data.sentiment_analysis.customer_likes
                  ?.map(
                    (item: any) =>
                      `${item.theme} (${item.percentage}): ${item.summary}`,
                  )
                  .join("\n\n") || "No data available",
              );
              addSection(
                "Customer Dislikes",
                data.sentiment_analysis.customer_dislikes
                  ?.map(
                    (item: any) =>
                      `${item.theme} (${item.percentage}): ${item.summary}`,
                  )
                  .join("\n\n") || "No data available",
              );
            }
            break;

          case "strategic_recommendations":
            if (data.strategic_recommendations) {
              addSection(
                "Executive Summary",
                data.strategic_recommendations.executive_summary ||
                  "No summary available",
              )[
                ("product_strategy",
                "marketing_strategy",
                "customer_experience",
                "competitive_strategy")
              ].forEach((strategy) => {
                if (data.strategic_recommendations[strategy]) {
                  const strategyTitle = strategy
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());
                  const recommendations = data.strategic_recommendations[
                    strategy
                  ]
                    .map(
                      (rec: any) =>
                        `• ${rec.recommendation} (${rec.priority_level} Priority, ${rec.timeframe})\n  ${rec.introduction}`,
                    )
                    .join("\n\n");
                  addSection(strategyTitle, recommendations);
                }
              });
            }
            break;

          default:
            // Generic handling for other analysis types
            addSection("Analysis Results", JSON.stringify(data, null, 2));
            break;
        }
      } catch (error) {
        addSection("Error", "Unable to process this analysis data");
      }
    });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${product.name}-analysis-report.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
