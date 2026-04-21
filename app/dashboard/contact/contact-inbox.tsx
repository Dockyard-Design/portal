"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveX,
  CheckCircle2,
  Inbox,
  Mail,
  MailOpen,
  MoreVertical,
  Reply,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  deleteSubmission,
  deleteSubmissions,
  getContactSubmissions,
  toggleArchiveSubmission,
  toggleArchiveSubmissions,
  updateSubmissionStatus,
  updateSubmissionStatuses,
} from "@/app/actions/contact";
import type { ContactStatus, ContactSubmission } from "@/types/contact";

type FolderFilter = ContactStatus | "all" | "archived";

const STATUS_META: Record<ContactStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "border-blue-500/20 bg-blue-500/10 text-blue-700" },
  read: { label: "Read", tone: "border-amber-500/20 bg-amber-500/10 text-amber-700" },
  replied: { label: "Replied", tone: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" },
  closed: { label: "Closed", tone: "border-slate-500/20 bg-slate-500/10 text-slate-700" },
};

const FOLDERS: Array<{ id: FolderFilter; label: string; icon: typeof Inbox }> = [
  { id: "all", label: "Inbox", icon: Inbox },
  { id: "new", label: "Unread", icon: Mail },
  { id: "read", label: "Read", icon: MailOpen },
  { id: "replied", label: "Replied", icon: Reply },
  { id: "archived", label: "Archived", icon: Archive },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPreview(message: string): string {
  return message.replace(/\s+/g, " ").trim();
}

export default function ContactInbox() {
  const [activeSubmissions, setActiveSubmissions] = useState<ContactSubmission[]>([]);
  const [archivedSubmissions, setArchivedSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [folder, setFolder] = useState<FolderFilter>("all");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | "bulk">("bulk");

  const allSubmissions = useMemo(
    () => [...activeSubmissions, ...archivedSubmissions],
    [activeSubmissions, archivedSubmissions]
  );

  const folderCounts = useMemo(
    () => ({
      all: activeSubmissions.length,
      new: activeSubmissions.filter((submission) => submission.status === "new").length,
      read: activeSubmissions.filter((submission) => submission.status === "read").length,
      replied: activeSubmissions.filter((submission) => submission.status === "replied").length,
      closed: activeSubmissions.filter((submission) => submission.status === "closed").length,
      archived: archivedSubmissions.length,
    }),
    [activeSubmissions, archivedSubmissions]
  );

  const visibleSubmissions = useMemo(() => {
    const source = folder === "archived" ? archivedSubmissions : activeSubmissions;
    const normalizedQuery = query.trim().toLowerCase();

    return source.filter((submission) => {
      const matchesFolder =
        folder === "all" ||
        folder === "archived" ||
        submission.status === folder;
      const matchesQuery =
        !normalizedQuery ||
        submission.name.toLowerCase().includes(normalizedQuery) ||
        submission.email.toLowerCase().includes(normalizedQuery) ||
        submission.message.toLowerCase().includes(normalizedQuery);

      return matchesFolder && matchesQuery;
    });
  }, [activeSubmissions, archivedSubmissions, folder, query]);

  const selectedSubmission =
    allSubmissions.find((submission) => submission.id === selectedId) ??
    visibleSubmissions[0] ??
    null;

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeData, archivedData] = await Promise.all([
        getContactSubmissions({ archived: false }),
        getContactSubmissions({ archived: true }),
      ]);
      setActiveSubmissions(activeData);
      setArchivedSubmissions(archivedData);
      setSelectedIds(new Set());
      setSelectedId((current) =>
        [...activeData, ...archivedData].some((submission) => submission.id === current)
          ? current
          : activeData[0]?.id ?? archivedData[0]?.id ?? ""
      );
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to load contact submissions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const visibleIds = visibleSubmissions.map((submission) => submission.id);
      const allVisibleSelected = visibleIds.every((id) => current.has(id));
      const next = new Set(current);
      for (const id of visibleIds) {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const updateOneStatus = async (id: string, status: ContactStatus, archived = false) => {
    const currentSubmission = allSubmissions.find((submission) => submission.id === id);

    try {
      if (status === "closed" && currentSubmission) {
        setActiveSubmissions((items) => items.filter((item) => item.id !== id));
        setArchivedSubmissions((items) => [
          { ...currentSubmission, status, archived: true },
          ...items.filter((item) => item.id !== id),
        ]);
      } else if (archived && currentSubmission) {
        setArchivedSubmissions((items) => items.filter((item) => item.id !== id));
        setActiveSubmissions((items) => [
          { ...currentSubmission, status, archived: false },
          ...items.filter((item) => item.id !== id),
        ]);
      } else {
        setActiveSubmissions((items) =>
          items.map((item) => item.id === id ? { ...item, status } : item)
        );
        setArchivedSubmissions((items) =>
          items.map((item) => item.id === id ? { ...item, status } : item)
        );
      }
      if (archived) await toggleArchiveSubmission(id, false);
      if (status === "closed") await toggleArchiveSubmission(id, true);
      await updateSubmissionStatus(id, status);
      toast.success(status === "closed" ? "Archived and closed" : `Marked as ${status}`);
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to update submission");
      await fetchSubmissions();
    }
  };

  const archiveOne = async (submission: ContactSubmission) => {
    try {
      const shouldArchive = !submission.archived;
      setActiveSubmissions((items) =>
        shouldArchive
          ? items.filter((item) => item.id !== submission.id)
          : items.map((item) => item.id === submission.id ? { ...item, archived: false } : item)
      );
      setArchivedSubmissions((items) =>
        shouldArchive
          ? [{ ...submission, status: "closed", archived: true }, ...items]
          : items.filter((item) => item.id !== submission.id)
      );
      if (shouldArchive) await updateSubmissionStatus(submission.id, "closed");
      await toggleArchiveSubmission(submission.id, shouldArchive);
      toast.success(shouldArchive ? "Archived" : "Moved to inbox");
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to update archive status");
      await fetchSubmissions();
    }
  };

  const bulkUpdate = async (status: ContactStatus) => {
    const ids = [...selectedIds];
    const idSet = new Set(ids);
    try {
      setActiveSubmissions((items) =>
        status === "closed"
          ? items.filter((item) => !idSet.has(item.id))
          : items.map((item) => idSet.has(item.id) ? { ...item, status } : item)
      );
      if (status === "closed") {
        const archivedItems = activeSubmissions
          .filter((item) => idSet.has(item.id))
          .map((item) => ({ ...item, status, archived: true }));
        setArchivedSubmissions((items) => [...archivedItems, ...items]);
        await toggleArchiveSubmissions(ids, true);
      }
      await updateSubmissionStatuses(ids, status);
      setSelectedIds(new Set());
      toast.success(`${ids.length} submissions updated`);
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to update selected submissions");
      await fetchSubmissions();
    }
  };

  const bulkUnarchive = async () => {
    const ids = [...selectedIds];
    const idSet = new Set(ids);
    try {
      const restored = archivedSubmissions
        .filter((item) => idSet.has(item.id))
        .map((item) => ({ ...item, status: "read" as ContactStatus, archived: false }));
      setArchivedSubmissions((items) => items.filter((item) => !idSet.has(item.id)));
      setActiveSubmissions((items) => [...restored, ...items]);
      setSelectedIds(new Set());
      await Promise.all([
        toggleArchiveSubmissions(ids, false),
        updateSubmissionStatuses(ids, "read"),
      ]);
      toast.success(`${ids.length} submissions moved to inbox`);
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to unarchive selected submissions");
      await fetchSubmissions();
    }
  };

  const markSelectedVisibleRead = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    try {
      setActiveSubmissions((items) =>
        items.map((item) => idSet.has(item.id) ? { ...item, status: "read" as ContactStatus } : item)
      );
      await updateSubmissionStatuses(ids, "read");
      setSelectedIds(new Set());
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to mark selected submissions read");
      await fetchSubmissions();
    }
  };


  const openSubmission = async (submission: ContactSubmission) => {
    setSelectedId(submission.id);
    if (submission.status !== "new" || submission.archived) return;

    const markReadLocally = (items: ContactSubmission[]) =>
      items.map((item) =>
        item.id === submission.id ? { ...item, status: "read" as ContactStatus } : item
      );

    setActiveSubmissions(markReadLocally);
    try {
      await updateSubmissionStatus(submission.id, "read");
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to mark submission as read");
      await fetchSubmissions();
    }
  };

  const openDeleteDialog = (id?: string) => {
    setDeleteTarget(id ?? "bulk");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    const ids = deleteTarget === "bulk" ? [...selectedIds] : [deleteTarget];
    const idSet = new Set(ids);
    try {
      setActiveSubmissions((items) => items.filter((item) => !idSet.has(item.id)));
      setArchivedSubmissions((items) => items.filter((item) => !idSet.has(item.id)));
      setSelectedIds(new Set());
      if (ids.length === 1) await deleteSubmission(ids[0]);
      else await deleteSubmissions(ids);
      toast.success(`${ids.length} submission${ids.length === 1 ? "" : "s"} deleted`);
      window.dispatchEvent(new CustomEvent("contact-submissions:changed"));
    } catch {
      toast.error("Failed to delete submission");
      await fetchSubmissions();
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const selectedCount = selectedIds.size;
  const allVisibleSelected =
    visibleSubmissions.length > 0 &&
    visibleSubmissions.every((submission) => selectedIds.has(submission.id));

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[680px] w-full flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contact Submissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Inbox view for website enquiries.</p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, or message..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-lg border bg-background lg:grid-cols-[220px_minmax(320px,420px)_minmax(0,1fr)]">
        <aside className="border-b bg-muted/20 p-3 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-1">
            {FOLDERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFolder(item.id)}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm transition-colors",
                  folder === item.id
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <Badge variant="secondary">{folderCounts[item.id]}</Badge>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
          <div className="flex h-12 items-center gap-2 border-b px-3">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={toggleAllVisible}
              aria-label="Select all visible submissions"
            />
            {selectedCount > 0 ? (
              <>
                <span className="text-sm font-medium">{selectedCount} selected</span>
                <div className="ml-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => void markSelectedVisibleRead()}>
                    <CheckCircle2 className="size-4" />
                  </Button>
                  {folder === "archived" ? (
                    <Button variant="ghost" size="icon" onClick={() => void bulkUnarchive()}>
                      <ArchiveX className="size-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => void bulkUpdate("closed")}>
                      <Archive className="size-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog()}>
                    <Trash2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedIds(new Set())}>
                    <X className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{visibleSubmissions.length} conversations</span>
            )}
          </div>

          <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading submissions...
              </div>
            ) : visibleSubmissions.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No submissions in this view.
              </div>
            ) : (
              visibleSubmissions.map((submission) => (
                <button
                  key={submission.id}
                  type="button"
                  onClick={() => void openSubmission(submission)}
                  className={cn(
                    "flex w-full gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted/40",
                    selectedSubmission?.id === submission.id && "bg-muted/60",
                    submission.status === "new" && !submission.archived && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(submission.id)}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => toggleSelected(submission.id)}
                    aria-label={`Select submission from ${submission.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("truncate text-sm", submission.status === "new" && "font-semibold")}>
                        {submission.name || "Anonymous"}
                      </p>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {formatDate(submission.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{submission.email}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                      {getPreview(submission.message)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col">
          {selectedSubmission ? (
            <>
              <div className="flex min-h-16 items-center gap-3 border-b px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold">{selectedSubmission.name || "Anonymous"}</h2>
                    <Badge variant="outline" className={STATUS_META[selectedSubmission.status].tone}>
                      {STATUS_META[selectedSubmission.status].label}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{selectedSubmission.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => void updateOneStatus(selectedSubmission.id, "new", selectedSubmission.archived)}>
                      <Mail className="size-4" />
                      Mark New
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void updateOneStatus(selectedSubmission.id, "read", selectedSubmission.archived)}>
                      <MailOpen className="size-4" />
                      Mark Read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void updateOneStatus(selectedSubmission.id, "replied", selectedSubmission.archived)}>
                      <Reply className="size-4" />
                      Mark Replied
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void archiveOne(selectedSubmission)}>
                      {selectedSubmission.archived ? <ArchiveX className="size-4" /> : <Archive className="size-4" />}
                      {selectedSubmission.archived ? "Move to Inbox" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(selectedSubmission.id)}>
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto bg-muted/20 p-5">
                <article className="w-full rounded-lg border bg-background shadow-sm">
                  <div className="border-b px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {(selectedSubmission.name || selectedSubmission.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{selectedSubmission.name || "Anonymous"}</p>
                        <p className="truncate text-sm text-muted-foreground">{selectedSubmission.email}</p>
                      </div>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(selectedSubmission.created_at)}
                      </time>
                    </div>
                  </div>
                  <div className="px-5 py-6">
                    <p className="whitespace-pre-wrap text-sm leading-7">{selectedSubmission.message}</p>
                  </div>
                </article>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Select a submission to read it.
            </div>
          )}
        </section>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete submission{deleteTarget === "bulk" ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {deleteTarget === "bulk" ? `${selectedCount} selected submissions` : "this submission"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
