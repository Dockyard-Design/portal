import { brandTemplate } from "./brand";

export const documentTemplate = {
  defaultQuoteTerms: (splitPaymentTerms: string) =>
    [
      `This document is issued by ${brandTemplate.name} and is valid for 14 days from the date of issue unless otherwise stated.`,
      "Prices are shown in GBP and exclude any third-party costs, subscriptions, licences, hosting, stock assets, advertising spend, or payment processing fees unless they are explicitly listed as line items.",
      "Work begins after written acceptance and the start-of-works payment has cleared. Project timelines depend on timely client feedback, asset delivery, and approval at each agreed milestone.",
      `Changes outside the agreed scope may be quoted separately or billed at ${brandTemplate.name}'s prevailing day rate before the extra work begins.`,
      splitPaymentTerms,
      "Late payments may pause active work and access to deliverables until the account is brought up to date.",
      `All intellectual property created by ${brandTemplate.name} transfers to the customer only after the related invoice has been paid in full. ${brandTemplate.name} may retain portfolio rights unless agreed otherwise in writing.`,
      "The customer is responsible for checking factual content, legal copy, compliance obligations, and approvals before launch or publication.",
    ].join("\n\n"),
  legacyQuoteTermsMarker: "this quote is valid for 14 days from creation",
} as const;

