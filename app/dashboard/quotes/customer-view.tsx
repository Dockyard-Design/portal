"use client";

import { QuotesWorkspace, type QuotesWorkspaceProps } from "./quotes-workspace";

export function CustomerQuotesView(props: QuotesWorkspaceProps) {
  return <QuotesWorkspace {...props} role="customer" />;
}
