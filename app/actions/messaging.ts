"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/api-keys";
import { getCurrentUserAccess, requireUser } from "@/lib/authz";
import type {
  Message,
  MessageThread,
  MessageThreadStatus,
  MessageThreadWithMessages,
} from "@/types/messaging";

const AUTO_REPLY =
  "Thanks for your message. A member of the Dockyard team will respond within 24 hours.";

export async function getMessageThreads(): Promise<MessageThreadWithMessages[]> {
  const access = await getCurrentUserAccess();

  let threadQuery = supabaseAdmin
    .from("message_threads")
    .select("*, customers(name, email)")
    .order("last_message_at", { ascending: false });

  if (access.role === "customer") {
    threadQuery = threadQuery.eq("customer_id", access.customerId);
  }

  const { data: threadRows, error } = await threadQuery;
  if (error) throw new Error("Failed to load message threads");

  const threads = (threadRows || []) as Array<MessageThread & {
    customers: { name: string; email: string | null } | null;
  }>;
  const threadIds = threads.map((thread) => thread.id);

  const messagesResult = threadIds.length > 0
    ? await supabaseAdmin
        .from("messages")
        .select("*")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true })
    : { data: [] as Message[], error: null };

  if (messagesResult.error) throw new Error("Failed to load messages");

  const messages = (messagesResult.data || []) as Message[];

  return threads.map((thread) => ({
    ...thread,
    customer_name: thread.customers?.name ?? "Unknown customer",
    customer_email: thread.customers?.email ?? null,
    messages: messages.filter((message) => message.thread_id === thread.id),
  }));
}

export async function createMessageThread(input: {
  customerId: string;
  subject: string;
  body: string;
}): Promise<void> {
  const access = await getCurrentUserAccess();
  const userId = access.userId;
  const customerId = access.role === "customer" ? access.customerId : input.customerId;

  if (!customerId) throw new Error("Select a customer before starting a thread");

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("message_threads")
    .insert({
      customer_id: customerId,
      subject: input.subject,
      created_by: userId,
      unread_admin: access.role === "customer",
      unread_customer: access.role === "admin",
    })
    .select()
    .single();

  if (threadError || !thread) throw new Error("Failed to create thread");

  const messages: Array<{
    thread_id: string;
    sender_id: string;
    sender_role: "admin" | "customer" | "system";
    body: string;
  }> = [
    {
      thread_id: thread.id,
      sender_id: userId,
      sender_role: access.role,
      body: input.body,
    },
  ];

  if (access.role === "customer") {
    messages.push({
      thread_id: thread.id,
      sender_id: "system",
      sender_role: "system",
      body: AUTO_REPLY,
    });
  }

  const { error: messageError } = await supabaseAdmin.from("messages").insert(messages);
  if (messageError) throw new Error("Failed to create message");

  revalidatePath("/dashboard/messages");
}

export async function replyToThread(threadId: string, body: string): Promise<void> {
  const access = await getCurrentUserAccess();
  await assertThreadAccess(threadId, access.role, access.customerId);

  const { error } = await supabaseAdmin.from("messages").insert({
    thread_id: threadId,
    sender_id: access.userId,
    sender_role: access.role,
    body,
  });

  if (error) throw new Error("Failed to send reply");

  await supabaseAdmin
    .from("message_threads")
    .update({
      last_message_at: new Date().toISOString(),
      unread_admin: access.role === "customer",
      unread_customer: access.role === "admin",
    })
    .eq("id", threadId);

  revalidatePath("/dashboard/messages");
}

export async function updateThreadStatus(
  threadId: string,
  status: MessageThreadStatus
): Promise<void> {
  await requireUser();
  const access = await getCurrentUserAccess();
  await assertThreadAccess(threadId, access.role, access.customerId);

  const { error } = await supabaseAdmin
    .from("message_threads")
    .update({ status })
    .eq("id", threadId);

  if (error) throw new Error("Failed to update thread");
  revalidatePath("/dashboard/messages");
}

export async function markThreadRead(threadId: string): Promise<void> {
  const access = await getCurrentUserAccess();
  await assertThreadAccess(threadId, access.role, access.customerId);

  const update = access.role === "admin"
    ? { unread_admin: false }
    : { unread_customer: false };

  const { error } = await supabaseAdmin
    .from("message_threads")
    .update(update)
    .eq("id", threadId);

  if (error) throw new Error("Failed to mark thread read");
  revalidatePath("/dashboard/messages");
}

async function assertThreadAccess(
  threadId: string,
  role: "admin" | "customer",
  customerId: string | null
): Promise<void> {
  if (role === "admin") return;

  const { data, error } = await supabaseAdmin
    .from("message_threads")
    .select("customer_id")
    .eq("id", threadId)
    .single();

  if (error || data?.customer_id !== customerId) {
    throw new Error("Forbidden");
  }
}
