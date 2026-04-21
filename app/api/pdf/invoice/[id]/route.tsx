import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/app/components/pdf/invoice-template";
import { getInvoice } from "@/app/actions/agency";
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
    
    const invoice = await getInvoice(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    
    const customer = await getCustomer(invoice.customer_id);
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
    
    const pdfDocument = InvoicePDF({ invoice, customer, logoBase64 });
    const buffer = await renderToBuffer(pdfDocument);
    
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
