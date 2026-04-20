"use client";

import { InvoicesWorkspace, type InvoicesWorkspaceProps } from "./invoices-workspace";

export function AdminInvoicesView(props: InvoicesWorkspaceProps) {
  return <InvoicesWorkspace {...props} role="admin" />;
}
