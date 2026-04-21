export type InvoicePaymentStage = "start" | "final" | "paid";

export interface InvoicePaymentSnapshot {
  total: number;
  amount_paid?: number | null;
  balance_due?: number | null;
}

export interface InvoicePaymentPlan {
  total: number;
  amountPaid: number;
  balanceDue: number;
  startPaymentAmount: number;
  finalPaymentAmount: number;
  nextPaymentAmount: number;
  nextTargetPaid: number;
  nextStage: InvoicePaymentStage;
}

export const SPLIT_PAYMENT_TERMS =
  "Payment is split into two equal stages: 50% is due at the start of works before delivery work begins, and the remaining 50% is due at completion before final handover, launch, file release, or transfer of intellectual property.";

export const DEFAULT_INVOICE_PAYMENT_INSTRUCTIONS =
  "This invoice is paid in two halves. Pay the first 50% to start works; the remaining 50% is due at completion before final handover.";

export function roundCurrency(value: number): number {
  return Number((Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function getDefaultInvoiceDueDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getInvoicePaymentPlan(invoice: InvoicePaymentSnapshot): InvoicePaymentPlan {
  const total = roundCurrency(Math.max(0, Number(invoice.total || 0)));
  const amountPaid = roundCurrency(
    Math.min(total, Math.max(0, Number(invoice.amount_paid || 0)))
  );
  const startPaymentAmount = roundCurrency(total / 2);
  const finalPaymentAmount = roundCurrency(total - startPaymentAmount);
  const balanceDue = roundCurrency(total - amountPaid);

  if (balanceDue <= 0) {
    return {
      total,
      amountPaid,
      balanceDue: 0,
      startPaymentAmount,
      finalPaymentAmount,
      nextPaymentAmount: 0,
      nextTargetPaid: total,
      nextStage: "paid",
    };
  }

  const nextTargetPaid =
    amountPaid < startPaymentAmount ? startPaymentAmount : total;
  const nextPaymentAmount = roundCurrency(nextTargetPaid - amountPaid);

  return {
    total,
    amountPaid,
    balanceDue,
    startPaymentAmount,
    finalPaymentAmount,
    nextPaymentAmount,
    nextTargetPaid,
    nextStage: amountPaid < startPaymentAmount ? "start" : "final",
  };
}

export function getInvoicePaymentStageLabel(stage: InvoicePaymentStage): string {
  if (stage === "start") return "Start of works payment";
  if (stage === "final") return "Completion payment";
  return "Paid";
}
