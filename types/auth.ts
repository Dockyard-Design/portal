export type UserRole = "admin" | "customer";

export interface CustomerUserMetadata extends Record<string, unknown> {
  role?: UserRole;
  roles?: UserRole[];
  admin?: boolean;
  customerId?: string;
  initialPasswordChangeRequired?: boolean;
  firstLoginAt?: string | null;
}
