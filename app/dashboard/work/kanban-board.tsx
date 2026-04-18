"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KanbanSquare,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  Building,
  Search,
  Check,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  createCustomer,
} from "@/app/actions/kanban";
import { toast } from "sonner";
import { format, parseISO, isPast, isToday, isTomorrow } from "date-fns";
import type {
  Customer,
  Task,
  TasksByStatus,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  CreateCustomerInput,
  ClerkUser,
} from "@/types/kanban";
import type { LucideIcon } from "lucide-react";

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  color: string;
  icon: LucideIcon;
}

const COLUMNS: ColumnConfig[] = [
  { id: "backlog", title: "Backlog", color: "bg-slate-500", icon: Circle },
  { id: "todo", title: "To Do", color: "bg-blue-500", icon: AlertCircle },
  {
    id: "in_progress",
    title: "In Progress",
    color: "bg-amber-500",
    icon: Clock,
  },
  {
    id: "complete",
    title: "Complete",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
];

interface PriorityConfig {
  color: string;
  label: string;
}

const PRIORITIES: Record<TaskPriority, PriorityConfig> = {
  urgent: { color: "bg-red-500", label: "Urgent" },
  high: { color: "bg-orange-500", label: "High" },
  medium: { color: "bg-yellow-500", label: "Medium" },
  low: { color: "bg-blue-400", label: "Low" },
};

function getPriorityBadge(priority: TaskPriority): React.ReactNode {
  const config = PRIORITIES[priority] || PRIORITIES.medium;
  return <div className={cn("size-2 rounded-full", config.color)} />;
}

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

function getDueDateColor(dateStr: string | null): string {
  if (!dateStr) return "text-muted-foreground";
  const date = parseISO(dateStr);

  if (isPast(date) && !isToday(date)) return "text-red-400";
  if (isToday(date) || isTomorrow(date)) return "text-amber-400";
  return "text-muted-foreground";
}

function getUserDisplayName(user: ClerkUser | undefined): string {
  if (!user) return "Unassigned";
  return user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName
      ? user.firstName
      : user.username
        ? user.username
        : user.emailAddress
          ? user.emailAddress.split("@")[0]
          : "Unknown User";
}

function getUserInitials(user: ClerkUser | undefined): string {
  if (!user) return "?";
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName.slice(0, 2).toUpperCase();
  }
  if (user.username) {
    return user.username.slice(0, 2).toUpperCase();
  }
  return user.emailAddress ? user.emailAddress.slice(0, 2).toUpperCase() : "?";
}

interface TaskFormState {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  status: TaskStatus;
  assigned_to: string;
}

interface CustomerFormState {
  name: string;
  email: string;
  company: string;
  notes: string;
}

interface KanbanBoardProps {
  customers: Customer[];
  teamMembers: ClerkUser[];
  tasksByStatus: TasksByStatus;
  selectedCustomerId: string;
  selectedCustomer: Customer | undefined;
}

