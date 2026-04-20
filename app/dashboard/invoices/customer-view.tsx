"use client";

import { InvoicesWorkspace, type InvoicesWorkspaceProps } from "./invoices-workspace";

export function CustomerInvoicesView(props: InvoicesWorkspaceProps) {
  return <InvoicesWorkspace {...props} role="customer" />;
}
