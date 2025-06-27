// app/api/products/[productId]/export/route.ts - Enhanced PDF Export
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
      addStyledHeader(title, 3);

      const barHeight = 12;
      const barSpacing = 8;
      const maxBarWidth = pageWidth - margin * 2 - 100;
      const maxValue = Math.max(...data.map((d) => Math.abs(d.value)));

      data.forEach((item, index) => {
        checkPageBreak(barHeight + barSpacing + 10);

        // Label
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...colors.secondary);

        const labelText =
          item.label.length > 25
            ? item.label.substring(0, 25) + "..."
            : item.label;
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
      addStyledHeader(title, 3);

      const total = data.reduce((sum, item) => sum + item.value, 0);

      data.forEach((item, index) => {
        checkPageBreak(20);

        const percentage = ((item.value / total) * 100).toFixed(1);
        const colorIndex = index % chartColors.length;

        // Color box
        pdf.setFillColor(...chartColors[colorIndex]);
        pdf.rect(margin, yPosition - 3, 8, 8, "F");

        // Label and percentage
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.secondary);
        pdf.text(`${item.label}: ${percentage}%`, margin + 12, yPosition);

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

      const cloudHeight = 100;
      checkPageBreak(cloudHeight + 20);

      // Background
      pdf.setFillColor(...colors.background);
      pdf.rect(margin, yPosition, pageWidth - margin * 2, cloudHeight, "F");

      // Sort and limit keywords
      const sortedKeywords = keywords
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 30);

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

    // Process each analysis
    product.analyses.forEach((analysis) => {
      // Always start new analysis on new page
      pdf.addPage();
      yPosition = margin;

      const analysisTitle =
        analysisTypes.find((t) => t.key === analysis.type)?.name ||
        analysis.type
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

      try {
        const data = analysis.data as any;

        switch (analysis.type) {
          case "product_description":
            addStyledHeader(analysisTitle, 1);

            if (data.product_description) {
              addSection(
                "Product Summary",
                data.product_description.summary || "No summary available",
                colors.background,
              );

              if (data.product_description.attributes?.length > 0) {
                addStyledHeader("Key Attributes", 3);
                data.product_description.attributes.forEach((attr: string) => {
                  checkPageBreak(15);
                  pdf.setFontSize(11);
                  pdf.setTextColor(...colors.secondary);
                  pdf.text(`• ${attr}`, margin + 5, yPosition);
                  yPosition += 8;
                });
              }

              if (data.product_description.variations?.length > 0) {
                addStyledHeader("Product Variations", 3);
                data.product_description.variations.forEach(
                  (variation: string) => {
                    checkPageBreak(15);
                    pdf.setFontSize(11);
                    pdf.setTextColor(...colors.secondary);
                    pdf.text(`• ${variation}`, margin + 5, yPosition);
                    yPosition += 8;
                  },
                );
              }
            }
            break;

          case "sentiment":
            addStyledHeader(analysisTitle, 1);

            if (data.sentiment_analysis) {
              // Customer Likes
              if (data.sentiment_analysis.customer_likes?.length > 0) {
                addStyledHeader("What Customers Love", 2, 100);

                const likesData = data.sentiment_analysis.customer_likes
                  .slice(0, 10)
                  .map((item: any) => ({
                    label: item.theme,
                    value: parseFloat(item.percentage.replace("%", "")),
                  }));

                createHorizontalBarChart(
                  likesData,
                  "Customer Satisfaction Levels",
                );

                // Add detailed summaries
                data.sentiment_analysis.customer_likes
                  .slice(0, 5)
                  .forEach((item: any) => {
                    addSection(
                      `${item.theme} (${item.percentage})`,
                      item.summary,
                      colors.background,
                    );
                  });
              }

              // Customer Dislikes
              if (data.sentiment_analysis.customer_dislikes?.length > 0) {
                checkPageBreak(80, true); // New page for dislikes
                addStyledHeader("Areas for Improvement", 2, 100);

                const dislikesData = data.sentiment_analysis.customer_dislikes
                  .slice(0, 10)
                  .map((item: any) => ({
                    label: item.theme,
                    value: parseFloat(item.percentage.replace("%", "")),
                  }));

                createHorizontalBarChart(
                  dislikesData,
                  "Customer Concern Levels",
                );

                // Add detailed summaries
                data.sentiment_analysis.customer_dislikes
                  .slice(0, 5)
                  .forEach((item: any) => {
                    addSection(
                      `${item.theme} (${item.percentage})`,
                      item.summary,
                      colors.background,
                    );
                  });
              }
            }
            break;

          case "voice_of_customer":
            addStyledHeader(analysisTitle, 1);

            if (data.voice_of_customer?.keywords?.length > 0) {
              createWordCloud(
                data.voice_of_customer.keywords,
                "Word Cloud - Most Frequently Mentioned Terms",
              );

              // Top keywords table
              addStyledHeader("Top Keywords by Frequency", 3);

              const topKeywords = data.voice_of_customer.keywords
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
            }
            break;

          case "four_w_matrix":
            addStyledHeader(analysisTitle, 1);

            if (data.four_w_matrix) {
              const sections = [
                {
                  key: "who",
                  title: "WHO - User Profile",
                  data: data.four_w_matrix.who,
                },
                {
                  key: "what",
                  title: "WHAT - Product Usage",
                  data: data.four_w_matrix.what,
                },
                {
                  key: "where",
                  title: "WHERE - Usage Locations",
                  data: data.four_w_matrix.where,
                },
                {
                  key: "when",
                  title: "WHEN - Usage Timing",
                  data: data.four_w_matrix.when,
                },
              ];

              sections.forEach((section, idx) => {
                if (idx > 0 && idx % 2 === 0) {
                  checkPageBreak(80, true);
                }

                addStyledHeader(section.title, 2);

                if (section.data?.topics?.length > 0) {
                  const pieData = section.data.topics.map((item: any) => ({
                    label: item.topic,
                    value: parseFloat(item.percentage.replace("%", "")),
                  }));

                  createPieChartTable(pieData, "Distribution");

                  if (section.data.summary) {
                    addSection(
                      "Summary",
                      section.data.summary,
                      colors.background,
                    );
                  }
                }
              });
            }
            break;

          case "jtbd":
            addStyledHeader(analysisTitle, 1);

            if (data.jtbd_analysis) {
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

                const jobs = data.jtbd_analysis[jobType.key];
                if (jobs?.length > 0) {
                  const pieData = jobs.map((job: any) => ({
                    label:
                      job.job_statement.substring(0, 50) +
                      (job.job_statement.length > 50 ? "..." : ""),
                    value: parseFloat(job.percentage.replace("%", "")),
                  }));

                  createPieChartTable(pieData, "Job Distribution");

                  // Add full job statements
                  addStyledHeader("Detailed Job Statements", 3);
                  jobs.forEach((job: any) => {
                    addSection(
                      `${job.percentage}`,
                      job.job_statement,
                      colors.background,
                    );
                  });
                }
              });
            }
            break;

          case "stp":
            addStyledHeader(analysisTitle, 1);

            if (data.stp_analysis) {
              // Segmentation
              if (data.stp_analysis.segmentation?.segments?.length > 0) {
                addStyledHeader("Market Segmentation", 2);

                const segmentData = data.stp_analysis.segmentation.segments.map(
                  (seg: any) => ({
                    label: seg.segment,
                    value: parseFloat(seg.percentage.replace("%", "")),
                  }),
                );

                createPieChartTable(segmentData, "Segment Distribution");

                data.stp_analysis.segmentation.segments.forEach((seg: any) => {
                  addSection(
                    `${seg.segment} (${seg.percentage})`,
                    seg.description,
                    colors.background,
                  );
                });
              }

              // Targeting
              if (data.stp_analysis.targeting) {
                checkPageBreak(80, true);
                addStyledHeader("Target Market", 2);

                if (data.stp_analysis.targeting.primary_target) {
                  addSection(
                    "Primary Target",
                    data.stp_analysis.targeting.primary_target,
                    colors.background,
                  );
                }

                if (data.stp_analysis.targeting.secondary_targets?.length > 0) {
                  addStyledHeader("Secondary Targets", 3);
                  data.stp_analysis.targeting.secondary_targets.forEach(
                    (target: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${target}`, margin + 5, yPosition);
                      yPosition += 8;
                    },
                  );
                }
              }

              // Positioning
              if (data.stp_analysis.positioning) {
                checkPageBreak(80, true);
                addStyledHeader("Market Positioning", 2);

                if (data.stp_analysis.positioning.statement) {
                  addSection(
                    "Positioning Statement",
                    data.stp_analysis.positioning.statement,
                    colors.background,
                  );
                }

                if (
                  data.stp_analysis.positioning.key_differentiators?.length > 0
                ) {
                  addStyledHeader("Key Differentiators", 3);
                  data.stp_analysis.positioning.key_differentiators.forEach(
                    (diff: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${diff}`, margin + 5, yPosition);
                      yPosition += 8;
                    },
                  );
                }
              }
            }
            break;

          case "swot":
            addStyledHeader(analysisTitle, 1);

            if (data.swot_analysis) {
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

                const items = data.swot_analysis[section.key];
                if (items?.length > 0) {
                  addStyledHeader(section.title, 2);

                  const pieData = items.map((item: any) => ({
                    label: item.topic,
                    value: parseFloat(item.percentage.replace("%", "")),
                  }));

                  createPieChartTable(pieData, `${section.title} Distribution`);

                  items.forEach((item: any) => {
                    addSection(
                      `${item.topic} (${item.percentage})`,
                      item.description,
                      colors.background,
                    );
                  });

                  sectionCount++;
                }
              });
            }
            break;

          case "customer_journey":
            addStyledHeader(analysisTitle, 1);

            if (data.customer_journey?.stages) {
              const stages = [
                "awareness",
                "consideration",
                "purchase",
                "onboarding",
                "usage",
                "advocacy",
              ];

              stages.forEach((stageName, idx) => {
                if (idx % 2 === 0 && idx > 0) {
                  checkPageBreak(80, true);
                }

                const stage = data.customer_journey.stages[stageName];
                if (stage) {
                  addStyledHeader(
                    stageName.charAt(0).toUpperCase() + stageName.slice(1),
                    2,
                  );

                  if (stage.description) {
                    addSection(
                      "Stage Description",
                      stage.description,
                      colors.background,
                    );
                  }

                  if (stage.touchpoints?.length > 0) {
                    addStyledHeader("Touchpoints", 3);
                    stage.touchpoints.forEach((touchpoint: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${touchpoint}`, margin + 5, yPosition);
                      yPosition += 8;
                    });
                  }

                  if (stage.pain_points?.length > 0) {
                    addStyledHeader("Pain Points", 3);
                    stage.pain_points.forEach((pain: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${pain}`, margin + 5, yPosition);
                      yPosition += 8;
                    });
                  }

                  if (stage.opportunities?.length > 0) {
                    addStyledHeader("Opportunities", 3);
                    stage.opportunities.forEach((opp: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${opp}`, margin + 5, yPosition);
                      yPosition += 8;
                    });
                  }
                }
              });
            }
            break;

          case "personas":
            addStyledHeader(analysisTitle, 1);

            if (data.customer_personas?.personas?.length > 0) {
              data.customer_personas.personas.forEach(
                (persona: any, idx: number) => {
                  if (idx > 0) checkPageBreak(80, true);

                  addStyledHeader(persona.name || `Persona ${idx + 1}`, 2);

                  const details = [
                    { label: "Age", value: persona.age },
                    { label: "Occupation", value: persona.occupation },
                    { label: "Location", value: persona.location },
                    { label: "Income", value: persona.income },
                    { label: "Family Status", value: persona.family_status },
                  ];

                  details.forEach((detail) => {
                    if (detail.value) {
                      pdf.setFontSize(11);
                      pdf.setFont("helvetica", "bold");
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`${detail.label}: `, margin, yPosition);
                      pdf.setFont("helvetica", "normal");
                      pdf.text(detail.value, margin + 30, yPosition);
                      yPosition += 8;
                    }
                  });

                  if (persona.personality_traits?.length > 0) {
                    addStyledHeader("Personality Traits", 3);
                    persona.personality_traits.forEach((trait: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${trait}`, margin + 5, yPosition);
                      yPosition += 8;
                    });
                  }

                  if (persona.goals?.length > 0) {
                    addStyledHeader("Goals", 3);
                    persona.goals.forEach((goal: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${goal}`, margin + 5, yPosition);
                      yPosition += 8;
                    });
                  }

                  if (persona.pain_points?.length > 0) {
                    addStyledHeader("Pain Points", 3);
                    persona.pain_points.forEach((pain: string) => {
                      checkPageBreak(15);
                      pdf.setFontSize(11);
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(`• ${pain}`, margin + 5, yPosition);
                      yPosition += 8;
                    });
                  }

                  if (persona.quote) {
                    addSection(
                      "Quote",
                      `"${persona.quote}"`,
                      colors.background,
                    );
                  }
                },
              );
            }
            break;

          case "competition":
            addStyledHeader(analysisTitle, 1);

            if (data.competition_analysis) {
              if (data.competition_analysis.executive_summary) {
                addSection(
                  "Executive Summary",
                  data.competition_analysis.executive_summary,
                  colors.background,
                );
              }

              if (data.competition_analysis.feature_comparison?.length > 0) {
                checkPageBreak(80, true);
                addStyledHeader("Feature Comparison", 2);

                data.competition_analysis.feature_comparison.forEach(
                  (feature: any) => {
                    checkPageBreak(40);

                    pdf.setFontSize(12);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(...colors.primary);
                    pdf.text(feature.feature_name, margin, yPosition);
                    yPosition += 8;

                    // Your product
                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(...colors.secondary);
                    pdf.text("Your Product:", margin, yPosition);
                    yPosition += 5;

                    const yourLines = pdf.splitTextToSize(
                      feature.your_product || "N/A",
                      pageWidth - margin * 2 - 20,
                    );
                    pdf.text(yourLines, margin + 5, yPosition);
                    yPosition += yourLines.length * 4 + 3;

                    // Competitors
                    pdf.text("Competitors:", margin, yPosition);
                    yPosition += 5;

                    const compLines = pdf.splitTextToSize(
                      feature.competitors || "N/A",
                      pageWidth - margin * 2 - 20,
                    );
                    pdf.text(compLines, margin + 5, yPosition);
                    yPosition += compLines.length * 4 + 8;
                  },
                );
              }

              if (
                data.competition_analysis.competitive_advantages?.length > 0
              ) {
                addStyledHeader("Competitive Advantages", 2);
                data.competition_analysis.competitive_advantages.forEach(
                  (adv: string) => {
                    checkPageBreak(15);
                    pdf.setFontSize(11);
                    pdf.setTextColor(...colors.secondary);
                    pdf.text(`• ${adv}`, margin + 5, yPosition);
                    yPosition += 8;
                  },
                );
              }
            }
            break;

          case "strategic_recommendations":
            addStyledHeader(analysisTitle, 1);

            if (data.strategic_recommendations?.recommendations?.length > 0) {
              data.strategic_recommendations.recommendations.forEach(
                (rec: any, idx: number) => {
                  if (idx > 0) checkPageBreak(60);

                  addStyledHeader(`${idx + 1}. ${rec.title}`, 2);

                  if (rec.description) {
                    addSection(
                      "Description",
                      rec.description,
                      colors.background,
                    );
                  }

                  if (rec.implementation_steps?.length > 0) {
                    addStyledHeader("Implementation Steps", 3);
                    rec.implementation_steps.forEach(
                      (step: string, stepIdx: number) => {
                        checkPageBreak(15);
                        pdf.setFontSize(11);
                        pdf.setTextColor(...colors.secondary);
                        pdf.text(
                          `${stepIdx + 1}. ${step}`,
                          margin + 5,
                          yPosition,
                        );
                        yPosition += 8;
                      },
                    );
                  }

                  if (rec.expected_impact) {
                    addSection(
                      "Expected Impact",
                      rec.expected_impact,
                      colors.background,
                    );
                  }

                  if (rec.priority) {
                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(...colors.secondary);
                    pdf.text("Priority: ", margin, yPosition);
                    pdf.setFont("helvetica", "normal");

                    const priorityColor =
                      rec.priority === "High"
                        ? colors.chart1
                        : rec.priority === "Medium"
                          ? colors.chart2
                          : colors.chart3;
                    pdf.setTextColor(...priorityColor);
                    pdf.text(rec.priority, margin + 25, yPosition);
                    yPosition += 10;
                  }
                },
              );
            }
            break;

          default:
            addStyledHeader(analysisTitle, 1);
            addText(
              "Analysis data available - see platform for detailed visualization",
              12,
            );
            break;
        }
      } catch (error) {
        console.error(`Error processing ${analysis.type}:`, error);
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
