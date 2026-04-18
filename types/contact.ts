export type ContactStatus = "new" | "read" | "replied" | "closed";

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactSummary {
  new: number;
  read: number;
  replied: number;
  closed: number;
}
