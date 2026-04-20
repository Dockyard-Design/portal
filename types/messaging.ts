export type MessageThreadStatus = "open" | "closed" | "archived";

export interface MessageThread {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  subject: string;
  status: MessageThreadStatus;
  created_by: string;
  last_message_at: string;
  unread_admin: boolean;
  unread_customer: boolean;
  quote_id: string | null;
  invoice_id: string | null;
}

export interface Message {
  id: string;
  created_at: string;
  thread_id: string;
  sender_id: string;
  sender_role: "admin" | "customer" | "system";
  sender_name?: string | null;
  body: string;
  read_at: string | null;
}

export interface MessageThreadWithMessages extends MessageThread {
  customer_name: string;
  customer_email: string | null;
  messages: Message[];
}
