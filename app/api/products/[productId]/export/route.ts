// app/api/products/[productId]/export/route.ts - FIXED VERSION
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
        competitors: true,
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

    // Generate Enhanced PDF with brand colors
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Brand colors matching platform theme
    const colors = {
      primary: [85, 70, 225], // #5546e1
      secondary: [31, 41, 55], // #1f2937
      background: [249, 249, 249], // #f9f9f9
      white: [255, 255, 255],
      black: [0, 0, 0],
      // Chart color variations
      chart1: [85, 70, 225], // #5546e1
      chart2: [107, 89, 230], // #6b59e6
      chart3: [74, 61, 219], // #4a3ddb
      chart4: [124, 111, 234], // #7c6fea
      chart5: [61, 47, 213], // #3d2fd5
      chart6: [143, 132, 237], // #8f84ed
      chart7: [46, 30, 207], // #2e1ecf
      chart8: [161, 153, 240], // #a199f0
      chart9: [30, 12, 201], // #1e0cc9
      chart10: [179, 174, 243], // #b3aef3
    };

    const chartColors = [
      colors.chart1,
      colors.chart2,
      colors.chart3,
      colors.chart4,
      colors.chart5,
      colors.chart6,
      colors.chart7,
      colors.chart8,
      colors.chart9,
      colors.chart10,
    ];

    // Helper function for better page break handling
    const checkPageBreak = (
      requiredSpace: number = 30,
      forceNewPage: boolean = false,
    ) => {
      if (forceNewPage || yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add styled headers with proper spacing
    const addStyledHeader = (
      text: string,
      level: number = 1,
      ensureSpace: number = 40,
    ) => {
      const fontSize =
        level === 1 ? 24 : level === 2 ? 18 : level === 3 ? 14 : 12;
      const color =
        level === 1
          ? colors.primary
          : level === 2
            ? colors.primary
            : colors.secondary;

      // Ensure header and some content fit on same page
      checkPageBreak(ensureSpace);

      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...color);

      pdf.text(text, margin, yPosition);
      yPosition += fontSize * 0.5 + 5;
    };

    // Helper function to add regular text with word wrapping
    const addText = (text: string, fontSize = 11, color = colors.black) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...color);

      const textLines = pdf.splitTextToSize(text, pageWidth - margin * 2);
      const requiredSpace = textLines.length * fontSize * 0.4;

      checkPageBreak(requiredSpace + 10);

      pdf.text(textLines, margin, yPosition);
      yPosition += requiredSpace + 3;
    };

    // Helper function to add colored sections
    const addSection = (
      title: string,
      content: string,
      backgroundColor?: number[],
    ) => {
      if (!content || content.trim() === "") {
        content = "No data available";
      }

      const contentLines = pdf.splitTextToSize(
        content,
        pageWidth - margin * 2 - 10,
      );
      const boxHeight = 15 + contentLines.length * 4.5;

      // Ensure entire section stays together
      checkPageBreak(boxHeight + 10);

      // Add background if specified
      if (backgroundColor) {
        pdf.setFillColor(...backgroundColor);
        pdf.rect(
          margin - 5,
          yPosition - 5,
          pageWidth - margin * 2 + 10,
          boxHeight,
          "F",
        );
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.black);
      pdf.text(title, margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(contentLines, margin, yPosition);
      yPosition += contentLines.length * 4.5 + 8;
    };

    // Enhanced bar chart function matching platform style
    const createHorizontalBarChart = (
      data: Array<{ label: string; value: number }>,
      title: string,
      useNegativeValues: boolean = false,
    ) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        addStyledHeader(title, 3);
        addText("No chart data available");
        return;
      }

      addStyledHeader(title, 3);

      const barHeight = 12;
      const barSpacing = 8;
      const maxBarWidth = pageWidth - margin * 2 - 100;
      const maxValue = Math.max(...data.map((d) => Math.abs(d.value || 0)));

      if (maxValue === 0) {
        addText("No data to display in chart");
        return;
      }

      data.forEach((item, index) => {
        if (!item || typeof item.value !== "number") return;

        checkPageBreak(barHeight + barSpacing + 10);

        // Label
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...colors.secondary);

        const labelText =
          item.label && item.label.length > 25
            ? item.label.substring(0, 25) + "..."
            : item.label || "Unknown";
        pdf.text(labelText, margin, yPosition + barHeight / 2);

        // Bar
        const barLength = (Math.abs(item.value) / maxValue) * maxBarWidth;
        const barX = margin + 100;

        // Use gradient of brand colors
        const colorIndex = index % chartColors.length;
        pdf.setFillColor(...chartColors[colorIndex]);
        pdf.rect(barX, yPosition, barLength, barHeight, "F");

        // Value text
        pdf.setFontSize(9);
        pdf.setTextColor(...colors.secondary);
        pdf.text(
          `${Math.abs(item.value)}%`,
          barX + barLength + 5,
          yPosition + barHeight / 2,
        );

        yPosition += barHeight + barSpacing;
      });

      yPosition += 10;
    };

    // Function to create pie/donut chart representations
    const createPieChartTable = (
      data: Array<{ label: string; value: number }>,
      title: string,
    ) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        addStyledHeader(title, 3);
        addText("No chart data available");
        return;
      }

      addStyledHeader(title, 3);

      const total = data.reduce((sum, item) => sum + (item?.value || 0), 0);

      if (total === 0) {
        addText("No data to display in chart");
        return;
      }

      data.forEach((item, index) => {
        if (!item || typeof item.value !== "number") return;

        checkPageBreak(20);

        const percentage = ((item.value / total) * 100).toFixed(1);
        const colorIndex = index % chartColors.length;

        // Color box
        pdf.setFillColor(...chartColors[colorIndex]);
        pdf.rect(margin, yPosition - 3, 8, 8, "F");

        // Label and percentage
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.secondary);
        pdf.text(
          `${item.label || "Unknown"}: ${percentage}%`,
          margin + 12,
          yPosition,
        );

        yPosition += 12;
      });

      yPosition += 5;
    };

    // Function to simulate word cloud
    const createWordCloud = (
      keywords: Array<{ word: string; frequency: number }>,
      title: string,
    ) => {
      addStyledHeader(title, 2);

      if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        addText("No keyword data available");
        return;
      }

      const cloudHeight = 100;
      checkPageBreak(cloudHeight + 20);

      // Background
      pdf.setFillColor(...colors.background);
      pdf.rect(margin, yPosition, pageWidth - margin * 2, cloudHeight, "F");

      // Sort and limit keywords
      const sortedKeywords = keywords
        .filter((k) => k && k.word && typeof k.frequency === "number")
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 30);

      if (sortedKeywords.length === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(...colors.secondary);
        pdf.text("No keyword data available", margin + 10, yPosition + 30);
        yPosition += cloudHeight + 15;
        return;
      }

      const maxFreq = sortedKeywords[0]?.frequency || 1;

      // Place words in a grid-like pattern
      let currentX = margin + 10;
      let currentY = yPosition + 20;
      let rowHeight = 0;

      sortedKeywords.forEach((keyword, index) => {
        const fontSize = Math.max(
          8,
          Math.min(24, (keyword.frequency / maxFreq) * 24),
        );
        const colorIndex = index % chartColors.length;

        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...chartColors[colorIndex]);

        const textWidth = pdf.getTextWidth(keyword.word);

        // Check if word fits in current row
        if (currentX + textWidth > pageWidth - margin - 10) {
          currentX = margin + 10;
          currentY += rowHeight + 5;
          rowHeight = 0;
        }

        // Don't exceed cloud height
        if (currentY + fontSize <= yPosition + cloudHeight - 10) {
          pdf.text(keyword.word, currentX, currentY);
          currentX += textWidth + 10;
          rowHeight = Math.max(rowHeight, fontSize);
        }
      });

      yPosition += cloudHeight + 15;
    };

    // Safe data access helper
    const safeGet = (obj: any, path: string, defaultValue: any = null) => {
      try {
        return (
          path.split(".").reduce((current, key) => current?.[key], obj) ??
          defaultValue
        );
      } catch {
        return defaultValue;
      }
    };

    // Title Page with brand styling
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 60, "F");

    pdf.setTextColor(...colors.white);
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.text("Product Analysis Report", pageWidth / 2, 30, { align: "center" });

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "normal");
    pdf.text(product.name, pageWidth / 2, 45, { align: "center" });

    yPosition = 80;

    // Product Information Box
    pdf.setFillColor(...colors.background);
    pdf.rect(margin - 5, yPosition - 5, pageWidth - margin * 2 + 10, 60, "F");

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...colors.primary);
    pdf.text("Product Information", margin, yPosition + 10);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...colors.secondary);
    pdf.text(`Product: ${product.name}`, margin, yPosition + 25);
    pdf.text(`Brand: ${product.brand.name}`, margin, yPosition + 35);
    pdf.text(
      `Reviews Analyzed: ${product.reviewsCount.toLocaleString()}`,
      margin,
      yPosition + 45,
    );
    pdf.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      margin,
      yPosition + 55,
    );

    yPosition += 75;

    // Table of Contents
    addStyledHeader("Table of Contents", 2);

    const analysisTypes = [
      { key: "product_description", name: "Product Description" },
      { key: "sentiment", name: "Sentiment Analysis" },
      { key: "voice_of_customer", name: "Voice of Customer" },
      { key: "four_w_matrix", name: "4W Matrix" },
      { key: "jtbd", name: "Jobs to be Done" },
      { key: "stp", name: "STP Analysis" },
      { key: "swot", name: "SWOT Analysis" },
      { key: "customer_journey", name: "Customer Journey" },
      { key: "personas", name: "Customer Personas" },
      { key: "competition", name: "Competition Analysis" },
      { key: "strategic_recommendations", name: "Strategic Recommendations" },
    ];

    let tocIndex = 1;
    pdf.setTextColor(...colors.secondary);
    analysisTypes.forEach((type) => {
      const hasAnalysis = product.analyses.some((a) => a.type === type.key);
      if (hasAnalysis) {
        pdf.setFontSize(11);
        pdf.text(`${tocIndex}. ${type.name}`, margin + 10, yPosition);
        yPosition += 8;
        tocIndex++;
      }
    });

    // Debug: Log all available analyses
    console.log(
      "🔍 Available analyses in product:",
      product.analyses.map((a) => ({ type: a.type, status: a.status })),
    );

    // Process each analysis with better error handling
    product.analyses.forEach((analysis, analysisIndex) => {
      // Always start new analysis on new page
      pdf.addPage();
      yPosition = margin;

      const analysisTitle =
        analysisTypes.find((t) => t.key === analysis.type)?.name ||
        analysis.type
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

      console.log(
        `📊 Processing analysis ${analysisIndex + 1}/${product.analyses.length}: ${analysis.type}`,
      );

      try {
        const data = analysis.data as any;

        if (!data) {
          console.log(`⚠️ No data found for ${analysis.type}`);
          addStyledHeader(analysisTitle, 1);
          addText("No analysis data available");
          return;
        }

        switch (analysis.type) {
          case "product_description":
            console.log("Processing product_description...");
            addStyledHeader(analysisTitle, 1);

            const productDesc = safeGet(data, "product_description");
            if (productDesc) {
              const summary = safeGet(
                productDesc,
                "summary",
                "No summary available",
              );
              addSection("Product Summary", summary, colors.background);

              const attributes = safeGet(productDesc, "attributes", []);
              if (Array.isArray(attributes) && attributes.length > 0) {
                addStyledHeader("Key Attributes", 3);
                attributes.forEach((attr: string) => {
                  checkPageBreak(15);
                  pdf.setFontSize(11);
                  pdf.setTextColor(...colors.secondary);
                  pdf.text(
                    `• ${attr || "Unknown attribute"}`,
                    margin + 5,
                    yPosition,
                  );
                  yPosition += 8;
                });
              }

              const variations = safeGet(productDesc, "variations", []);
              if (Array.isArray(variations) && variations.length > 0) {
                addStyledHeader("Product Variations", 3);
                variations.forEach((variation: string) => {
                  checkPageBreak(15);
                  pdf.setFontSize(11);
                  pdf.setTextColor(...colors.secondary);
                  pdf.text(
                    `• ${variation || "Unknown variation"}`,
                    margin + 5,
                    yPosition,
                  );
                  yPosition += 8;
                });
              }
            } else {
              addText("No product description data available");
            }
            break;

          case "sentiment":
            console.log("Processing sentiment...");
            addStyledHeader(analysisTitle, 1);

            const sentimentAnalysis = safeGet(data, "sentiment_analysis");
            if (sentimentAnalysis) {
              // Customer Likes
              const customerLikes = safeGet(
                sentimentAnalysis,
                "customer_likes",
                [],
              );
              if (Array.isArray(customerLikes) && customerLikes.length > 0) {
                addStyledHeader("What Customers Love", 2, 100);

                const likesData = customerLikes
                  .slice(0, 10)
                  .filter((item) => item && item.theme && item.percentage)
                  .map((item: any) => ({
                    label: item.theme,
                    value: parseFloat(String(item.percentage).replace("%", "")),
                  }));

                createHorizontalBarChart(
                  likesData,
                  "Customer Satisfaction Levels",
                );

                // Add detailed summaries
                customerLikes.slice(0, 5).forEach((item: any) => {
                  if (item && item.theme && item.summary) {
                    addSection(
                      `${item.theme} (${item.percentage || "N/A"})`,
                      item.summary,
                      colors.background,
                    );
                  }
                });
              }

              // Customer Dislikes
              const customerDislikes = safeGet(
                sentimentAnalysis,
                "customer_dislikes",
                [],
              );
              if (
                Array.isArray(customerDislikes) &&
                customerDislikes.length > 0
              ) {
                checkPageBreak(80, true); // New page for dislikes
                addStyledHeader("Areas for Improvement", 2, 100);

                const dislikesData = customerDislikes
                  .slice(0, 10)
                  .filter((item) => item && item.theme && item.percentage)
                  .map((item: any) => ({
                    label: item.theme,
                    value: parseFloat(String(item.percentage).replace("%", "")),
                  }));

                createHorizontalBarChart(
                  dislikesData,
                  "Customer Concern Levels",
                );

                // Add detailed summaries
                customerDislikes.slice(0, 5).forEach((item: any) => {
                  if (item && item.theme && item.summary) {
                    addSection(
                      `${item.theme} (${item.percentage || "N/A"})`,
                      item.summary,
                      colors.background,
                    );
                  }
                });
              }
            } else {
              addText("No sentiment analysis data available");
            }
            break;

          case "voice_of_customer":
            console.log("Processing voice_of_customer...");
            addStyledHeader(analysisTitle, 1);

            const voiceOfCustomer = safeGet(data, "voice_of_customer");
            if (voiceOfCustomer) {
              const keywords = safeGet(voiceOfCustomer, "keywords", []);
              if (Array.isArray(keywords) && keywords.length > 0) {
                createWordCloud(
                  keywords,
                  "Word Cloud - Most Frequently Mentioned Terms",
                );

                // Top keywords table
                addStyledHeader("Top Keywords by Frequency", 3);

                const topKeywords = keywords
                  .filter((k) => k && k.word && typeof k.frequency === "number")
                  .sort((a: any, b: any) => b.frequency - a.frequency)
                  .slice(0, 20);

                let col = 0;
                topKeywords.forEach((keyword: any, index: number) => {
                  if (col === 0) checkPageBreak(15);

                  const xPos = margin + col * 60;
                  pdf.setFillColor(...chartColors[index % chartColors.length]);
                  pdf.rect(xPos, yPosition - 3, 8, 8, "F");

                  pdf.setFontSize(10);
                  pdf.setTextColor(...colors.secondary);
                  pdf.text(
                    `${keyword.word} (${keyword.frequency})`,
                    xPos + 10,
                    yPosition,
                  );

                  col++;
                  if (col === 3) {
                    col = 0;
                    yPosition += 12;
                  }
                });
                if (col > 0) yPosition += 12;
              } else {
                addText("No keyword data available");
              }
            } else {
              addText("No voice of customer data available");
            }
            break;

          case "four_w_matrix":
            console.log("Processing four_w_matrix...");
            addStyledHeader(analysisTitle, 1);

            const fourWMatrix = safeGet(data, "four_w_matrix");
            if (fourWMatrix) {
              const sections = [
                {
                  key: "who",
                  title: "WHO - User Profile",
                  data: safeGet(fourWMatrix, "who"),
                },
                {
                  key: "what",
                  title: "WHAT - Product Usage",
                  data: safeGet(fourWMatrix, "what"),
                },
                {
                  key: "where",
                  title: "WHERE - Usage Locations",
                  data: safeGet(fourWMatrix, "where"),
                },
                {
                  key: "when",
                  title: "WHEN - Usage Timing",
                  data: safeGet(fourWMatrix, "when"),
                },
              ];

              sections.forEach((section, idx) => {
                if (idx > 0 && idx % 2 === 0) {
                  checkPageBreak(80, true);
                }

                addStyledHeader(section.title, 2);

                if (
                  section.data &&
                  Array.isArray(section.data) &&
                  section.data.length > 0
                ) {
                  const pieData = section.data
                    .filter((item) => item && item.topic && item.percentage)
                    .map((item: any) => ({
                      label: item.topic,
                      value: parseFloat(
                        String(item.percentage).replace("%", ""),
                      ),
                    }));

                  createPieChartTable(pieData, "Distribution");

                  if (section.data[0]?.summary) {
                    addSection(
                      "Summary",
                      section.data[0].summary,
                      colors.background,
                    );
                  }
                } else {
                  addText(`No ${section.key} data available`);
                }
              });
            } else {
              addText("No 4W matrix data available");
            }
            break;

          case "jtbd":
            console.log("Processing jtbd...");
            addStyledHeader(analysisTitle, 1);

            const jtbdAnalysis = safeGet(data, "jtbd_analysis");
            if (jtbdAnalysis) {
              const jobTypes = [
                {
                  key: "functional_jobs",
                  title: "Functional Jobs",
                  color: colors.chart1,
                },
                {
                  key: "emotional_jobs",
                  title: "Emotional Jobs",
                  color: colors.chart2,
                },
                {
                  key: "social_jobs",
                  title: "Social Jobs",
                  color: colors.chart3,
                },
              ];

              jobTypes.forEach((jobType, idx) => {
                if (idx > 0) checkPageBreak(80, true);

                addStyledHeader(jobType.title, 2);

                const jobs = safeGet(jtbdAnalysis, jobType.key, []);
                if (Array.isArray(jobs) && jobs.length > 0) {
                  const pieData = jobs
                    .filter((job) => job && job.job_statement && job.percentage)
                    .map((job: any) => ({
                      label:
                        (job.job_statement || "").substring(0, 50) +
                        ((job.job_statement || "").length > 50 ? "..." : ""),
                      value: parseFloat(
                        String(job.percentage).replace("%", ""),
                      ),
                    }));

                  createPieChartTable(pieData, "Job Distribution");

                  // Add full job statements
                  addStyledHeader("Detailed Job Statements", 3);
                  jobs.forEach((job: any) => {
                    if (job && job.job_statement) {
                      addSection(
                        `${job.percentage || "N/A"}`,
                        job.job_statement,
                        colors.background,
                      );
                    }
                  });
                } else {
                  addText(`No ${jobType.title.toLowerCase()} data available`);
                }
              });
            } else {
              addText("No Jobs to be Done data available");
            }
            break;

          case "stp":
            console.log("Processing stp...");
            addStyledHeader(analysisTitle, 1);

            const stpAnalysis = safeGet(data, "stp_analysis");
            if (stpAnalysis) {
              // Segmentation
              const segmentation = safeGet(stpAnalysis, "segmentation", []);
              if (Array.isArray(segmentation) && segmentation.length > 0) {
                addStyledHeader("Market Segmentation", 2);

                const segmentData = segmentation
                  .filter((seg) => seg && seg.segment && seg.percentage)
                  .map((seg: any) => ({
                    label: seg.segment,
                    value: parseFloat(String(seg.percentage).replace("%", "")),
                  }));

                createPieChartTable(segmentData, "Segment Distribution");

                segmentation.forEach((seg: any) => {
                  if (seg && seg.segment && seg.description) {
                    addSection(
                      `${seg.segment} (${seg.percentage || "N/A"})`,
                      seg.description,
                      colors.background,
                    );
                  }
                });
              }

              // Targeting
              const targeting = safeGet(stpAnalysis, "targeting_strategy");
              if (targeting) {
                checkPageBreak(80, true);
                addStyledHeader("Target Market", 2);

                const selectedSegments = safeGet(
                  targeting,
                  "selected_segments",
                );
                if (selectedSegments) {
                  addSection(
                    "Selected Segments",
                    selectedSegments,
                    colors.background,
                  );
                }

                const approachDescription = safeGet(
                  targeting,
                  "approach_description",
                );
                if (approachDescription) {
                  addSection(
                    "Approach Description",
                    approachDescription,
                    colors.background,
                  );
                }
              }

              // Positioning
              const positioning = safeGet(stpAnalysis, "positioning_strategy");
              if (positioning) {
                checkPageBreak(80, true);
                addStyledHeader("Market Positioning", 2);

                const positioningStatement = safeGet(
                  positioning,
                  "positioning_statement",
                );
                if (positioningStatement) {
                  addSection(
                    "Positioning Statement",
                    positioningStatement,
                    colors.background,
                  );
                }

                const uvp = safeGet(positioning, "unique_value_proposition");
                if (uvp) {
                  addSection(
                    "Unique Value Proposition",
                    uvp,
                    colors.background,
                  );
                }
              }
            } else {
              addText("No STP analysis data available");
            }
            break;

          case "swot":
            console.log("Processing swot...");
            addStyledHeader(analysisTitle, 1);

            const swotAnalysis = safeGet(data, "swot_analysis");
            if (swotAnalysis) {
              const swotSections = [
                { key: "strengths", title: "Strengths", color: colors.chart1 },
                {
                  key: "weaknesses",
                  title: "Weaknesses",
                  color: colors.chart3,
                },
                {
                  key: "opportunities",
                  title: "Opportunities",
                  color: colors.chart2,
                },
                { key: "threats", title: "Threats", color: colors.chart4 },
              ];

              let sectionCount = 0;
              swotSections.forEach((section) => {
                if (sectionCount % 2 === 0 && sectionCount > 0) {
                  checkPageBreak(80, true);
                }

                const items = safeGet(swotAnalysis, section.key, []);
                if (Array.isArray(items) && items.length > 0) {
                  addStyledHeader(section.title, 2);

                  const pieData = items
                    .filter((item) => item && item.topic && item.percentage)
                    .map((item: any) => ({
                      label: item.topic,
                      value: parseFloat(
                        String(item.percentage).replace("%", ""),
                      ),
                    }));

                  createPieChartTable(pieData, `${section.title} Distribution`);

                  items.forEach((item: any) => {
                    if (item && item.topic && item.summary) {
                      addSection(
                        `${item.topic} (${item.percentage || "N/A"})`,
                        item.summary,
                        colors.background,
                      );
                    }
                  });

                  sectionCount++;
                }
              });
            } else {
              addText("No SWOT analysis data available");
            }
            break;

          case "customer_journey":
            console.log("Processing customer_journey...");
            addStyledHeader(analysisTitle, 1);

            const customerJourney = safeGet(data, "customer_journey");
            if (customerJourney) {
              const stages = [
                "awareness",
                "consideration",
                "purchase",
                "delivery_unboxing",
                "usage",
                "post_purchase",
              ];

              stages.forEach((stageName, idx) => {
                if (idx % 2 === 0 && idx > 0) {
                  checkPageBreak(80, true);
                }

                const stage = safeGet(customerJourney, stageName);
                if (stage && Array.isArray(stage) && stage.length > 0) {
                  addStyledHeader(
                    stageName.charAt(0).toUpperCase() +
                      stageName.slice(1).replace("_", " "),
                    2,
                  );

                  stage.forEach((stageItem: any) => {
                    if (stageItem && stageItem.topic) {
                      addSection(
                        `${stageItem.topic} (${stageItem.percentage || "N/A"})`,
                        stageItem.summary || "No summary available",
                        colors.background,
                      );
                    }
                  });
                }
              });
            } else {
              addText("No customer journey data available");
            }
            break;

          case "personas":
            console.log("Processing personas...");
            addStyledHeader(analysisTitle, 1);

            const customerPersonas = safeGet(data, "customer_personas", []);
            if (
              Array.isArray(customerPersonas) &&
              customerPersonas.length > 0
            ) {
              customerPersonas.forEach((persona: any, idx: number) => {
                if (idx > 0) checkPageBreak(80, true);

                const personaName =
                  safeGet(persona, "persona_name") ||
                  safeGet(persona, "name") ||
                  `Persona ${idx + 1}`;
                addStyledHeader(personaName, 2);

                const demographics = safeGet(persona, "demographics", {});
                const details = [
                  { label: "Age", value: safeGet(demographics, "age") },
                  {
                    label: "Job Title",
                    value: safeGet(demographics, "job_title"),
                  },
                  {
                    label: "Income Range",
                    value: safeGet(demographics, "income_range"),
                  },
                  {
                    label: "Education",
                    value: safeGet(demographics, "education_level"),
                  },
                  {
                    label: "Living Environment",
                    value: safeGet(demographics, "living_environment"),
                  },
                ];

                details.forEach((detail) => {
                  if (detail.value) {
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(...colors.secondary);
                    pdf.text(`${detail.label}: `, margin, yPosition);
                    pdf.setFont("helvetica", "normal");
                    pdf.text(detail.value, margin + 40, yPosition);
                    yPosition += 8;
                  }
                });

                const intro = safeGet(persona, "persona_intro");
                if (intro) {
                  addSection("Introduction", intro, colors.background);
                }

                const goals = safeGet(persona, "goals_motivations", []);
                if (Array.isArray(goals) && goals.length > 0) {
                  addStyledHeader("Goals & Motivations", 3);
                  goals.forEach((goal: string) => {
                    checkPageBreak(15);
                    pdf.setFontSize(11);
                    pdf.setTextColor(...colors.secondary);
                    pdf.text(`• ${goal}`, margin + 5, yPosition);
                    yPosition += 8;
                  });
                }

                const painPoints = safeGet(
                  persona,
                  "pain_points_frustrations",
                  [],
                );
                if (Array.isArray(painPoints) && painPoints.length > 0) {
                  addStyledHeader("Pain Points & Frustrations", 3);
                  painPoints.forEach((pain: string) => {
                    checkPageBreak(15);
                    pdf.setFontSize(11);
                    pdf.setTextColor(...colors.secondary);
                    pdf.text(`• ${pain}`, margin + 5, yPosition);
                    yPosition += 8;
                  });
                }
              });
            } else {
              addText("No customer persona data available");
            }
            break;

          case "competition":
            console.log("Processing competition...");
            addStyledHeader(analysisTitle, 1);

            const competitionAnalysis = safeGet(data, "competition_analysis");
            if (competitionAnalysis) {
              const usps = safeGet(competitionAnalysis, "usps");
              if (usps) {
                addStyledHeader("Unique Selling Propositions", 2);

                const userBrand = safeGet(usps, "user_brand");
                if (userBrand) {
                  addSection("Your Brand", userBrand, colors.background);
                }

                // Add competitor USPs
                Object.keys(usps).forEach((key, index) => {
                  if (key.startsWith("competitor_") && usps[key]) {
                    addSection(
                      `Competitor ${index}`,
                      usps[key],
                      colors.background,
                    );
                  }
                });
              }

              const comparisonMatrix = safeGet(
                competitionAnalysis,
                "comparison_matrix",
                [],
              );
              if (
                Array.isArray(comparisonMatrix) &&
                comparisonMatrix.length > 0
              ) {
                checkPageBreak(80, true);
                addStyledHeader("Feature Comparison", 2);

                comparisonMatrix.forEach((feature: any) => {
                  if (feature && feature.feature) {
                    checkPageBreak(40);

                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(...colors.primary);
                    pdf.text(feature.feature, margin, yPosition);
                    yPosition += 8;

                    // Show comparison results
                    Object.keys(feature).forEach((key) => {
                      if (key !== "feature" && feature[key]) {
                        pdf.setFontSize(10);
                        pdf.setFont("helvetica", "normal");
                        pdf.setTextColor(...colors.secondary);
                        pdf.text(
                          `${key}: ${feature[key]}`,
                          margin + 5,
                          yPosition,
                        );
                        yPosition += 6;
                      }
                    });
                    yPosition += 5;
                  }
                });
              }
            } else {
              addText("No competition analysis data available");
            }
            break;

          case "strategic_recommendations":
            console.log("Processing strategic_recommendations...");
            addStyledHeader(analysisTitle, 1);

            const strategicRec = safeGet(data, "strategic_recommendations");
            if (strategicRec) {
              const execSummary = safeGet(strategicRec, "executive_summary");
              if (execSummary) {
                addSection("Executive Summary", execSummary, colors.background);
              }

              // Process different strategy types
              const strategyTypes = [
                "product_strategy",
                "marketing_strategy",
                "customer_experience",
                "competitive_strategy",
              ];

              strategyTypes.forEach((strategyType) => {
                const strategies = safeGet(strategicRec, strategyType, []);
                if (Array.isArray(strategies) && strategies.length > 0) {
                  checkPageBreak(60, true);
                  addStyledHeader(
                    strategyType
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                    2,
                  );

                  strategies.forEach((rec: any, idx: number) => {
                    if (rec && rec.recommendation) {
                      checkPageBreak(40);

                      addStyledHeader(
                        `${idx + 1}. ${rec.timeframe || "Strategy"} - ${rec.priority_level || "Priority"}`,
                        3,
                      );

                      addSection(
                        "Recommendation",
                        rec.recommendation,
                        colors.background,
                      );

                      if (rec.expected_impact) {
                        addSection(
                          "Expected Impact",
                          rec.expected_impact,
                          colors.background,
                        );
                      }

                      if (rec.implementation_considerations) {
                        addSection(
                          "Implementation",
                          rec.implementation_considerations,
                          colors.background,
                        );
                      }
                    }
                  });
                }
              });
            } else {
              addText("No strategic recommendations data available");
            }
            break;

          default:
            console.log(`⚠️ Unknown analysis type: ${analysis.type}`);
            addStyledHeader(analysisTitle, 1);
            addText(
              "Analysis data available - see platform for detailed visualization",
              12,
            );
            break;
        }
      } catch (error) {
        console.error(`❌ Error processing ${analysis.type}:`, error);
        addStyledHeader(analysisTitle, 1);
        addSection(
          "Error",
          "Unable to process this analysis data. Please view on the platform for complete details.",
          colors.background,
        );
      }
    });

    // Add footer to all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Footer background
      pdf.setFillColor(...colors.secondary);
      pdf.rect(0, pageHeight - 15, pageWidth, 15, "F");

      // Footer text
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.white);
      pdf.text(
        `Generated by RevuIntel - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 7,
        { align: "center" },
      );
    }

    console.log(`✅ PDF generation completed. Total pages: ${totalPages}`);

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
    console.error("❌ Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
