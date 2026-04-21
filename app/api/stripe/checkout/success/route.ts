import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/api-keys";
import { getInvoicePaymentPlan, roundCurrency } from "@/lib/invoice-payments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!sessionId || !stripeSecretKey) {
    return NextResponse.redirect(new URL("/dashboard/invoices", request.url));
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    },
  );

  if (response.ok) {
    const session = (await response.json()) as {
      payment_status?: string;
      metadata?: { invoice_id?: string; target_paid?: string };
      client_reference_id?: string | null;
    };
    const invoiceId =
      session.metadata?.invoice_id || session.client_reference_id || null;

    if (session.payment_status === "paid" && invoiceId) {
      const { data: invoice } = await supabaseAdmin
        .from("invoices")
        .select("total, amount_paid, balance_due, status")
        .eq("id", invoiceId)
        .single();

      if (
        invoice &&
        invoice.status !== "paid" &&
        invoice.status !== "cancelled"
      ) {
        const plan = getInvoicePaymentPlan(invoice);
        const parsedTargetPaid = session.metadata?.target_paid
          ? Number(session.metadata.target_paid)
          : NaN;
        const targetPaid = Number.isFinite(parsedTargetPaid)
          ? parsedTargetPaid
          : plan.nextTargetPaid;
        const amountPaid = roundCurrency(
          Math.max(
            plan.amountPaid,
            Math.min(plan.total, Math.max(0, targetPaid)),
          ),
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

  return NextResponse.redirect(new URL("/dashboard/invoices", request.url));
}
