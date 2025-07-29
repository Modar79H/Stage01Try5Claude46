import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    console.log("Generating PDF-ready HTML...");

    // Helper function to safely ensure an array
    const ensureArray = (value: any): any[] => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object") {
        // If it's an object, try to extract an array from common properties
        if (value.data && Array.isArray(value.data)) return value.data;
        if (value.items && Array.isArray(value.items)) return value.items;
        if (value.results && Array.isArray(value.results)) return value.results;
        // If it's an object with multiple properties, return empty array to avoid errors
        return [];
      }
      return [];
    };

    // Helper function to safely render array content
    const safeArrayRender = (
      arr: any,
      renderer: (item: any, index?: number) => string,
    ): string => {
      try {
        return ensureArray(arr).map(renderer).join("");
      } catch (error) {
        console.error("Error rendering array:", error);
        return "<p>Error rendering content</p>";
      }
    };

    // Helper function to render analysis content based on type
    const renderAnalysisContent = (analysis: any) => {
      try {
        const { type, data } = analysis;

        switch (type) {
          case "product_description":
            const productDesc = data.product_description;
            return `
            <div class="analysis-content">
              <h3>Product Description</h3>
              <p><strong>Summary:</strong> ${productDesc.summary || "N/A"}</p>
              <div>
                <strong>Key Attributes:</strong>
                <ul>
                  ${ensureArray(productDesc.attributes)
                    .map((attr: string) => `<li>${attr}</li>`)
                    .join("")}
                </ul>
              </div>
              <div>
                <strong>Variations:</strong>
                <ul>
                  ${ensureArray(productDesc.variations)
                    .map((var_: string) => `<li>${var_}</li>`)
                    .join("")}
                </ul>
              </div>
            </div>
          `;

          case "sentiment":
            const sentiment = data.sentiment_analysis;
            return `
            <div class="analysis-content">
              <h3>Sentiment Analysis</h3>
              <div>
                <h4>Customer Likes</h4>
                ${ensureArray(sentiment?.customer_likes)
                  .map(
                    (like: any) => `
                  <div class="segment-item">
                    <strong>${like.theme}</strong> (${like.percentage})
                    <p>${like.summary}</p>
                    <p><strong>Importance:</strong> ${like.importance}</p>
                    <p><em>"${like.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Customer Dislikes</h4>
                ${ensureArray(sentiment?.customer_dislikes)
                  .map(
                    (dislike: any) => `
                  <div class="segment-item">
                    <strong>${dislike.theme}</strong> (${dislike.percentage})
                    <p>${dislike.summary}</p>
                    <p><strong>Importance:</strong> ${dislike.importance}</p>
                    <p><em>"${dislike.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;

          case "rating_analysis":
            const ratingData = data.rating_analysis;
            return `
            <div class="analysis-content">
              <h3>Rating Analysis</h3>
              <p><strong>Summary:</strong> ${ratingData?.insights?.summary || "N/A"}</p>
              <div>
                <h4>Rating Breakdown</h4>
                ${ensureArray(ratingData?.ratings)
                  .map(
                    (rating: any) => `
                  <div class="segment-item">
                    <strong>${rating.rating} Stars</strong> - ${rating.count} reviews (${rating.percentage})
                    <div>
                      <strong>Top Themes:</strong>
                      <ul>
                        ${ensureArray(rating.top_themes)
                          .map(
                            (theme: any) =>
                              `<li>${theme.theme} (${theme.frequency})</li>`,
                          )
                          .join("")}
                      </ul>
                    </div>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Key Insights</h4>
                <p><strong>Highest Rated Aspects:</strong></p>
                <ul>
                  ${ensureArray(ratingData?.insights?.highest_rated_aspects)
                    .map((aspect: string) => `<li>${aspect}</li>`)
                    .join("")}
                </ul>
                <p><strong>Lowest Rated Aspects:</strong></p>
                <ul>
                  ${ensureArray(ratingData?.insights?.lowest_rated_aspects)
                    .map((aspect: string) => `<li>${aspect}</li>`)
                    .join("")}
                </ul>
              </div>
            </div>
          `;

          case "voice_of_customer":
            const voc = data.voice_of_customer;
            return `
            <div class="analysis-content">
              <h3>Voice of Customer</h3>
              <div>
                <strong>Top Keywords:</strong>
                <ul>
                  ${ensureArray(voc?.keywords)
                    .map(
                      (keyword: any) =>
                        `<li><strong>${keyword.word}</strong> - ${keyword.frequency} mentions</li>`,
                    )
                    .join("")}
                </ul>
              </div>
            </div>
          `;

          case "four_w_matrix":
            const fourW = data.four_w_matrix;
            return `
            <div class="analysis-content">
              <h3>4W Matrix Analysis</h3>
              <div class="w-matrix-grid">
                <div>
                  <h4>Who (Target Customers)</h4>
                  ${ensureArray(fourW?.who)
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><strong>Importance:</strong> ${item.importance}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
                <div>
                  <h4>What (Use Cases)</h4>
                  ${(fourW?.what || [])
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><strong>Importance:</strong> ${item.importance}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
                <div>
                  <h4>When (Usage Occasions)</h4>
                  ${(fourW?.when || [])
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><strong>Importance:</strong> ${item.importance}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
                <div>
                  <h4>Where (Usage Locations)</h4>
                  ${(fourW?.where || [])
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><strong>Importance:</strong> ${item.importance}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            </div>
          `;

          case "jtbd":
            const jtbd = data.jtbd_analysis;
            return `
            <div class="analysis-content">
              <h3>Jobs to be Done Analysis</h3>
              <div>
                <h4>Functional Jobs</h4>
                ${(jtbd?.functional_jobs || [])
                  .map(
                    (job: any) => `
                  <div class="job-item">
                    <p><strong>Job Statement:</strong> ${job.job_statement}</p>
                    <p>${job.summary}</p>
                    <p><strong>Percentage:</strong> ${job.percentage}</p>
                    <p><strong>Importance:</strong> ${job.importance}</p>
                    <p><em>"${job.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Emotional Jobs</h4>
                ${(jtbd?.emotional_jobs || [])
                  .map(
                    (job: any) => `
                  <div class="job-item">
                    <p><strong>Job Statement:</strong> ${job.job_statement}</p>
                    <p>${job.summary}</p>
                    <p><strong>Percentage:</strong> ${job.percentage}</p>
                    <p><strong>Importance:</strong> ${job.importance}</p>
                    <p><em>"${job.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Social Jobs</h4>
                ${(jtbd?.social_jobs || [])
                  .map(
                    (job: any) => `
                  <div class="job-item">
                    <p><strong>Job Statement:</strong> ${job.job_statement}</p>
                    <p>${job.summary}</p>
                    <p><strong>Percentage:</strong> ${job.percentage}</p>
                    <p><strong>Importance:</strong> ${job.importance}</p>
                    <p><em>"${job.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;

          case "stp":
            const stp = data.stp_analysis;
            return `
            <div class="analysis-content">
              <h3>STP Analysis</h3>
              
              <div>
                <h4>Market Definition</h4>
                <p>${stp?.market_definition || "N/A"}</p>
              </div>
              
              <div>
                <h4>Segmentation</h4>
                ${(stp?.segmentation || [])
                  .map(
                    (seg: any) => `
                  <div class="segment-item">
                    <strong>${seg.segment}</strong> (${seg.percentage})
                    <p>${seg.description}</p>
                    
                    <div class="persona-details" style="margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                      <h5>Buyer Persona: ${seg.buyer_persona?.persona_name}</h5>
                      <p><em>${seg.buyer_persona?.persona_intro}</em></p>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                        <div>
                          <strong>Demographics:</strong>
                          <ul style="margin: 5px 0; padding-left: 15px; font-size: 13px;">
                            <li>Age: ${seg.buyer_persona?.demographics?.age}</li>
                            <li>Job: ${seg.buyer_persona?.demographics?.job_title}</li>
                            <li>Income: ${seg.buyer_persona?.demographics?.income_range}</li>
                            <li>Education: ${seg.buyer_persona?.demographics?.education_level}</li>
                          </ul>
                        </div>
                        <div>
                          <strong>Psychographics:</strong>
                          <ul style="margin: 5px 0; padding-left: 15px; font-size: 13px;">
                            <li>Lifestyle: ${seg.buyer_persona?.psychographics?.lifestyle}</li>
                            <li>Values: ${seg.buyer_persona?.psychographics?.core_values}</li>
                            <li>Interests: ${seg.buyer_persona?.psychographics?.hobbies_interests}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <p><strong>Opportunities:</strong> ${seg.opportunities}</p>
                    <p><strong>Challenges:</strong> ${seg.challenges}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              
              <div>
                <h4>Targeting Strategy</h4>
                <p><strong>Selected Segments:</strong> ${stp?.targeting_strategy?.selected_segments || "N/A"}</p>
                <p><strong>Buyer Personas:</strong> ${stp?.targeting_strategy?.buyer_personas || "N/A"}</p>
                <p><strong>Approach:</strong> ${stp?.targeting_strategy?.approach_description || "N/A"}</p>
              </div>
              
              <div>
                <h4>Positioning Strategy</h4>
                <p><strong>Positioning Statement:</strong> ${stp?.positioning_strategy?.positioning_statement || "N/A"}</p>
                <p><strong>Unique Value Proposition:</strong> ${stp?.positioning_strategy?.unique_value_proposition || "N/A"}</p>
                
                <div style="margin-top: 15px;">
                  <strong>Marketing Mix (4Ps):</strong>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li><strong>Product:</strong> ${stp?.positioning_strategy?.marketing_mix?.Product || "N/A"}</li>
                    <li><strong>Price:</strong> ${stp?.positioning_strategy?.marketing_mix?.Price || "N/A"}</li>
                    <li><strong>Place:</strong> ${stp?.positioning_strategy?.marketing_mix?.Place || "N/A"}</li>
                    <li><strong>Promotion:</strong> ${stp?.positioning_strategy?.marketing_mix?.Promotion || "N/A"}</li>
                  </ul>
                </div>
                
                <div style="margin-top: 15px;">
                  <strong>Messaging & Channels:</strong>
                  <p>${stp?.positioning_strategy?.messaging_channels || "N/A"}</p>
                </div>
              </div>
              
              <div>
                <h4>Implementation Recommendations</h4>
                <p><strong>Key Tactics:</strong> ${stp?.implementation_recommendations?.key_tactics || "N/A"}</p>
                <p><strong>Monitoring Suggestions:</strong> ${stp?.implementation_recommendations?.monitoring_suggestions || "N/A"}</p>
              </div>
            </div>
          `;

          case "swot":
            const swot = data.swot_analysis;
            return `
            <div class="analysis-content">
              <h3>SWOT Analysis</h3>
              <div class="swot-grid">
                <div>
                  <h4>Strengths</h4>
                  ${ensureArray(swot?.strengths)
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
                <div>
                  <h4>Weaknesses</h4>
                  ${(swot?.weaknesses || [])
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
                <div>
                  <h4>Opportunities</h4>
                  ${(swot?.opportunities || [])
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
                <div>
                  <h4>Threats</h4>
                  ${(swot?.threats || [])
                    .map(
                      (item: any) => `
                    <div class="segment-item">
                      <strong>${item.topic}</strong> (${item.percentage})
                      <p>${item.summary}</p>
                      <p><em>"${item.example_quote}"</em></p>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              </div>
            </div>
          `;

          case "customer_journey":
            const journey = data.customer_journey;
            return `
            <div class="analysis-content">
              <h3>Customer Journey</h3>
              <div>
                <h4>Awareness Stage</h4>
                ${(journey?.awareness || [])
                  .map(
                    (item: any) => `
                  <div class="journey-stage">
                    <strong>${item.topic}</strong> (${item.percentage})
                    <p>${item.summary}</p>
                    <p><em>"${item.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Consideration Stage</h4>
                ${(journey?.consideration || [])
                  .map(
                    (item: any) => `
                  <div class="journey-stage">
                    <strong>${item.topic}</strong> (${item.percentage})
                    <p>${item.summary}</p>
                    <p><em>"${item.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Purchase Stage</h4>
                ${(journey?.purchase || [])
                  .map(
                    (item: any) => `
                  <div class="journey-stage">
                    <strong>${item.topic}</strong> (${item.percentage})
                    <p>${item.summary}</p>
                    <p><em>"${item.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Delivery & Unboxing</h4>
                ${(journey?.delivery_unboxing || [])
                  .map(
                    (item: any) => `
                  <div class="journey-stage">
                    <strong>${item.topic}</strong> (${item.percentage})
                    <p>${item.summary}</p>
                    <p><em>"${item.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Usage Stage</h4>
                ${(journey?.usage || [])
                  .map(
                    (item: any) => `
                  <div class="journey-stage">
                    <strong>${item.topic}</strong> (${item.percentage})
                    <p>${item.summary}</p>
                    <p><em>"${item.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              <div>
                <h4>Post-Purchase</h4>
                ${(journey?.post_purchase || [])
                  .map(
                    (item: any) => `
                  <div class="journey-stage">
                    <strong>${item.topic}</strong> (${item.percentage})
                    <p>${item.summary}</p>
                    <p><em>"${item.example_quote}"</em></p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;

          case "strategic_recommendations":
            const recommendations = data.strategic_recommendations;
            return `
            <div class="analysis-content">
              <h3>Strategic Recommendations</h3>
              <p><strong>Executive Summary:</strong> ${recommendations?.executive_summary || "N/A"}</p>
              
              <div>
                <h4>Product Strategy</h4>
                ${(recommendations?.product_strategy || [])
                  .map(
                    (rec: any, index: number) => `
                  <div class="recommendation-item">
                    <h5>${index + 1}. ${rec.recommendation}</h5>
                    <p>${rec.introduction}</p>
                    <p><strong>Priority:</strong> ${rec.priority_level}</p>
                    <p><strong>Timeframe:</strong> ${rec.timeframe}</p>
                    <p><strong>Expected Impact:</strong> ${rec.expected_impact}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              
              <div>
                <h4>Marketing Strategy</h4>
                ${(recommendations?.marketing_strategy || [])
                  .map(
                    (rec: any, index: number) => `
                  <div class="recommendation-item">
                    <h5>${index + 1}. ${rec.recommendation}</h5>
                    <p>${rec.introduction}</p>
                    <p><strong>Priority:</strong> ${rec.priority_level}</p>
                    <p><strong>Timeframe:</strong> ${rec.timeframe}</p>
                    <p><strong>Expected Impact:</strong> ${rec.expected_impact}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              
              <div>
                <h4>Customer Experience</h4>
                ${(recommendations?.customer_experience || [])
                  .map(
                    (rec: any, index: number) => `
                  <div class="recommendation-item">
                    <h5>${index + 1}. ${rec.recommendation}</h5>
                    <p>${rec.introduction}</p>
                    <p><strong>Priority:</strong> ${rec.priority_level}</p>
                    <p><strong>Timeframe:</strong> ${rec.timeframe}</p>
                    <p><strong>Expected Impact:</strong> ${rec.expected_impact}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
              
              <div>
                <h4>Competitive Strategy</h4>
                ${(recommendations?.competitive_strategy || [])
                  .map(
                    (rec: any, index: number) => `
                  <div class="recommendation-item">
                    <h5>${index + 1}. ${rec.recommendation}</h5>
                    <p>${rec.introduction}</p>
                    <p><strong>Priority:</strong> ${rec.priority_level}</p>
                    <p><strong>Timeframe:</strong> ${rec.timeframe}</p>
                    <p><strong>Expected Impact:</strong> ${rec.expected_impact}</p>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `;

          case "smart_competition":
            const smartComp = data.smart_competition_analysis;
            if (!smartComp) {
              return `<div class="analysis-content"><p>Smart Competition Analysis data not available.</p></div>`;
            }

            return `
            <div class="analysis-content">
              <h3>Smart Competition Analysis</h3>
              
              <!-- Executive Summary -->
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h4>Executive Summary</h4>
                <p><strong>Competitive Position:</strong> ${smartComp.executive_summary?.competitive_position || "N/A"}</p>
                <p><strong>Key Advantages:</strong></p>
                <ul>
                  ${ensureArray(smartComp.executive_summary?.key_advantages)
                    .map((adv: string) => `<li>${adv}</li>`)
                    .join("")}
                </ul>
                <p><strong>Key Vulnerabilities:</strong></p>
                <ul>
                  ${ensureArray(
                    smartComp.executive_summary?.key_vulnerabilities,
                  )
                    .map((vul: string) => `<li>${vul}</li>`)
                    .join("")}
                </ul>
                <p><strong>Strategic Priorities:</strong></p>
                <ul>
                  ${ensureArray(
                    smartComp.executive_summary?.strategic_priorities,
                  )
                    .map((pri: string) => `<li>${pri}</li>`)
                    .join("")}
                </ul>
                <p><strong>Market Opportunity:</strong> ${smartComp.executive_summary?.market_opportunity || "N/A"}</p>
              </div>
              
              <!-- Product Attributes Comparison -->
              <div style="margin-bottom: 20px;">
                <h4>Product Attributes Comparison</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                  <thead>
                    <tr style="background: #e2e8f0;">
                      <th style="padding: 10px; text-align: left; border: 1px solid #cbd5e0;">Attribute</th>
                      <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">You Have</th>
                      <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">Competitors</th>
                      <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">Differentiation Score</th>
                      <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">Strategic Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ensureArray(
                      smartComp.product_attributes?.attribute_comparison,
                    )
                      .map(
                        (attr: any) => `
                      <tr>
                        <td style="padding: 10px; border: 1px solid #cbd5e0;">
                          <strong>${attr.attribute || "N/A"}</strong>
                          ${attr.explanation ? `<br><small style="color: #718096;">${attr.explanation}</small>` : ""}
                        </td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">${attr.you_have ? "✅" : "❌"}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">
                          ${Object.entries(attr.competitors || {})
                            .map(
                              ([name, has]) => `${name}: ${has ? "✅" : "❌"}`,
                            )
                            .join("<br>")}
                        </td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">${attr.differentiation_score || 0}</td>
                        <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">${attr.strategic_value || "N/A"}</td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
              
              <!-- SWOT Matrix Comparison -->
              <div style="margin-bottom: 20px;">
                <h4>SWOT Matrix Comparison</h4>
                
                <!-- Strengths -->
                <div style="margin-bottom: 15px;">
                  <h5>Strengths Analysis</h5>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                      <strong>Your Strengths:</strong>
                      <ul>
                        ${ensureArray(
                          smartComp.swot_matrix?.strength_comparison
                            ?.your_strengths,
                        )
                          .map(
                            (s: any) =>
                              `<li><strong>${typeof s === "string" ? s : s.strength || "N/A"}</strong>
                          ${typeof s === "object" && s.explanation ? `<br><small>${s.explanation}</small>` : ""}</li>`,
                          )
                          .join("")}
                      </ul>
                    </div>
                    <div>
                      <strong>Competitor Strengths:</strong>
                      ${Object.entries(
                        smartComp.swot_matrix?.strength_comparison
                          ?.competitor_strengths || {},
                      )
                        .map(
                          ([name, strengths]) => `
                        <div style="margin-bottom: 10px;">
                          <strong>${name}:</strong>
                          <ul>
                            ${ensureArray(strengths)
                              .map(
                                (s: any) =>
                                  `<li>${typeof s === "string" ? s : s.strength || "N/A"}
                              ${typeof s === "object" && s.explanation ? `<br><small>${s.explanation}</small>` : ""}</li>`,
                              )
                              .join("")}
                          </ul>
                        </div>
                      `,
                        )
                        .join("")}
                    </div>
                  </div>
                </div>
                
                <!-- Competitive Advantages -->
                <div style="margin-bottom: 15px;">
                  <strong>Competitive Advantages:</strong>
                  <ul>
                    ${ensureArray(
                      smartComp.swot_matrix?.strength_comparison
                        ?.competitive_advantages,
                    )
                      .map(
                        (adv: any) =>
                          `<li><strong>${typeof adv === "string" ? adv : adv.advantage || "N/A"}</strong>
                      ${typeof adv === "object" && adv.explanation ? `<br><small>${adv.explanation}</small>` : ""}</li>`,
                      )
                      .join("")}
                  </ul>
                </div>
                
                <!-- Opportunities and Threats -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                  <div style="background: #e6f4ff; padding: 15px; border-radius: 8px;">
                    <strong>Derived Opportunities:</strong>
                    <ul>
                      ${ensureArray(
                        smartComp.swot_matrix?.derived_opportunities,
                      )
                        .map(
                          (opp: any) =>
                            `<li>${typeof opp === "string" ? opp : opp.opportunity || "N/A"}
                        ${typeof opp === "object" && opp.explanation ? `<br><small>${opp.explanation}</small>` : ""}</li>`,
                        )
                        .join("")}
                    </ul>
                  </div>
                  <div style="background: #fff1f0; padding: 15px; border-radius: 8px;">
                    <strong>Derived Threats:</strong>
                    <ul>
                      ${ensureArray(smartComp.swot_matrix?.derived_threats)
                        .map(
                          (threat: any) =>
                            `<li>${typeof threat === "string" ? threat : threat.threat || "N/A"}
                        ${typeof threat === "object" && threat.explanation ? `<br><small>${threat.explanation}</small>` : ""}</li>`,
                        )
                        .join("")}
                    </ul>
                  </div>
                </div>
              </div>
              
              <!-- Customer Journey Analysis -->
              <div style="margin-bottom: 20px;">
                <h4>Customer Journey Friction Analysis</h4>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                  <thead>
                    <tr style="background: #e2e8f0;">
                      <th style="padding: 10px; text-align: left; border: 1px solid #cbd5e0;">Journey Stage</th>
                      <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">Your Friction Score</th>
                      <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">Competitor Scores</th>
                      <th style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">Winner</th>
                      <th style="padding: 10px; text-align: left; border: 1px solid #cbd5e0;">Analysis</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${["awareness", "purchase", "post_purchase"]
                      .map((stage) => {
                        const stageData = smartComp.journey_analysis?.[stage];
                        if (!stageData) return "";
                        return `
                        <tr>
                          <td style="padding: 10px; border: 1px solid #cbd5e0; text-transform: capitalize;"><strong>${stage.replace("_", " ")}</strong></td>
                          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">${stageData.your_friction_score || "N/A"}</td>
                          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">
                            ${Object.entries(stageData.competitor_scores || {})
                              .map(([name, score]) => `${name}: ${score}`)
                              .join("<br>")}
                          </td>
                          <td style="padding: 10px; text-align: center; border: 1px solid #cbd5e0;">${stageData.winner || "N/A"}</td>
                          <td style="padding: 10px; border: 1px solid #cbd5e0;">
                            <small>${stageData.gap_analysis || "N/A"}</small>
                            ${stageData.improvement_opportunity ? `<br><small><strong>Opportunity:</strong> ${stageData.improvement_opportunity}</small>` : ""}
                            ${stageData.competitive_advantage ? `<br><small><strong>Advantage:</strong> ${stageData.competitive_advantage}</small>` : ""}
                          </td>
                        </tr>
                      `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
              
              <!-- Segmentation Analysis -->
              <div style="margin-bottom: 20px;">
                <h4>Customer Segmentation Analysis</h4>
                <p><strong>Your Primary Segments:</strong></p>
                <ul>
                  ${ensureArray(
                    smartComp.segmentation_analysis?.your_primary_segments,
                  )
                    .map(
                      (seg: any) =>
                        `<li><strong>${typeof seg === "string" ? seg : seg.segment || "N/A"}</strong>
                    ${typeof seg === "object" && seg.explanation ? `<br><small>${seg.explanation}</small>` : ""}</li>`,
                    )
                    .join("")}
                </ul>
                
                <p><strong>Untapped Segments:</strong></p>
                <ul>
                  ${ensureArray(
                    smartComp.segmentation_analysis?.untapped_segments,
                  )
                    .map(
                      (seg: any) =>
                        `<li><strong>${typeof seg === "string" ? seg : seg.segment || "N/A"}</strong>
                    ${typeof seg === "object" && seg.explanation ? `<br><small>${seg.explanation}</small>` : ""}</li>`,
                    )
                    .join("")}
                </ul>
                
                <p><strong>Positioning Opportunity:</strong> ${smartComp.segmentation_analysis?.positioning_opportunity || "N/A"}</p>
              </div>
            </div>
          `;

          default:
            return `<div class="analysis-content"><p>Analysis data available in dashboard.</p></div>`;
        }
      } catch (error) {
        console.error(`Error rendering ${analysis.type} analysis:`, error);
        return `<div class="analysis-content"><p>Error rendering ${analysis.type} analysis. Please check the console for details.</p></div>`;
      }
    };

    // Create a complete HTML document that can be printed to PDF by the browser
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${product.name} - Analysis Report</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.6; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              padding: 40px 30px; 
              background: linear-gradient(135deg, #5546e1 0%, #7c3aed 100%); 
              color: white; 
              border-radius: 12px; 
            }
            .title { 
              font-size: 36px; 
              font-weight: bold; 
              margin-bottom: 10px; 
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .subtitle { 
              font-size: 20px; 
              opacity: 0.9; 
            }
            .info { 
              background: #f8fafc; 
              padding: 25px; 
              border-radius: 12px; 
              margin-bottom: 30px; 
              border-left: 4px solid #5546e1;
            }
            .section { 
              margin-bottom: 40px; 
              padding: 25px; 
              background: white; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
              border: 1px solid #e2e8f0;
            }
            .section h2 { 
              color: #5546e1; 
              border-bottom: 3px solid #e2e8f0; 
              padding-bottom: 12px; 
              margin-top: 0;
              font-size: 24px;
            }
            .section h3 {
              color: #4a5568;
              margin-top: 20px;
              margin-bottom: 15px;
              font-size: 20px;
            }
            .section h4 {
              color: #718096;
              margin-top: 15px;
              margin-bottom: 10px;
              font-size: 18px;
            }
            .section h5 {
              color: #a0aec0;
              margin-top: 10px;
              margin-bottom: 8px;
              font-size: 16px;
            }
            .grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 20px; 
              margin-top: 20px;
            }
            .analysis-item {
              background: #f7fafc;
              padding: 15px;
              border-radius: 8px;
              border-left: 3px solid #5546e1;
            }
            .analysis-type {
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 8px;
            }
            .analysis-summary {
              color: #4a5568;
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-top: 20px;
            }
            .stat-item {
              text-align: center;
              padding: 20px;
              background: white;
              border-radius: 8px;
              border: 2px solid #e2e8f0;
            }
            .stat-number {
              font-size: 28px;
              font-weight: bold;
              color: #5546e1;
            }
            .stat-label {
              color: #4a5568;
              margin-top: 5px;
            }
            .print-button {
              background: #5546e1;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin: 20px 0;
            }
            .print-button:hover {
              background: #4338ca;
            }
            .analysis-content {
              margin-top: 20px;
            }
            .analysis-content ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .analysis-content li {
              margin: 5px 0;
            }
            .w-matrix-grid, .swot-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
            }
            .job-item, .segment-item, .journey-stage, .persona-item, .recommendation-item {
              background: #f7fafc;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              border-left: 3px solid #5546e1;
            }
            .persona-details {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
              margin-top: 15px;
            }
            .toc {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .toc h3 {
              color: #5546e1;
              margin-top: 0;
            }
            .toc ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .toc li {
              margin: 5px 0;
            }
          </style>
          <script>
            function printReport() {
              window.print();
            }
          </script>
        </head>
        <body>
          <div class="no-print">
            <button class="print-button" onclick="printReport()">🖨️ Print to PDF</button>
          </div>

          <div class="header">
            <div class="title">Product Analysis Report</div>
            <div class="subtitle">${product.name}</div>
          </div>

          <div class="info">
            <h3>Product Information</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${product.name}</div>
                <div class="stat-label">Product Name</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${product.brand.name}</div>
                <div class="stat-label">Brand</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${product.reviewsCount?.toLocaleString() || "N/A"}</div>
                <div class="stat-label">Reviews Analyzed</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${new Date().toLocaleDateString()}</div>
                <div class="stat-label">Generated</div>
              </div>
            </div>
          </div>

          <div class="toc">
            <h3>Table of Contents</h3>
            <ol>
              ${product.analyses
                .filter((a) => a.status === "completed")
                .map((a) => {
                  const titles: Record<string, string> = {
                    product_description: "Product Description",
                    sentiment: "Sentiment Analysis",
                    voice_of_customer: "Voice of Customer",
                    rating_analysis: "Rating Analysis",
                    four_w_matrix: "4W Matrix",
                    jtbd: "Jobs to be Done",
                    stp: "STP Analysis",
                    swot: "SWOT Analysis",
                    customer_journey: "Customer Journey",
                    smart_competition: "Smart Competition Analysis",
                    strategic_recommendations: "Strategic Recommendations",
                  };
                  return `<li>${titles[a.type] || a.type}</li>`;
                })
                .join("")}
            </ol>
          </div>

          ${product.analyses
            .filter((a) => a.status === "completed")
            .map((a, index) => {
              const titles: Record<string, string> = {
                product_description: "Product Description",
                sentiment: "Sentiment Analysis",
                voice_of_customer: "Voice of Customer",
                rating_analysis: "Rating Analysis",
                four_w_matrix: "4W Matrix Analysis",
                jtbd: "Jobs to be Done Analysis",
                stp: "STP Analysis",
                swot: "SWOT Analysis",
                customer_journey: "Customer Journey Mapping",
                smart_competition: "Smart Competition Analysis",
                strategic_recommendations: "Strategic Recommendations",
              };

              return `
                <div class="section ${index > 0 ? "page-break" : ""}">
                  <h2>${titles[a.type] || a.type}</h2>
                  ${renderAnalysisContent(a)}
                </div>
              `;
            })
            .join("")}

          <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f7fafc; border-radius: 8px;">
            <p style="margin: 0; color: #4a5568;">Report generated on ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">© ${new Date().getFullYear()} Review Analysis Platform</p>
          </div>
        </body>
      </html>
    `;

    console.log("HTML report generated successfully");

    // Return HTML response that can be printed to PDF
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${product.name}-analysis-report.html"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
