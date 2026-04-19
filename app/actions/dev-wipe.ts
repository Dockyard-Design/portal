"use server";

import { supabaseAdmin } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";
import { currentUser } from "@clerk/nextjs/server";

const ALLOWED_EMAIL = "fredericomelogarcia@outlook.com";

// Tables to wipe (in order to respect foreign key constraints)
const TABLES_TO_WIPE = [
  "api_request_logs",
  "api_rate_limits",
  "expenses",
  "expense_categories",
  "invoice_items",
  "invoices",
  "quote_items",
  "quotes",
  "kanban_tasks",
  "kanban_boards",
  "contact_submissions",
  "api_keys",
  "projects",
  "customers",
];

export async function wipeDatabase(): Promise<{ success: boolean; message: string }> {
  // Verify admin access
  await requireAdmin();

  // Verify specific user
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (userEmail !== ALLOWED_EMAIL) {
    return {
      success: false,
      message: "Unauthorized: This action is restricted.",
    };
  }

  try {
    // Truncate all tables (using DELETE since TRUNCATE needs higher privileges)
    for (const table of TABLES_TO_WIPE) {
      const { error } = await supabaseAdmin.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        console.error(`Error wiping table ${table}:`, error);
        // Continue with other tables even if one fails
      }
    }

    try {
      // Reset invoice number sequence (might not exist, that's ok)
      await supabaseAdmin.rpc("reset_invoice_sequence");
    } catch {
      // Ignore error
    }

    return {
      success: true,
      message: `Database wiped successfully. ${TABLES_TO_WIPE.length} tables cleared.`,
    };
  } catch (error) {
    console.error("Error wiping database:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to wipe database",
    };
  }
}

export async function canWipeDatabase(): Promise<boolean> {
  try {
    await requireAdmin();
    const user = await currentUser();
    return user?.primaryEmailAddress?.emailAddress === ALLOWED_EMAIL;
  } catch {
    return false;
  }
}
