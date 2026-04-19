"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createMessageThread,
  markThreadRead,
  replyToThread,
  updateThreadStatus,
} from "@/app/actions/messaging";
import type { Customer } from "@/types/kanban";
import type { MessageThreadStatus, MessageThreadWithMessages } from "@/types/messaging";
import type { UserRole } from "@/types/auth";
import { toast } from "sonner";

export function MessagesClient({
  threads,
  customers,
  role,
  customerId,
}: {
  threads: MessageThreadWithMessages[];
  customers: Customer[];
  role: UserRole;
  customerId: string | null;
}) {
  const [selectedThreadId, setSelectedThreadId] = useState(threads[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? "");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0];

  const createThread = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (role === "admin" && !selectedCustomerId) {
      toast.error("Select a customer");
      return;
    }

    setIsSaving(true);
    try {
      await createMessageThread({
        customerId: selectedCustomerId,
        subject,
        body,
      });
      toast.success("Thread created");
      setSubject("");
      setBody("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create thread");
    } finally {
      setIsSaving(false);
    }
  };

  const sendReply = async () => {
    if (!selectedThread || !reply.trim()) return;
    setIsSaving(true);
    try {
      await replyToThread(selectedThread.id, reply);
      toast.success("Reply sent");
      setReply("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (status: MessageThreadStatus) => {
    if (!selectedThread) return;
    await updateThreadStatus(selectedThread.id, status);
    router.refresh();
  };

  const markRead = async () => {
    if (!selectedThread) return;
    await markThreadRead(selectedThread.id);
    router.refresh();
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>New Thread</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {role === "admin" && (
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedCustomerId} onValueChange={(value) => setSelectedCustomerId(value ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Input placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
            <Textarea placeholder="Message" value={body} onChange={(event) => setBody(event.target.value)} />
            <Button onClick={() => void createThread()} disabled={isSaving} className="w-full">
              Start Thread
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {threads.map((thread) => {
              const unread = role === "admin" ? thread.unread_admin : thread.unread_customer;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className="w-full rounded-lg border border-border/40 p-3 text-left transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{thread.subject}</span>
                    {unread && <Badge>Unread</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{thread.customer_name}</p>
                </button>
              );
            })}
            {threads.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No message threads yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{selectedThread?.subject ?? "Select a thread"}</CardTitle>
              {selectedThread && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedThread.customer_name}
                  {selectedThread.customer_email ? ` · ${selectedThread.customer_email}` : ""}
                </p>
              )}
            </div>
            {selectedThread && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void markRead()}>
                  Mark Read
                </Button>
                <Select value={selectedThread.status} onValueChange={(value) => void changeStatus(value as MessageThreadStatus)}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedThread ? (
            <>
              <div className="space-y-3">
                {selectedThread.messages.map((message) => (
                  <div key={message.id} className="rounded-lg border border-border/40 bg-secondary/20 p-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{message.sender_role === "system" ? "Auto-reply" : message.sender_role === "admin" ? "Dockyard" : selectedThread.customer_name}</span>
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border/40 pt-4">
                <Label>Reply</Label>
                <Textarea value={reply} onChange={(event) => setReply(event.target.value)} />
                <Button onClick={() => void sendReply()} disabled={isSaving || !reply.trim()}>
                  Send Reply
                </Button>
              </div>
            </>
          ) : (
            <p className="py-20 text-center text-sm text-muted-foreground">Select or create a thread.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