export function KanbanBoard({
  customers,
  teamMembers,
  tasksByStatus,
  selectedCustomerId,
  selectedCustomer,
}: KanbanBoardProps) {
  const router = useRouter();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [taskForm, setTaskForm] = useState<TaskFormState>({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    status: "backlog",
    assigned_to: "",
  });

  const [customerForm, setCustomerForm] = useState<CustomerFormState>({
    name: "",
    email: "",
    company: "",
    notes: "",
  });

  const handleCustomerChange = (customerId: string) => {
    const params = new URLSearchParams();
    if (customerId) params.set("customer", customerId);
    router.push(`/dashboard/work?${params.toString()}`);
    setIsCustomerSelectOpen(false);
  };

  function resetTaskForm(): void {
    setTaskForm({
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      status: "backlog",
      assigned_to: "",
    });
    setEditingTask(null);
  }

  function handleEditTask(task: Task): void {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 16) : "",
      status: task.status,
      assigned_to: task.assigned_to || "",
    });
    setIsTaskDialogOpen(true);
  }

  async function handleSaveTask(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!selectedCustomerId) return;

    setIsSubmitting(true);
    try {
      const assignedToValue = taskForm.assigned_to || null;

      if (editingTask) {
        await updateTask(editingTask.id, {
          ...taskForm,
          assigned_to: assignedToValue,
        });
        toast.success("Task updated");
      } else {
        const taskInput: CreateTaskInput = {
          ...taskForm,
          customer_id: selectedCustomerId,
          assigned_to: assignedToValue,
        };
        await createTask(taskInput);
        toast.success("Task created");
      }
      setIsTaskDialogOpen(false);
      resetTaskForm();
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save task";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTask(taskId: string): Promise<void> {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete task";
      toast.error(message);
    }
  }

  async function handleMoveTask(
    task: Task,
    newStatus: TaskStatus,
  ): Promise<void> {
    try {
      await moveTask(task.id, newStatus, task.position);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to move task";
      toast.error(message);
    }
  }

  async function handleCreateCustomer(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const customerInput: CreateCustomerInput = customerForm;
      const customer = await createCustomer(customerInput);
      toast.success("Customer created");
      setIsCustomerDialogOpen(false);
      setCustomerForm({ name: "", email: "", company: "", notes: "" });
      handleCustomerChange(customer.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create customer";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAddTask(columnId: TaskStatus): void {
    resetTaskForm();
    setTaskForm((prev) => ({ ...prev, status: columnId }));
    setIsTaskDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Customer Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {selectedCustomer?.name || "No customer selected"}
          </h1>
        </div>

        {/* Customer Combobox */}
        <div className="relative">
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isCustomerSelectOpen}
            className="w-72 justify-between"
            onClick={() => setIsCustomerSelectOpen(true)}
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-2 overflow-hidden">
                <Building className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{selectedCustomer.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                Select a customer...
              </span>
            )}
            <Search className="size-4 shrink-0 text-muted-foreground" />
          </Button>

          {isCustomerSelectOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50">
              <Command className="rounded-lg border shadow-md bg-popover">
                <CommandInput
                  placeholder="Search customers..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No customers found.</CommandEmpty>
                  <CommandGroup>
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name.toLowerCase()}
                        onSelect={() => handleCustomerChange(customer.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Building className="size-4 text-muted-foreground" />
                          <span className="flex-1">{customer.name}</span>
                          {customer.company && (
                            <span className="text-muted-foreground text-sm">
                              {customer.company}
                            </span>
                          )}
                          {customer.id === selectedCustomerId && (
                            <Check className="size-4 text-primary" />
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}

          {/* Click outside to close */}
          {isCustomerSelectOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsCustomerSelectOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Empty State */}
      {!selectedCustomerId && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border/50 bg-card/30">
          <KanbanSquare className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No customer selected</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Select a customer from the dropdown above to view and manage their
            Kanban board.
          </p>
        </div>
      )}

      {/* Kanban Columns */}
      {selectedCustomerId && (
        <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col min-h-0">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("size-3 rounded-full", column.color)} />
                  <span className="font-medium text-sm">{column.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByStatus[column.id]?.length || 0}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => handleAddTask(column.id)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              {/* Tasks */}
              <div className="flex-1 space-y-2 min-h-0 overflow-y-auto">
                {tasksByStatus[column.id]?.map((task) => {
                  const taskAssignee = teamMembers.find(
                    (u) => u.id === task.assigned_to,
                  );
                  return (
                    <div
                      key={task.id}
                      className="group p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => handleEditTask(task)}
                    >
                      {/* Header: Title + Menu */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-medium text-sm line-clamp-2 flex-1">
                          {task.title}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={() => handleEditTask(task)}
                            >
                              <Pencil className="size-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {column.id !== "backlog" && (
                              <DropdownMenuItem
                                onClick={() => handleMoveTask(task, "backlog")}
                              >
                                Move to Backlog
                              </DropdownMenuItem>
                            )}
                            {column.id !== "todo" && (
                              <DropdownMenuItem
                                onClick={() => handleMoveTask(task, "todo")}
                              >
                                Move to To Do
                              </DropdownMenuItem>
                            )}
                            {column.id !== "in_progress" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMoveTask(task, "in_progress")
                                }
                              >
                                Move to In Progress
                              </DropdownMenuItem>
                            )}
                            {column.id !== "complete" && (
                              <DropdownMenuItem
                                onClick={() => handleMoveTask(task, "complete")}
                              >
                                Move to Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="size-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Description - Always takes space */}
                      <div className="min-h-[1.5rem] mb-3">
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Assignee - Always takes space */}
                      <div className="h-6 mb-3">
                        {taskAssignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary border border-primary/20">
                              {getUserInitials(taskAssignee)}
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {getUserDisplayName(taskAssignee).split(" ")[0]}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Footer: Priority & Due Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          <span className="text-xs text-muted-foreground capitalize">
                            {task.priority}
                          </span>
                        </div>

                        {task.due_date && (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              getDueDateColor(task.due_date),
                            )}
                          >
                            <Calendar className="size-3" />
                            {formatDueDate(task.due_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add Task Button at bottom */}
                <Button
                  variant="ghost"
                  className="w-full h-8 text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-border"
                  onClick={() => handleAddTask(column.id)}
                >
                  <Plus className="size-4 mr-1" />
                  Add task
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask
                ? "Update the task details below"
                : `Create a new task for ${selectedCustomer?.name || "this customer"}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTask} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                placeholder="Task title..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            {/* Assignee Selection */}
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select
                value={taskForm.assigned_to || "unassigned"}
                onValueChange={(v: string | null) =>
                  setTaskForm({
                    ...taskForm,
                    assigned_to: !v || v === "unassigned" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-2">
                      <UserCircle className="size-4 text-muted-foreground" />
                      <span>Unassigned</span>
                    </div>
                  </SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary border border-primary/20">
                          {getUserInitials(member)}
                        </div>
                        <span>{getUserDisplayName(member)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) =>
                    setTaskForm({ ...taskForm, priority: v as TaskPriority })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(v) =>
                    setTaskForm({ ...taskForm, status: v as TaskStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="datetime-local"
                value={taskForm.due_date}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, due_date: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTaskDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {editingTask ? "Update Task" : "Create Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Add a new customer to the Kanban board
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                value={customerForm.name}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, name: e.target.value })
                }
                placeholder="Customer name..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={customerForm.email}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-company">Company</Label>
              <Input
                id="c-company"
                value={customerForm.company}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, company: e.target.value })
                }
                placeholder="Company name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-notes">Notes</Label>
              <Textarea
                id="c-notes"
                value={customerForm.notes}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomerDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Create Customer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
