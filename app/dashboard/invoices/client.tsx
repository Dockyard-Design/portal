"use client";

import { AdminInvoicesView } from "./admin-view";
import { CustomerInvoicesView } from "./customer-view";
import type { InvoicesWorkspaceProps } from "./invoices-workspace";

export default function InvoicesClient(props: InvoicesWorkspaceProps) {
  if (props.role === "customer") {
    return <CustomerInvoicesView {...props} />;
  }

  return <AdminInvoicesView {...props} />;
}
