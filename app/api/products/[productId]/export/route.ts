
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

    console.log('Generating PDF-ready HTML...');

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
              margin-top: 0;
              font-size: 20px;
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
                <div class="stat-number">${product.reviewsCount?.toLocaleString() || 'N/A'}</div>
                <div class="stat-label">Reviews Analyzed</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${new Date().toLocaleDateString()}</div>
                <div class="stat-label">Generated</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📊 Analysis Overview</h2>
            <p>This comprehensive report contains <strong>${product.analyses.filter(a => a.status === 'completed').length} completed analyses</strong> for ${product.name}.</p>
            <p>Our AI-powered analysis covers various aspects including sentiment analysis, customer personas, competition analysis, and strategic recommendations to provide actionable insights for your business.</p>
          </div>

          <div class="section">
            <h2>✅ Completed Analyses</h2>
            <div class="grid">
              ${product.analyses
                .filter(a => a.status === 'completed')
                .map(a => {
                  const analysisInfo = {
                    sentiment: { title: 'Sentiment Analysis', desc: 'Customer emotion and satisfaction insights' },
                    voice_of_customer: { title: 'Voice of Customer', desc: 'Direct customer feedback themes' },
                    four_w_matrix: { title: '4W Matrix', desc: 'Who, What, When, Where analysis' },
                    jtbd: { title: 'Jobs to be Done', desc: 'Customer motivations and use cases' },
                    stp: { title: 'STP Analysis', desc: 'Segmentation, Targeting, Positioning' },
                    swot: { title: 'SWOT Analysis', desc: 'Strengths, Weaknesses, Opportunities, Threats' },
                    customer_journey: { title: 'Customer Journey', desc: 'End-to-end customer experience mapping' },
                    personas: { title: 'Customer Personas', desc: 'Detailed customer archetypes' },
                    competition: { title: 'Competition Analysis', desc: 'Competitive landscape insights' },
                    strategic_recommendations: { title: 'Strategic Recommendations', desc: 'Actionable business strategies' }
                  };
                  const info = analysisInfo[a.type] || { title: a.type, desc: 'Analysis completed' };
                  return `
                    <div class="analysis-item">
                      <div class="analysis-type">${info.title}</div>
                      <div class="analysis-summary">${info.desc}</div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>

          <div class="section">
            <h2>🎯 Key Insights Summary</h2>
            <p>Based on the analysis of ${product.reviewsCount?.toLocaleString() || 'multiple'} customer reviews, this report provides:</p>
            <ul style="margin-top: 15px; padding-left: 20px;">
              <li>Comprehensive sentiment analysis revealing customer satisfaction patterns</li>
              <li>Detailed customer personas to guide marketing and product decisions</li>
              <li>Competitive positioning insights for strategic advantage</li>
              <li>Actionable recommendations for business growth</li>
              <li>Customer journey mapping for experience optimization</li>
            </ul>
          </div>

          <div class="section page-break">
            <h2>📈 Next Steps</h2>
            <p>To access the detailed analysis data and interactive visualizations:</p>
            <ol style="margin-top: 15px; padding-left: 20px;">
              <li>Return to your product dashboard</li>
              <li>Click on each analysis tab to view detailed insights</li>
              <li>Use the chat feature for specific questions about the data</li>
              <li>Export individual analysis sections as needed</li>
            </ol>
          </div>

          <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f7fafc; border-radius: 8px;">
            <p style="margin: 0; color: #4a5568;">Report generated on ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0 0 0; color: #4a5568; font-size: 14px;">© ${new Date().getFullYear()} Review Analysis Platform</p>
          </div>
        </body>
      </html>
    `;

    console.log('HTML report generated successfully');

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
