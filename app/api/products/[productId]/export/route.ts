// app/api/products/[productId]/export/route.ts - Fixed PDF Export
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

// Enhanced PDF Export with better formatting and no emojis
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

    // Generate Enhanced PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Enhanced styling constants
    const colors = {
      primary: [59, 130, 246], // Blue
      secondary: [107, 114, 128], // Gray
      success: [16, 185, 129], // Green
      warning: [245, 158, 11], // Yellow
      danger: [239, 68, 68], // Red
      light: [243, 244, 246], // Light gray
      black: [0, 0, 0],
      white: [255, 255, 255],
    };

    // Helper function to add page if needed
    const checkPageBreak = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add styled headers
    const addStyledHeader = (text: string, level: number = 1) => {
      const fontSize = level === 1 ? 24 : level === 2 ? 18 : 14;
      const color = level === 1 ? colors.primary : colors.secondary;

      checkPageBreak(fontSize + 10);

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

      checkPageBreak(requiredSpace);

      pdf.text(textLines, margin, yPosition);
      yPosition += requiredSpace + 3;
    };

    // Helper function to add colored boxes/sections
    const addSection = (
      title: string,
      content: string,
      backgroundColor?: number[],
    ) => {
      checkPageBreak(40);

      // Add background if specified
      if (backgroundColor) {
        pdf.setFillColor(...backgroundColor);
        const contentLines = pdf.splitTextToSize(
          content,
          pageWidth - margin * 2 - 10,
        );
        const boxHeight = 15 + contentLines.length * 4.5;
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
      const contentLines = pdf.splitTextToSize(
        content,
        pageWidth - margin * 2 - 10,
      );
      pdf.text(contentLines, margin, yPosition);
      yPosition += contentLines.length * 4.5 + 8;
    };

    // Helper function to create simple bar charts
    const createBarChart = (
      data: Array<{ label: string; value: number }>,
      title: string,
    ) => {
      addStyledHeader(title, 3);

      const maxValue = Math.max(...data.map((d) => d.value));
      const barWidth = pageWidth - margin * 2 - 100;

      data.forEach((item) => {
        checkPageBreak(15);

        // Label
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(item.label.substring(0, 30), margin, yPosition);

        // Bar
        const barLength = (item.value / maxValue) * barWidth;
        pdf.setFillColor(...colors.primary);
        pdf.rect(margin + 80, yPosition - 4, barLength, 6, "F");

        // Value
        pdf.text(`${item.value}%`, margin + 85 + barLength, yPosition);

        yPosition += 10;
      });

      yPosition += 5;
    };

    // Title Page with enhanced styling
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 60, "F");

    pdf.setTextColor(...colors.white);
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.text("Product Analysis Report", margin, 35);

    yPosition = 80;
    pdf.setTextColor(...colors.black);

    // Product Information Box
    pdf.setFillColor(...colors.light);
    pdf.rect(margin - 5, yPosition - 5, pageWidth - margin * 2 + 10, 50, "F");

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Product Information", margin, yPosition + 10);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Product: ${product.name}`, margin, yPosition + 20);
    pdf.text(`Brand: ${product.brand.name}`, margin, yPosition + 28);
    pdf.text(
      `Reviews Analyzed: ${product.reviewsCount.toLocaleString()}`,
      margin,
      yPosition + 36,
    );
    pdf.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      margin,
      yPosition + 44,
    );

    yPosition += 65;

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
    analysisTypes.forEach((type) => {
      const hasAnalysis = product.analyses.some((a) =>
        a.type.includes(type.key.split("_")[0]),
      );
      if (hasAnalysis) {
        addText(`${tocIndex}. ${type.name}`, 11);
        tocIndex++;
      }
    });

    // Process each analysis with enhanced formatting
    product.analyses.forEach((analysis) => {
      pdf.addPage();
      yPosition = margin;

      const analysisTitle = analysis.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      addStyledHeader(analysisTitle, 1);

      try {
        const data = analysis.data as any;

        switch (analysis.type) {
          case "product_description":
            if (data.product_description) {
              addSection(
                "Product Summary",
                data.product_description.summary || "No summary available",
                colors.light,
              );

              if (data.product_description.attributes?.length > 0) {
                addStyledHeader("Key Attributes", 3);
                data.product_description.attributes.forEach((attr: string) => {
                  addText(`• ${attr}`, 11);
                });
              }

              if (data.product_description.variations?.length > 0) {
                addStyledHeader("Product Variations", 3);
                addText(data.product_description.variations.join("\n"), 11);
              }
            }
            break;

          case "sentiment":
            if (data.sentiment_analysis) {
              // Customer Likes
              if (data.sentiment_analysis.customer_likes?.length > 0) {
                addStyledHeader("What Customers Love", 2);

                const likesData = data.sentiment_analysis.customer_likes.map(
                  (item: any) => ({
                    label: item.theme,
                    value: parseFloat(item.percentage.replace("%", "")),
                  }),
                );

                createBarChart(likesData, "Customer Satisfaction Levels");

                data.sentiment_analysis.customer_likes.forEach((item: any) => {
                  addSection(
                    `${item.theme} (${item.percentage})`,
                    item.summary,
                    [240, 253, 244], // Light green
                  );

                  if (item.example_quote) {
                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "italic");
                    pdf.setTextColor(...colors.secondary);
                    const quoteLines = pdf.splitTextToSize(
                      `"${item.example_quote}"`,
                      pageWidth - margin * 2 - 20,
                    );
                    checkPageBreak(quoteLines.length * 4);
                    pdf.text(quoteLines, margin + 10, yPosition);
                    yPosition += quoteLines.length * 4 + 5;
                  }
                });
              }

              // Customer Dislikes
              if (data.sentiment_analysis.customer_dislikes?.length > 0) {
                checkPageBreak(30);
                addStyledHeader("Areas for Improvement", 2);

                const dislikesData =
                  data.sentiment_analysis.customer_dislikes.map(
                    (item: any) => ({
                      label: item.theme,
                      value: parseFloat(item.percentage.replace("%", "")),
                    }),
                  );

                createBarChart(dislikesData, "Customer Concern Levels");

                data.sentiment_analysis.customer_dislikes.forEach(
                  (item: any) => {
                    addSection(
                      `${item.theme} (${item.percentage})`,
                      item.summary,
                      [254, 242, 242], // Light red
                    );

                    if (item.example_quote) {
                      pdf.setFontSize(10);
                      pdf.setFont("helvetica", "italic");
                      pdf.setTextColor(...colors.secondary);
                      const quoteLines = pdf.splitTextToSize(
                        `"${item.example_quote}"`,
                        pageWidth - margin * 2 - 20,
                      );
                      checkPageBreak(quoteLines.length * 4);
                      pdf.text(quoteLines, margin + 10, yPosition);
                      yPosition += quoteLines.length * 4 + 5;
                    }
                  },
                );
              }
            }
            break;

          case "voice_of_customer":
            if (data.voice_of_customer?.keywords) {
              addStyledHeader("Top Customer Keywords", 2);

              const topKeywords = data.voice_of_customer.keywords
                .sort((a: any, b: any) => b.frequency - a.frequency)
                .slice(0, 20);

              // Create two columns for keywords
              const midPoint = Math.ceil(topKeywords.length / 2);
              const column1 = topKeywords.slice(0, midPoint);
              const column2 = topKeywords.slice(midPoint);

              checkPageBreak(column1.length * 6);

              pdf.setFontSize(11);
              let tempY = yPosition;

              // Column 1
              column1.forEach((keyword: any) => {
                pdf.setFont("helvetica", "bold");
                pdf.text(keyword.word, margin, tempY);
                pdf.setFont("helvetica", "normal");
                pdf.text(`(${keyword.frequency})`, margin + 40, tempY);
                tempY += 6;
              });

              // Column 2
              tempY = yPosition;
              column2.forEach((keyword: any) => {
                pdf.setFont("helvetica", "bold");
                pdf.text(keyword.word, pageWidth / 2 + 10, tempY);
                pdf.setFont("helvetica", "normal");
                pdf.text(`(${keyword.frequency})`, pageWidth / 2 + 50, tempY);
                tempY += 6;
              });

              yPosition += Math.max(column1.length, column2.length) * 6 + 10;
            }
            break;

          case "strategic_recommendations":
            if (data.strategic_recommendations) {
              if (data.strategic_recommendations.executive_summary) {
                addSection(
                  "Executive Summary",
                  data.strategic_recommendations.executive_summary,
                  colors.light,
                );
              }

              const strategies = [
                { key: "product_strategy", title: "Product Strategy" },
                { key: "marketing_strategy", title: "Marketing Strategy" },
                { key: "customer_experience", title: "Customer Experience" },
                { key: "competitive_strategy", title: "Competitive Strategy" },
              ];

              strategies.forEach((strategy) => {
                if (data.strategic_recommendations[strategy.key]?.length > 0) {
                  checkPageBreak(30);
                  addStyledHeader(strategy.title, 2);

                  data.strategic_recommendations[strategy.key].forEach(
                    (rec: any, index: number) => {
                      const priorityColor =
                        rec.priority_level === "High"
                          ? colors.danger
                          : rec.priority_level === "Medium"
                            ? colors.warning
                            : colors.success;

                      checkPageBreak(40);

                      // Priority indicator
                      pdf.setFillColor(...priorityColor);
                      pdf.circle(margin + 3, yPosition - 2, 2, "F");

                      pdf.setFontSize(12);
                      pdf.setFont("helvetica", "bold");
                      pdf.text(
                        `${index + 1}. ${rec.recommendation}`,
                        margin + 8,
                        yPosition,
                      );
                      yPosition += 6;

                      pdf.setFontSize(10);
                      pdf.setFont("helvetica", "normal");
                      pdf.setTextColor(...colors.secondary);
                      pdf.text(
                        `Priority: ${rec.priority_level} | Timeline: ${rec.timeframe}`,
                        margin + 8,
                        yPosition,
                      );
                      yPosition += 6;

                      pdf.setTextColor(...colors.black);
                      const introLines = pdf.splitTextToSize(
                        rec.introduction,
                        pageWidth - margin * 2 - 8,
                      );
                      pdf.text(introLines, margin + 8, yPosition);
                      yPosition += introLines.length * 4 + 4;

                      if (rec.expected_impact) {
                        pdf.setFont("helvetica", "bold");
                        pdf.text("Expected Impact:", margin + 8, yPosition);
                        yPosition += 5;
                        pdf.setFont("helvetica", "normal");
                        const impactLines = pdf.splitTextToSize(
                          rec.expected_impact,
                          pageWidth - margin * 2 - 8,
                        );
                        pdf.text(impactLines, margin + 8, yPosition);
                        yPosition += impactLines.length * 4 + 8;
                      }
                    },
                  );
                }
              });
            }
            break;

          case "swot":
            if (data.swot_analysis) {
              const swotCategories = [
                {
                  key: "strengths",
                  title: "Strengths",
                  color: [240, 253, 244],
                },
                {
                  key: "weaknesses",
                  title: "Weaknesses",
                  color: [254, 242, 242],
                },
                {
                  key: "opportunities",
                  title: "Opportunities",
                  color: [235, 248, 255],
                },
                { key: "threats", title: "Threats", color: [254, 245, 231] },
              ];

              swotCategories.forEach((category) => {
                if (data.swot_analysis[category.key]?.length > 0) {
                  checkPageBreak(30);
                  addStyledHeader(category.title, 2);

                  data.swot_analysis[category.key].forEach((item: any) => {
                    addSection(
                      `${item.topic} (${item.percentage})`,
                      item.summary,
                      category.color,
                    );

                    if (item.example_quote) {
                      pdf.setFontSize(10);
                      pdf.setFont("helvetica", "italic");
                      pdf.setTextColor(...colors.secondary);
                      const quoteLines = pdf.splitTextToSize(
                        `"${item.example_quote}"`,
                        pageWidth - margin * 2 - 20,
                      );
                      checkPageBreak(quoteLines.length * 4);
                      pdf.text(quoteLines, margin + 10, yPosition);
                      yPosition += quoteLines.length * 4 + 5;
                    }
                  });
                }
              });
            }
            break;

          case "personas":
            if (data.customer_personas?.length > 0) {
              data.customer_personas.forEach((persona: any, index: number) => {
                if (index > 0) {
                  pdf.addPage();
                  yPosition = margin;
                }

                addStyledHeader(
                  `Persona ${index + 1}: ${persona.persona_name}`,
                  2,
                );

                pdf.setFontSize(11);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(...colors.primary);
                pdf.text(
                  `Represents ${persona.representation_percentage} of customers`,
                  margin,
                  yPosition,
                );
                yPosition += 8;

                addSection(
                  "Introduction",
                  persona.persona_intro,
                  [240, 249, 255],
                );

                // Demographics in a structured format
                addStyledHeader("Demographics", 3);
                const demographics = [
                  `Age: ${persona.demographics.age}`,
                  `Job: ${persona.demographics.job_title}`,
                  `Education: ${persona.demographics.education_level}`,
                  `Income: ${persona.demographics.income_range}`,
                  `Location: ${persona.demographics.living_environment}`,
                ];
                demographics.forEach((demo) => {
                  addText(demo, 10);
                });

                if (persona.goals_motivations?.length > 0) {
                  addStyledHeader("Goals & Motivations", 3);
                  persona.goals_motivations.forEach((goal: string) => {
                    addText(`• ${goal}`, 10);
                  });
                }

                if (persona.pain_points_frustrations?.length > 0) {
                  addStyledHeader("Pain Points & Frustrations", 3);
                  persona.pain_points_frustrations.forEach((pain: string) => {
                    addText(`• ${pain}`, 10);
                  });
                }

                if (persona.psychographics) {
                  addStyledHeader("Psychographics", 3);
                  const psycho = persona.psychographics;
                  if (psycho.lifestyle) {
                    addText(`Lifestyle: ${psycho.lifestyle}`, 10);
                  }
                  if (psycho.values) {
                    addText(`Values: ${psycho.values}`, 10);
                  }
                  if (psycho.personality_traits) {
                    addText(`Personality: ${psycho.personality_traits}`, 10);
                  }
                }
              });
            }
            break;

          case "four_w_matrix":
            if (data.four_w_matrix) {
              const matrices = [
                { key: "who", title: "WHO - User Profile" },
                { key: "what", title: "WHAT - Product Usage" },
                { key: "where", title: "WHERE - Usage Locations" },
                { key: "when", title: "WHEN - Usage Timing" },
              ];

              matrices.forEach((matrix) => {
                if (data.four_w_matrix[matrix.key]) {
                  checkPageBreak(30);
                  addStyledHeader(matrix.title, 2);

                  const matrixData = data.four_w_matrix[matrix.key];
                  if (matrixData.insights?.length > 0) {
                    matrixData.insights.forEach((insight: any) => {
                      addSection(
                        `${insight.category} (${insight.percentage})`,
                        insight.details,
                        colors.light,
                      );
                    });
                  }

                  if (matrixData.summary) {
                    addStyledHeader("Summary", 3);
                    addText(matrixData.summary, 11);
                  }
                }
              });
            }
            break;

          case "jtbd":
            if (data.jobs_to_be_done) {
              const jobTypes = [
                { key: "functional_jobs", title: "Functional Jobs" },
                { key: "emotional_jobs", title: "Emotional Jobs" },
                { key: "social_jobs", title: "Social Jobs" },
              ];

              jobTypes.forEach((jobType) => {
                if (data.jobs_to_be_done[jobType.key]?.length > 0) {
                  checkPageBreak(30);
                  addStyledHeader(jobType.title, 2);

                  data.jobs_to_be_done[jobType.key].forEach((job: any) => {
                    addSection(
                      job.job_name,
                      `${job.description}\n\nImportance: ${job.importance_level}`,
                      colors.light,
                    );
                  });
                }
              });
            }
            break;

          case "customer_journey":
            if (data.customer_journey?.stages) {
              addStyledHeader("Customer Journey Stages", 2);

              data.customer_journey.stages.forEach((stage: any) => {
                checkPageBreak(40);

                pdf.setFillColor(...colors.primary);
                pdf.rect(
                  margin - 5,
                  yPosition - 5,
                  pageWidth - margin * 2 + 10,
                  8,
                  "F",
                );

                pdf.setFontSize(12);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(...colors.white);
                pdf.text(stage.stage_name, margin, yPosition);
                yPosition += 10;

                pdf.setTextColor(...colors.black);
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(10);

                if (stage.description) {
                  const descLines = pdf.splitTextToSize(
                    stage.description,
                    pageWidth - margin * 2,
                  );
                  pdf.text(descLines, margin, yPosition);
                  yPosition += descLines.length * 4 + 3;
                }

                if (stage.customer_actions?.length > 0) {
                  pdf.setFont("helvetica", "bold");
                  pdf.text("Customer Actions:", margin, yPosition);
                  yPosition += 5;
                  pdf.setFont("helvetica", "normal");
                  stage.customer_actions.forEach((action: string) => {
                    addText(`• ${action}`, 10);
                  });
                }

                if (stage.emotions) {
                  pdf.setFont("helvetica", "bold");
                  pdf.text("Emotions:", margin, yPosition);
                  yPosition += 5;
                  pdf.setFont("helvetica", "normal");
                  addText(stage.emotions, 10);
                }

                if (stage.pain_points?.length > 0) {
                  pdf.setFont("helvetica", "bold");
                  pdf.text("Pain Points:", margin, yPosition);
                  yPosition += 5;
                  pdf.setFont("helvetica", "normal");
                  stage.pain_points.forEach((pain: string) => {
                    addText(`• ${pain}`, 10);
                  });
                }

                if (stage.opportunities?.length > 0) {
                  pdf.setFont("helvetica", "bold");
                  pdf.text("Opportunities:", margin, yPosition);
                  yPosition += 5;
                  pdf.setFont("helvetica", "normal");
                  stage.opportunities.forEach((opp: string) => {
                    addText(`• ${opp}`, 10);
                  });
                }

                yPosition += 5;
              });
            }
            break;

          case "stp":
            if (data.stp_analysis) {
              // Segmentation
              if (data.stp_analysis.segmentation?.segments?.length > 0) {
                addStyledHeader("Market Segmentation", 2);
                data.stp_analysis.segmentation.segments.forEach(
                  (segment: any) => {
                    addSection(
                      `${segment.segment_name} (${segment.percentage})`,
                      segment.characteristics,
                      colors.light,
                    );
                  },
                );
              }

              // Targeting
              if (data.stp_analysis.targeting) {
                checkPageBreak(30);
                addStyledHeader("Target Market", 2);

                if (data.stp_analysis.targeting.primary_target) {
                  addSection(
                    "Primary Target",
                    data.stp_analysis.targeting.primary_target.description,
                    [240, 253, 244],
                  );

                  if (
                    data.stp_analysis.targeting.primary_target.justification
                  ) {
                    addText(
                      `Justification: ${data.stp_analysis.targeting.primary_target.justification}`,
                      10,
                      colors.secondary,
                    );
                  }
                }

                if (data.stp_analysis.targeting.secondary_targets?.length > 0) {
                  addStyledHeader("Secondary Targets", 3);
                  data.stp_analysis.targeting.secondary_targets.forEach(
                    (target: any) => {
                      addText(`• ${target.name}: ${target.potential}`, 10);
                    },
                  );
                }
              }

              // Positioning
              if (data.stp_analysis.positioning) {
                checkPageBreak(30);
                addStyledHeader("Brand Positioning", 2);

                if (data.stp_analysis.positioning.positioning_statement) {
                  addSection(
                    "Positioning Statement",
                    data.stp_analysis.positioning.positioning_statement,
                    [235, 248, 255],
                  );
                }

                if (
                  data.stp_analysis.positioning.key_differentiators?.length > 0
                ) {
                  addStyledHeader("Key Differentiators", 3);
                  data.stp_analysis.positioning.key_differentiators.forEach(
                    (diff: string) => {
                      addText(`• ${diff}`, 10);
                    },
                  );
                }

                if (data.stp_analysis.positioning.value_proposition) {
                  addStyledHeader("Value Proposition", 3);
                  addText(data.stp_analysis.positioning.value_proposition, 11);
                }
              }
            }
            break;

          case "competition":
            if (data.competition_analysis) {
              if (data.competition_analysis.executive_summary) {
                addSection(
                  "Executive Summary",
                  data.competition_analysis.executive_summary,
                  colors.light,
                );
              }

              if (data.competition_analysis.feature_comparison?.length > 0) {
                checkPageBreak(30);
                addStyledHeader("Feature Comparison", 2);

                data.competition_analysis.feature_comparison.forEach(
                  (feature: any) => {
                    checkPageBreak(20);

                    pdf.setFontSize(11);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(feature.feature_name, margin, yPosition);
                    yPosition += 5;

                    pdf.setFontSize(10);
                    pdf.setFont("helvetica", "normal");

                    // Your product
                    pdf.text("Your Product:", margin + 5, yPosition);
                    yPosition += 5;
                    const yourLines = pdf.splitTextToSize(
                      feature.your_product.description,
                      pageWidth - margin * 2 - 10,
                    );
                    pdf.text(yourLines, margin + 10, yPosition);
                    yPosition += yourLines.length * 4 + 3;

                    // Competitors
                    feature.competitors.forEach((comp: any) => {
                      pdf.text(`${comp.name}:`, margin + 5, yPosition);
                      yPosition += 5;
                      const compLines = pdf.splitTextToSize(
                        comp.description,
                        pageWidth - margin * 2 - 10,
                      );
                      pdf.text(compLines, margin + 10, yPosition);
                      yPosition += compLines.length * 4 + 3;
                    });

                    yPosition += 5;
                  },
                );
              }

              if (
                data.competition_analysis.competitive_advantages?.length > 0
              ) {
                checkPageBreak(30);
                addStyledHeader("Competitive Advantages", 2);
                data.competition_analysis.competitive_advantages.forEach(
                  (adv: string) => {
                    addText(`• ${adv}`, 11);
                  },
                );
              }

              if (data.competition_analysis.areas_for_improvement?.length > 0) {
                checkPageBreak(30);
                addStyledHeader("Areas for Improvement", 2);
                data.competition_analysis.areas_for_improvement.forEach(
                  (area: string) => {
                    addText(`• ${area}`, 11);
                  },
                );
              }
            }
            break;

          default:
            // Generic handling for other analysis types
            addText(
              "Analysis data available - see platform for detailed visualization",
              12,
            );
            break;
        }
      } catch (error) {
        addSection(
          "Error",
          "Unable to process this analysis data. Please view on the platform for complete details.",
          colors.danger,
        );
      }
    });

    // Add page numbers to all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.secondary);
      pdf.text(
        `Generated by ReviewAI - Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
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
