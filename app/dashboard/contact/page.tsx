"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getContactSubmissions,
  updateSubmissionStatus,
  toggleArchiveSubmission,
  deleteSubmission,
} from "@/app/actions/contact";
import { ContactStatus, ContactSubmission } from "@/types/contact";
import { 
  MoreVertical, 
  Archive, 
  ArchiveX, 
  Trash2, 
  CheckCircle2, 
  Eye, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG: Record<ContactStatus, { label: string; icon: React.ElementType; color: string }> = {
  new: { label: "New", icon: Eye, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  read: { label: "Read", icon: CheckCircle2, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  replied: { label: "Replied", icon: MessageCircle, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  closed: { label: "Closed", icon: Archive, color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

interface StatusTableProps {
  status: ContactStatus;
  submissions: ContactSubmission[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onUpdateStatus: (id: string, status: ContactStatus) => void;
  onToggleArchive: (id: string, currentArchived: boolean) => void;
  onOpenDeleteDialog: (id: string) => void;
  onView: (submission: ContactSubmission) => void;
}

function ArchivedTable({
  submissions,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  openModal,
  onToggleArchive,
  onOpenDeleteDialog,
  onUpdateStatus,
}: {
  submissions: ContactSubmission[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  openModal: (s: ContactSubmission) => void;
  onToggleArchive: (id: string, archived: boolean) => void;
  onOpenDeleteDialog: (id: string) => void;
  onUpdateStatus: (id: string, status: ContactStatus, isArchived: boolean) => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(submissions.length / ITEMS_PER_PAGE);
  const paginatedSubmissions = submissions.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const allSelected = paginatedSubmissions.length > 0 && paginatedSubmissions.every(s => selectedIds.has(s.id));

  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div className="rounded-xl border border-border/40 bg-background overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-secondary/20 border-b border-border/40 flex items-center gap-2">
        <ArchiveX className="size-4" />
        <span className="font-semibold">Archived</span>
        <Badge variant="secondary" className="ml-auto">{submissions.length}</Badge>
      </div>
      
      <Table>
        <TableHeader className="bg-secondary/10">
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
            <TableHead className="w-[200px]">User</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedSubmissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-base">
                No archived submissions.
              </TableCell>
            </TableRow>
          ) : (
            paginatedSubmissions.map((s) => (
              <TableRow key={s.id} className={`group opacity-60 ${selectedIds.has(s.id) ? "bg-primary/5" : ""}`}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => onToggleSelect(s.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-base">{s.name || "Anonymous"}</span>
                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">{s.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="truncate text-muted-foreground text-base cursor-pointer hover:text-foreground" onClick={() => openModal(s)}>
                    {s.message}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(s.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-1.5 py-1 text-sm font-medium text-muted-foreground">Actions</div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openModal(s)} className="gap-2">
                        <Eye className="size-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onUpdateStatus(s.id, "new", true)} className="gap-2">
                        <Eye className="size-4" /> Restore as New
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(s.id, "read", true)} className="gap-2">
                        <CheckCircle2 className="size-4" /> Restore as Read
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(s.id, "replied", true)} className="gap-2">
                        <MessageCircle className="size-4" /> Restore as Replied
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onToggleArchive(s.id, s.archived)}
                        className="gap-2"
                      >
                        <ArchiveX className="size-4" /> Unarchive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onOpenDeleteDialog(s.id)}
                        className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-secondary/10">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevPage} disabled={page === 0}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextPage} disabled={page >= totalPages - 1}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusTable({ 
  status, 
  submissions, 
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onUpdateStatus, 
  onToggleArchive, 
  onOpenDeleteDialog, 
  onView 
}: StatusTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(submissions.length / ITEMS_PER_PAGE);
  const paginatedSubmissions = submissions.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const allSelected = paginatedSubmissions.length > 0 && paginatedSubmissions.every(s => selectedIds.has(s.id));
  const someSelected = paginatedSubmissions.some(s => selectedIds.has(s.id)) && !allSelected;

  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div className="rounded-xl border border-border/40 bg-background overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-secondary/20 border-b border-border/40 flex items-center gap-2">
        <Icon className="size-4" />
        <span className="font-semibold">{config.label}</span>
        <Badge variant="secondary" className="ml-auto">{submissions.length}</Badge>
      </div>
      
      <Table>
        <TableHeader className="bg-secondary/10">
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
              />
            </TableHead>
            <TableHead className="w-[200px]">User</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedSubmissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                No {status} submissions.
              </TableCell>
            </TableRow>
          ) : (
            paginatedSubmissions.map((s) => (
              <TableRow key={s.id} className={`group ${selectedIds.has(s.id) ? "bg-primary/5" : ""}`}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => onToggleSelect(s.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{s.name || "Anonymous"}</span>
                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">{s.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => onView(s)}>
                    {s.message}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(s.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-1.5 py-1 text-sm font-medium text-muted-foreground">Actions</div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(s)} className="gap-2">
                        <Eye className="size-4" /> View
                      </DropdownMenuItem>
                      {status !== "new" && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(s.id, "new")} className="gap-2">
                          <Eye className="size-4" /> Mark as New
                        </DropdownMenuItem>
                      )}
                      {status !== "read" && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(s.id, "read")} className="gap-2">
                          <CheckCircle2 className="size-4" /> Mark as Read
                        </DropdownMenuItem>
                      )}
                      {status !== "replied" && (
                        <DropdownMenuItem onClick={() => onUpdateStatus(s.id, "replied")} className="gap-2">
                          <MessageCircle className="size-4" /> Mark as Replied
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onUpdateStatus(s.id, "closed")}
                        className="gap-2"
                      >
                        <Archive className="size-4" /> Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onOpenDeleteDialog(s.id)}
                        className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-secondary/10">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevPage} disabled={page === 0}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextPage} disabled={page >= totalPages - 1}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface BulkActionBarProps {
  selectedCount: number;
  onMarkNew: () => void;
  onMarkRead: () => void;
  onMarkReplied: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onClear: () => void;
  hasArchivedSelection: boolean;
}

function BulkActionBar({ selectedCount, onMarkNew, onMarkRead, onMarkReplied, onArchive, onUnarchive, onDelete, onClear, hasArchivedSelection }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 mx-auto max-w-4xl bg-background border border-border/40 shadow-lg rounded-xl p-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {selectedCount}
        </div>
        <span className="text-sm font-medium">selected</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onMarkNew} className="h-8">
          <Eye className="size-3.5 mr-1.5" />
          New
        </Button>
        <Button variant="outline" size="sm" onClick={onMarkRead} className="h-8">
          <CheckCircle2 className="size-3.5 mr-1.5" />
          Read
        </Button>
        <Button variant="outline" size="sm" onClick={onMarkReplied} className="h-8">
          <MessageCircle className="size-3.5 mr-1.5" />
          Replied
        </Button>
        {hasArchivedSelection ? (
          <Button variant="outline" size="sm" onClick={onUnarchive} className="h-8">
            <ArchiveX className="size-3.5 mr-1.5" />
            Unarchive
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onArchive} className="h-8">
            <Archive className="size-3.5 mr-1.5" />
            Archive
          </Button>
        )}
        <Button variant="destructive" size="sm" onClick={onDelete} className="h-8">
          <Trash2 className="size-3.5 mr-1.5" />
          Delete
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [archivedSubmissions, setArchivedSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Track selected items per status table
  const [selectedNew, setSelectedNew] = useState<Set<string>>(new Set());
  const [selectedRead, setSelectedRead] = useState<Set<string>>(new Set());
  const [selectedReplied, setSelectedReplied] = useState<Set<string>>(new Set());
  const [selectedArchived, setSelectedArchived] = useState<Set<string>>(new Set());

  const allSelected = useMemo(() => {
    return new Set([...selectedNew, ...selectedRead, ...selectedReplied, ...selectedArchived]);
  }, [selectedNew, selectedRead, selectedReplied, selectedArchived]);

  const totalSelectedCount = allSelected.size;

  async function fetchSubmissions() {
    setIsLoading(true);
    try {
      const [activeData, archivedData] = await Promise.all([
        getContactSubmissions({ archived: false }),
        getContactSubmissions({ archived: true }),
      ]);
      setSubmissions(activeData);
      setArchivedSubmissions(archivedData);
      // Clear selections after refresh
      setSelectedNew(new Set());
      setSelectedRead(new Set());
      setSelectedReplied(new Set());
      setSelectedArchived(new Set());
    } catch (error) {
      toast.error("Failed to load contact submissions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleUpdateStatus = useCallback(async (id: string, status: ContactStatus, isArchived = false) => {
    try {
      // If currently archived, unarchive first
      if (isArchived) {
        await toggleArchiveSubmission(id, false);
      }
      // If marking as closed, also archive
      if (status === "closed") {
        await toggleArchiveSubmission(id, true);
      }
      await updateSubmissionStatus(id, status);
      const msg = status === "closed" ? "Closed and archived" : `Status updated to ${status}`;
      toast.success(isArchived ? `${msg} and unarchived` : msg);
      await fetchSubmissions();
    } catch (error) {
      toast.error("Failed to update status");
    }
  }, []);

  const handleToggleArchive = useCallback(async (id: string, currentArchived: boolean) => {
    try {
      const makeArchived = !currentArchived;
      if (makeArchived) {
        // When archiving, also set status to closed
        await updateSubmissionStatus(id, "closed");
        await toggleArchiveSubmission(id, true);
        toast.success("Archived and closed");
      } else {
        // When unarchiving, restore to "read" status so it appears in the active table
        await toggleArchiveSubmission(id, false);
        await updateSubmissionStatus(id, "read");
        toast.success("Unarchived and restored to Read");
      }
      await fetchSubmissions();
    } catch (error) {
      toast.error("Failed to update archive status");
    }
  }, []);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | "bulk">("bulk");

  const openDeleteDialog = useCallback((id?: string) => {
    setDeleteTarget(id || "bulk");
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      if (deleteTarget === "bulk") {
        await Promise.all([...allSelected].map(id => deleteSubmission(id)));
        toast.success(`${totalSelectedCount} submissions deleted`);
      } else {
        await deleteSubmission(deleteTarget);
        toast.success("Submission deleted");
      }
      await fetchSubmissions();
    } catch (error) {
      toast.error("Failed to delete submission");
    } finally {
      setDeleteDialogOpen(false);
    }
  }, [deleteTarget, allSelected, totalSelectedCount]);

  const handleBulkUpdateStatus = useCallback(async (status: ContactStatus) => {
    try {
      // Process in batches to avoid overwhelming the server
      const ids = [...allSelected];
      const batchSize = 5;
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await Promise.all(batch.map(id => {
          if (status === "closed") {
            // Close and archive
            return Promise.all([
              updateSubmissionStatus(id, "closed"),
              toggleArchiveSubmission(id, true)
            ]);
          }
          return updateSubmissionStatus(id, status);
        }));
      }
      
      const msg = status === "closed" ? "Closed and archived" : `Marked as ${status}`;
      toast.success(`${msg}: ${totalSelectedCount} submissions`);
      await fetchSubmissions();
    } catch (error) {
      toast.error("Failed to update some submissions");
    }
  }, [allSelected, totalSelectedCount]);

  const handleBulkArchive = useCallback(async () => {
    try {
      const ids = [...allSelected];
      const batchSize = 5;
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await Promise.all(batch.map(id => {
          return Promise.all([
            updateSubmissionStatus(id, "closed"),
            toggleArchiveSubmission(id, true)
          ]);
        }));
      }
      
      toast.success(`Archived and closed: ${totalSelectedCount} submissions`);
      await fetchSubmissions();
    } catch (error) {
      toast.error("Failed to archive some submissions");
    }
  }, [allSelected, totalSelectedCount]);

  const handleBulkUnarchive = useCallback(async () => {
    try {
      const ids = [...allSelected];
      const batchSize = 5;
      
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await Promise.all(batch.map(id => Promise.all([
          toggleArchiveSubmission(id, false),
          updateSubmissionStatus(id, "read")
        ])));
      }
      
      toast.success(`Unarchived and restored to Read: ${totalSelectedCount} submissions`);
      await fetchSubmissions();
    } catch (error) {
      toast.error("Failed to unarchive some submissions");
    }
  }, [allSelected, totalSelectedCount]);

  const openModal = useCallback((submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  }, []);

  const createToggleSelect = (setSelected: React.Dispatch<React.SetStateAction<Set<string>>>, submissions: ContactSubmission[]) => {
    return (id: string) => {
      setSelected(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    };
  };

  const createToggleSelectAll = (setSelected: React.Dispatch<React.SetStateAction<Set<string>>>, submissions: ContactSubmission[]) => {
    return () => {
      setSelected(prev => {
        const currentPageIds = submissions.slice(0, ITEMS_PER_PAGE).map(s => s.id);
        const allSelected = currentPageIds.every(id => prev.has(id));
        
        if (allSelected) {
          // Deselect all on current page
          const newSet = new Set(prev);
          currentPageIds.forEach(id => newSet.delete(id));
          return newSet;
        } else {
          // Select all on current page
          const newSet = new Set(prev);
          currentPageIds.forEach(id => newSet.add(id));
          return newSet;
        }
      });
    };
  };

  const submissionsByStatus = useMemo(() => {
    const grouped: Record<ContactStatus, ContactSubmission[]> = {
      new: [],
      read: [],
      replied: [],
      closed: [],
    };
    for (const s of submissions) {
      grouped[s.status].push(s);
    }
    return grouped;
  }, [submissions]);

  const clearAllSelections = () => {
    setSelectedNew(new Set());
    setSelectedRead(new Set());
    setSelectedReplied(new Set());
    setSelectedArchived(new Set());
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contact Submissions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and respond to inquiries from your website
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          {archivedSubmissions.length > 0 && `${archivedSubmissions.length} archived`}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[300px] rounded-xl border border-border/40 bg-secondary/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6">
            <StatusTable
              status="new"
              submissions={submissionsByStatus.new}
              selectedIds={selectedNew}
              onToggleSelect={createToggleSelect(setSelectedNew, submissionsByStatus.new)}
              onToggleSelectAll={createToggleSelectAll(setSelectedNew, submissionsByStatus.new)}
              onUpdateStatus={handleUpdateStatus}
              onToggleArchive={handleToggleArchive}
              onOpenDeleteDialog={openDeleteDialog}
              onView={openModal}
            />
            <StatusTable
              status="read"
              submissions={submissionsByStatus.read}
              selectedIds={selectedRead}
              onToggleSelect={createToggleSelect(setSelectedRead, submissionsByStatus.read)}
              onToggleSelectAll={createToggleSelectAll(setSelectedRead, submissionsByStatus.read)}
              onUpdateStatus={handleUpdateStatus}
              onToggleArchive={handleToggleArchive}
              onOpenDeleteDialog={openDeleteDialog}
              onView={openModal}
            />
            <StatusTable
              status="replied"
              submissions={submissionsByStatus.replied}
              selectedIds={selectedReplied}
              onToggleSelect={createToggleSelect(setSelectedReplied, submissionsByStatus.replied)}
              onToggleSelectAll={createToggleSelectAll(setSelectedReplied, submissionsByStatus.replied)}
              onUpdateStatus={handleUpdateStatus}
              onToggleArchive={handleToggleArchive}
              onOpenDeleteDialog={openDeleteDialog}
              onView={openModal}
            />
          </div>

          <ArchivedTable
            submissions={archivedSubmissions}
            selectedIds={selectedArchived}
            onToggleSelect={createToggleSelect(setSelectedArchived, archivedSubmissions)}
            onToggleSelectAll={createToggleSelectAll(setSelectedArchived, archivedSubmissions)}
            openModal={openModal}
            onToggleArchive={handleToggleArchive}
            onOpenDeleteDialog={openDeleteDialog}
            onUpdateStatus={handleUpdateStatus}
          />
        </>
      )}

      <BulkActionBar
        selectedCount={totalSelectedCount}
        onMarkNew={() => handleBulkUpdateStatus("new")}
        onMarkRead={() => handleBulkUpdateStatus("read")}
        onMarkReplied={() => handleBulkUpdateStatus("replied")}
        onArchive={handleBulkArchive}
        onUnarchive={handleBulkUnarchive}
        onDelete={() => openDeleteDialog()}
        onClear={clearAllSelections}
        hasArchivedSelection={selectedArchived.size > 0}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete submission{deleteTarget === "bulk" ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget === "bulk" ? `${totalSelectedCount} submissions` : "this submission"}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Contact Submission</DialogTitle>
            <DialogDescription className="text-base">
              From {selectedSubmission?.name || "Anonymous"} • {selectedSubmission?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm text-muted-foreground uppercase font-semibold">Status</Label>
                <div className="mt-2">
                  <Badge variant="outline" className={STATUS_CONFIG[selectedSubmission.status].color + " text-base px-3 py-1"}>
                    {STATUS_CONFIG[selectedSubmission.status].label}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground uppercase font-semibold">Date</Label>
                <p className="mt-2 text-base">
                  {new Date(selectedSubmission.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground uppercase font-semibold">Message</Label>
                <div className="mt-2 p-4 rounded-lg bg-muted/50 text-base whitespace-pre-wrap leading-relaxed">
                  {selectedSubmission.message}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
