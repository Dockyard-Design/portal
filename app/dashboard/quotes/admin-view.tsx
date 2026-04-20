"use client";

import { QuotesWorkspace, type QuotesWorkspaceProps } from "./quotes-workspace";

export function AdminQuotesView(props: QuotesWorkspaceProps) {
  return <QuotesWorkspace {...props} role="admin" />;
}
