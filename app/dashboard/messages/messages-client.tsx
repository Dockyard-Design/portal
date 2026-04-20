"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CheckCheck,
  Inbox,
  MailPlus,
  MessageSquareText,
  Reply,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  createMessageThread,
  markThreadRead,
  replyToThread,
  updateThreadStatus,
} from "@/app/actions/messaging";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import type { Customer } from "@/types/kanban";
import type {
  MessageThreadStatus,
  MessageThreadWithMessages,
} from "@/types/messaging";

type ThreadFilter = "all" | "unread" | "open" | "closed";
type VisibleThreadStatus = Exclude<MessageThreadStatus, "archived">;
type VisibleThread = MessageThreadWithMessages & { status: VisibleThreadStatus };

const statusTone: Record<VisibleThreadStatus, string> = {
  open: "border-primary/30 bg-primary/10 text-primary",
  closed: "border-foreground/15 bg-foreground/10 text-foreground",
};

const statusLabel: Record<VisibleThreadStatus, string> = {
  open: "Open",
  closed: "Closed",
};

function isVisibleThread(thread: MessageThreadWithMessages): thread is VisibleThread {
  return thread.status !== "archived";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DC";
}

function getSenderLabel(
  senderRole: "admin" | "customer" | "system",
  customerName: string,
  senderName?: string | null
) {
  if (senderRole === "system") return "Auto-reply";
  if (senderRole === "admin") return senderName || "Dockyard";
  return customerName;
}

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
  const [selectedThreadId, setSelectedThreadId] = useState(
    threads.find(isVisibleThread)?.id ?? ""
  );
  const [subject, setSubject] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? "");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ThreadFilter>("all");
  const [localThreads, setLocalThreads] = useState(threads);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  const getUnread = useCallback(
    (thread: MessageThreadWithMessages) =>
      role === "admin" ? thread.unread_admin : thread.unread_customer,
    [role]
  );

  const visibleThreads = useMemo(
    () => localThreads.filter(isVisibleThread),
    [localThreads]
  );

  const metrics = useMemo(() => {
    const unread = visibleThreads.filter(getUnread).length;
    const open = visibleThreads.filter((thread) => thread.status === "open").length;
    const closed = visibleThreads.filter((thread) => thread.status === "closed").length;
    const totalMessages = visibleThreads.reduce(
      (total, thread) => total + thread.messages.length,
      0
    );

    return { unread, open, closed, totalMessages };
  }, [getUnread, visibleThreads]);

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleThreads.filter((thread) => {
      const latestMessage = thread.messages.at(-1)?.body ?? "";
      const matchesQuery =
        !normalizedQuery ||
        thread.subject.toLowerCase().includes(normalizedQuery) ||
        thread.customer_name.toLowerCase().includes(normalizedQuery) ||
        (thread.customer_email ?? "").toLowerCase().includes(normalizedQuery) ||
        latestMessage.toLowerCase().includes(normalizedQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && getUnread(thread)) ||
        thread.status === filter;

      return matchesQuery && matchesFilter;
    });
  }, [filter, getUnread, query, visibleThreads]);

  const selectedThread =
    visibleThreads.find((thread) => thread.id === selectedThreadId) ??
    filteredThreads[0] ??
    visibleThreads[0];
  const selectedUnread = selectedThread ? getUnread(selectedThread) : false;
  const latestMessage = selectedThread?.messages.at(-1);
  const selectedMessageCount = selectedThread?.messages.length ?? 0;

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;

    messageList.scrollTop = messageList.scrollHeight;
  }, [selectedThread?.id, selectedMessageCount]);

  const notifyMessagesChanged = () => {
    window.dispatchEvent(new CustomEvent("messages:changed"));
  };

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
      const createdThread = await createMessageThread({
        customerId: selectedCustomerId,
        subject,
        body,
      });
      setLocalThreads((currentThreads) => [createdThread, ...currentThreads]);
      setSelectedThreadId(createdThread.id);
      toast.success("Thread created");
      setSubject("");
      setBody("");
      setNewThreadOpen(false);
      notifyMessagesChanged();
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
      const result = await replyToThread(selectedThread.id, reply);
      setLocalThreads((currentThreads) =>
        currentThreads
          .map((thread) =>
            thread.id === selectedThread.id
              ? {
                  ...thread,
                  ...result.thread,
                  messages: [...thread.messages, result.message],
                }
              : thread
          )
          .sort(
            (a, b) =>
              new Date(b.last_message_at).getTime() -
              new Date(a.last_message_at).getTime()
          )
      );
      toast.success("Reply sent");
      setReply("");
      notifyMessagesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!isSaving && reply.trim()) {
      void sendReply();
    }
  };

  const handleNewThreadKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (!isSaving && subject.trim() && body.trim()) {
      void createThread();
    }
  };

  const changeStatus = async (status: VisibleThreadStatus) => {
    if (!selectedThread) return;
    try {
      await updateThreadStatus(selectedThread.id, status);
      setLocalThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.id === selectedThread.id ? { ...thread, status } : thread
        )
      );
      toast.success(`Thread marked ${statusLabel[status].toLowerCase()}`);
      notifyMessagesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update thread");
    }
  };

  const markRead = async () => {
    if (!selectedThread) return;
    try {
      await markThreadRead(selectedThread.id);
      setLocalThreads((currentThreads) =>
        currentThreads.map((thread) =>
          thread.id === selectedThread.id
            ? role === "admin"
              ? { ...thread, unread_admin: false }
              : { ...thread, unread_customer: false }
            : thread
        )
      );
      toast.success("Thread marked read");
      notifyMessagesChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark thread read");
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] w-[calc(100%+3rem)] min-w-0 flex-col gap-4 overflow-hidden p-4">
      <Card className="shrink-0 border-border/50 bg-card/80 py-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageSquareText className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-semibold tracking-tight">
                Messaging Centre
              </h1>
              <p className="text-sm text-muted-foreground">
                Inbox, replies, and customer thread status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{visibleThreads.length} threads</Badge>
            <Badge variant={metrics.unread > 0 ? "default" : "outline"}>
              {metrics.unread} unread
            </Badge>
              <Badge variant="outline">{metrics.open} open</Badge>
              <Badge variant="outline">{metrics.closed} closed</Badge>
            <Button onClick={() => setNewThreadOpen(true)}>
              <MailPlus data-icon="inline-start" />
              New Thread
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New thread</DialogTitle>
            <DialogDescription>
              Start a new customer conversation. Press Enter to send, or Shift+Enter for a new line.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {role === "admin" && (
              <div className="flex flex-col gap-2">
                <Label>Customer</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={(value) => setSelectedCustomerId(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>Subject</Label>
              <InputGroup>
                <InputGroupInput
                  placeholder="Quote follow-up, launch notes, support request..."
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                />
              </InputGroup>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Message</Label>
              <InputGroup className="min-h-40">
                <InputGroupTextarea
                  placeholder="Write the first message..."
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={handleNewThreadKeyDown}
                />
              </InputGroup>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewThreadOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void createThread()}
              disabled={isSaving || !subject.trim() || !body.trim()}
            >
                <MailPlus data-icon="inline-start" />
                Start Thread
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_280px] xl:overflow-hidden">
        <Card className="min-h-[320px] border-border/50 bg-card/80 py-0 shadow-sm lg:min-h-0">
          <CardHeader className="gap-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Inbox</CardTitle>
                <CardDescription>
                  {filteredThreads.length} of {visibleThreads.length} threads
                </CardDescription>
              </div>
            </div>
            <InputGroup>
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search subject, customer, or message"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </InputGroup>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as ThreadFilter)}
            >
              <TabsList className="grid h-auto w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-2 pb-4">
            {filteredThreads.map((thread) => {
              const unread = getUnread(thread);
              const latest = thread.messages.at(-1);
              const selected = selectedThread?.id === thread.id;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={cn(
                    "group w-full rounded-lg border p-3 text-left transition-all hover:border-primary/40 hover:bg-secondary/40",
                    selected
                      ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/5"
                      : "border-border/40 bg-background/35"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 rounded-lg">
                      <AvatarFallback
                        className={cn(
                          "rounded-lg font-heading font-semibold",
                          unread
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        )}
                      >
                        {getInitials(thread.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">{thread.subject}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatShortDate(thread.last_message_at)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="truncate text-xs text-muted-foreground">
                          {thread.customer_name}
                          {thread.customer_email ? ` · ${thread.customer_email}` : ""}
                        </p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {latest?.body ?? "No messages yet."}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("capitalize", statusTone[thread.status])}
                        >
                          {statusLabel[thread.status]}
                        </Badge>
                        {unread && <Badge>Unread</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {thread.messages.length} messages
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredThreads.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-background/30 p-8 text-center">
                <Inbox className="size-9 text-muted-foreground" />
                <div>
                  <p className="font-medium">No matching threads</p>
                  <p className="text-sm text-muted-foreground">
                    Adjust the search or filter.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-[520px] min-w-0 flex-col border-border/50 bg-card/80 py-0 shadow-sm lg:min-h-0">
          {selectedThread ? (
            <>
              <CardHeader className="gap-4 pt-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="size-11 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 font-heading font-semibold text-primary">
                        {getInitials(selectedThread.customer_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="truncate text-xl">
                          {selectedThread.subject}
                        </CardTitle>
                        {selectedUnread && <Badge>Unread</Badge>}
                        <Badge
                          variant="outline"
                          className={cn("capitalize", statusTone[selectedThread.status])}
                        >
                          {statusLabel[selectedThread.status]}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                        <UserRound className="size-3.5" />
                        {selectedThread.customer_name}
                        {selectedThread.customer_email
                          ? ` · ${selectedThread.customer_email}`
                          : ""}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void markRead()}
                      disabled={!selectedUnread}
                    >
                      <CheckCheck data-icon="inline-start" />
                      Mark Read
                    </Button>
                    <Select
                      value={selectedThread.status}
                      onValueChange={(value) =>
                        void changeStatus(value as VisibleThreadStatus)
                      }
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </CardHeader>

              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pb-4">
                <div
                  ref={messageListRef}
                  className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-lg bg-background/30 px-3 py-4 sm:px-5"
                >
                  {selectedThread.messages.map((message) => {
                    const fromAdmin = message.sender_role === "admin";
                    const fromSystem = message.sender_role === "system";

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-end gap-2 sm:gap-3",
                          fromAdmin ? "justify-end" : "justify-start"
                        )}
                      >
                        {!fromAdmin && (
                          <Avatar className="size-9 rounded-lg">
                            <AvatarFallback
                              className={cn(
                                "rounded-lg text-xs font-semibold",
                                fromSystem
                                  ? "bg-primary/10 text-primary"
                                  : "bg-secondary text-secondary-foreground"
                              )}
                            >
                              {fromSystem
                                ? "AR"
                                : getInitials(selectedThread.customer_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "flex max-w-[min(840px,94%)] flex-col gap-1 sm:max-w-[min(840px,86%)]",
                            fromAdmin ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex flex-wrap items-center gap-2 px-1 text-[11px] text-muted-foreground",
                              fromAdmin && "justify-end text-right"
                            )}
                          >
                            <span className="font-medium">
                              {getSenderLabel(
                                message.sender_role,
                                selectedThread.customer_name,
                                message.sender_name
                              )}
                            </span>
                            <span>{formatDateTime(message.created_at)}</span>
                          </div>
                          <p
                            className={cn(
                              "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm",
                              fromAdmin
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : fromSystem
                                  ? "rounded-bl-md bg-primary/10 text-foreground ring-1 ring-primary/10"
                                  : "rounded-bl-md bg-secondary text-secondary-foreground"
                            )}
                          >
                            {message.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="shrink-0 rounded-lg border border-border/50 bg-background/35 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Label className="flex items-center gap-2">
                      <Reply className="size-4 text-primary" />
                      Reply
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {reply.length} characters
                    </span>
                  </div>
                  <InputGroup className="min-h-14">
                    <InputGroupTextarea
                      className="min-h-14"
                      value={reply}
                      placeholder="Message..."
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={handleReplyKeyDown}
                    />
                  </InputGroup>
                  <Separator className="my-3" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Status: {statusLabel[selectedThread.status]}
                    </p>
                    <Button
                      onClick={() => void sendReply()}
                      disabled={isSaving || !reply.trim()}
                    >
                      <Send data-icon="inline-start" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex min-h-[680px] items-center justify-center">
              <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                <MessageSquareText className="size-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Select or create a thread</p>
                  <p className="text-sm text-muted-foreground">
                    Conversations will appear here.
                  </p>
                </div>
              </div>
            </CardContent>
          )}
	        </Card>
        <Card className="hidden min-h-[320px] border-border/50 bg-card/80 py-0 shadow-sm lg:col-span-2 lg:flex xl:col-span-1 xl:min-h-0">
          <CardHeader className="pt-5">
            <CardTitle>Details</CardTitle>
            <CardDescription>Conversation context</CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
            {selectedThread ? (
              <>
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border/50 bg-background/35 p-4 text-center">
                  <Avatar className="size-14 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 font-heading text-base font-semibold text-primary">
                      {getInitials(selectedThread.customer_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{selectedThread.customer_name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {selectedThread.customer_email ?? "No email on file"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        statusTone[selectedThread.status]
                      )}
                    >
                      {statusLabel[selectedThread.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Unread</span>
                    <Badge variant={selectedUnread ? "default" : "outline"}>
                      {selectedUnread ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Messages</span>
                    <span className="text-sm font-medium">
                      {selectedThread.messages.length}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Last activity</p>
                    <p className="mt-1 font-medium">
                      {formatDateTime(selectedThread.last_message_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Started</p>
                    <p className="mt-1 font-medium">
                      {formatDateTime(selectedThread.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Latest sender</p>
                    <p className="mt-1 font-medium">
                      {latestMessage
                        ? getSenderLabel(
                            latestMessage.sender_role,
                            selectedThread.customer_name,
                            latestMessage.sender_name
                          )
                        : "None"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Select a thread to view details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
