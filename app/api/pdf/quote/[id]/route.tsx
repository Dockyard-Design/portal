import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePDF } from "@/app/components/pdf/quote-template";
import { getQuote } from "@/app/actions/agency";
import { getCustomer } from "@/app/actions/kanban";
import { requireAdmin } from "@/lib/authz";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    void request;

    await requireAdmin();

    const { id } = await params;
    
    const quote = await getQuote(id);
    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    
    const customer = await getCustomer(quote.customer_id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    
    // Try to read logo PNG, fallback to null
    let logoBase64 = null;
    try {
      const logoPath = path.join(process.cwd(), "public", "pdf-logo.png");
      const logoBuffer = await fs.readFile(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch {
      // Logo doesn't exist, will use fallback
    }
    
    const pdfDocument = QuotePDF({ quote, customer, logoBase64 });
    const buffer = await renderToBuffer(pdfDocument);
    
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="quote-${id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating quote PDF:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
