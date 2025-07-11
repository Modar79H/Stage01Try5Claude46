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
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
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

    try {
      // Navigate to the print-friendly version of the product page
      const printUrl = `${baseUrl}/products/${productId}/print?session=${encodeURIComponent(JSON.stringify(session))}`;

      console.log('Navigating to:', printUrl);

      const response = await page.goto(printUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      if (!response) {
        throw new Error('Failed to get response from page');
      }

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      console.log('Page loaded successfully, status:', response.status());

      // Wait a bit for initial content to load
      await page.waitForTimeout(2000);

      console.log('Content loaded, generating PDF...');
    } catch (navigationError) {
      console.error('Navigation error details:', {
        message: navigationError.message,
        stack: navigationError.stack,
        url: `${baseUrl}/products/${productId}/print`
      });
      await browser.close();
      throw new Error(`Failed to load page: ${navigationError.message}`);
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