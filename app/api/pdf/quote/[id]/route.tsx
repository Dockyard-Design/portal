import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePDF } from "@/app/components/pdf/quote-template";
import { getQuote } from "@/app/actions/agency";
import { getCustomer } from "@/app/actions/kanban";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    void request;

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
        "Content-Disposition": `inline; filename="quote-${slugify(quote.title)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating quote PDF:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "document"
  );
}
