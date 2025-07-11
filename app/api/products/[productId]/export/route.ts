import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

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

    console.log('Starting PDF generation with Puppeteer...');

    // Use Puppeteer's bundled Chromium with minimal configuration
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    console.log('Browser launched successfully');

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2, // For higher quality
    });

    // Get the host from the request
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Create a simple HTML page with the product data
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${product.name} - Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; padding: 30px; background: #5546e1; color: white; border-radius: 12px; }
            .title { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 18px; opacity: 0.9; }
            .info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .section h2 { color: #5546e1; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Product Analysis Report</div>
            <div class="subtitle">${product.name}</div>
          </div>

          <div class="info">
            <h3>Product Information</h3>
            <div class="grid">
              <div><strong>Product:</strong> ${product.name}</div>
              <div><strong>Brand:</strong> ${product.brand.name}</div>
              <div><strong>Reviews Analyzed:</strong> ${product.reviewsCount.toLocaleString()}</div>
              <div><strong>Generated:</strong> ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section">
            <h2>Analysis Summary</h2>
            <p>This report contains ${product.analyses.filter(a => a.status === 'completed').length} completed analyses for ${product.name}.</p>
            <p>The analysis covers various aspects including sentiment analysis, customer personas, competition analysis, and strategic recommendations.</p>
          </div>

          <div class="section">
            <h2>Completed Analyses</h2>
            <ul>
              ${product.analyses
                .filter(a => a.status === 'completed')
                .map(a => {
                  const titles = {
                    sentiment: 'Sentiment Analysis',
                    voice_of_customer: 'Voice of Customer',
                    four_w_matrix: '4W Matrix',
                    jtbd: 'Jobs to be Done',
                    stp: 'STP Analysis',
                    swot: 'SWOT Analysis',
                    customer_journey: 'Customer Journey',
                    personas: 'Customer Personas',
                    competition: 'Competition Analysis',
                    strategic_recommendations: 'Strategic Recommendations'
                  };
                  return `<li>${titles[a.type] || a.type}</li>`;
                })
                .join('')}
            </ul>
          </div>
        </body>
      </html>
    `;

    try {
      await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
      console.log('HTML content set successfully');
    } catch (navigationError) {
      console.error('Navigation error details:', {
        message: navigationError.message,
        stack: navigationError.stack
      });
      await browser.close();
      throw new Error(`Failed to load content: ${navigationError.message}`);
    }

    // Generate PDF with basic settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });

    console.log('PDF generated successfully, buffer size:', pdfBuffer.length);

    await browser.close();

    console.log('PDF generation completed successfully');

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