"use client";

import { AdminQuotesView } from "./admin-view";
import { CustomerQuotesView } from "./customer-view";
import type { QuotesWorkspaceProps } from "./quotes-workspace";

export default function QuotesClient(props: QuotesWorkspaceProps) {
  if (props.role === "customer") {
    return <CustomerQuotesView {...props} />;
  }

  return <AdminQuotesView {...props} />;
}
