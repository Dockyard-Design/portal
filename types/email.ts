export interface EmailAttachment {
  filename: string;
  content: string;
  content_type: string;
}

export interface SendEmailInput {
  to: string[];
  from: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

export interface FormSubmissionEmailInput {
  formName: string;
  submittedAt: string;
  details: Record<string, string | number | boolean | null | undefined>;
}

export interface DocumentEmailInput {
  documentType: "quote" | "invoice";
  recipientEmail: string;
  recipientName: string;
  title: string;
  total: number;
  currency: string;
  pdfUrl: string;
}

export interface CustomerWelcomeEmailInput {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  password: string;
  signInUrl: string;
}

export interface CustomerMessageEmailInput {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
}

export interface SupportMessageEmailInput {
  customerName: string;
  customerEmail: string | null;
  subject: string;
  body: string;
}
