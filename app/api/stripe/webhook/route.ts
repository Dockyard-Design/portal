import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/api-keys";
import { getInvoicePaymentPlan, roundCurrency } from "@/lib/invoice-payments";

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const parts = new Map(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value] as const;
    })
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature || !verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as {
    type?: string;
    data?: {
      object?: {
        payment_status?: string;
        metadata?: { invoice_id?: string; target_paid?: string };
        client_reference_id?: string | null;
      };
    };
  };

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const invoiceId = session?.metadata?.invoice_id || session?.client_reference_id;

    if (session?.payment_status === "paid" && invoiceId) {
      const { data: invoice } = await supabaseAdmin
        .from("invoices")
        .select("total, amount_paid, balance_due, status")
        .eq("id", invoiceId)
        .single();

      if (invoice && invoice.status !== "paid" && invoice.status !== "cancelled") {
        const plan = getInvoicePaymentPlan(invoice);
        const parsedTargetPaid = session.metadata?.target_paid
          ? Number(session.metadata.target_paid)
          : NaN;
        const targetPaid = Number.isFinite(parsedTargetPaid)
          ? parsedTargetPaid
          : plan.nextTargetPaid;
        const amountPaid = roundCurrency(
          Math.max(plan.amountPaid, Math.min(plan.total, Math.max(0, targetPaid)))
        );
        const balanceDue = roundCurrency(plan.total - amountPaid);
        const paidInFull = balanceDue <= 0;

        await supabaseAdmin
          .from("invoices")
          .update({
            status: paidInFull ? "paid" : "partial",
            amount_paid: amountPaid,
            balance_due: balanceDue,
            paid_at: paidInFull ? new Date().toISOString() : null,
          })
          .eq("id", invoiceId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
