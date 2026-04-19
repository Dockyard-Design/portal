import { useKanbanStore } from "@/lib/store";
import { useKanbanRefresh } from "./kanban-data-provider";
import { Building } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  KanbanSquare,
  Plus,
  Calendar as CalendarIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Search,
  Check,
  UserCircle,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  createCustomer,
  createBoard,
  updateBoard,
  deleteBoard,
} from "@/app/actions/kanban";
import { format, parseISO, isPast, isToday, isTomorrow } from "date-fns";
import type {
  Customer,
  KanbanBoard as Board,
  Task,
  TasksByStatus,
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  CreateCustomerInput,
  CreateBoardInput,
  ClerkUser,
} from "@/types/kanban";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

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

interface BoardFormState {
  name: string;
  description: string;
  is_default: boolean;
}

interface DragOverTarget {
  status: TaskStatus;
  taskId: string | null;
}

interface KanbanBoardProps {
  customers: Customer[];
  boards: Board[];
  teamMembers: ClerkUser[];
  tasksByStatus: TasksByStatus;
  selectedCustomerId: string;
  selectedCustomer: Customer | undefined;
  selectedBoard: Board | undefined;
  isLoading?: boolean;
}

export function KanbanBoard({
  customers,
  boards,
  teamMembers,
  tasksByStatus,
  selectedCustomerId,
  selectedCustomer,
  selectedBoard,
  isLoading,
}: KanbanBoardProps) {
  const { setSelectedCustomer, setSelectedBoard } = useKanbanStore();
  const refreshData = useKanbanRefresh();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isBoardDialogOpen, setIsBoardDialogOpen] = useState(false);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [isBoardSelectOpen, setIsBoardSelectOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(
    null,
  );

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

  const [boardForm, setBoardForm] = useState<BoardFormState>({
    name: "",
    description: "",
    is_default: false,
  });

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId || null);
    setIsCustomerSelectOpen(false);
    setIsBoardSelectOpen(false);
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoard(boardId || null);
    setIsBoardSelectOpen(false);
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
      due_date: task.due_date ? task.due_date.slice(0, 10) : "",
      status: task.status,
      assigned_to: task.assigned_to || "",
    });
    setIsTaskDialogOpen(true);
  }

  async function handleSaveTask(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!selectedBoard?.id) return;

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
          board_id: selectedBoard.id,
          assigned_to: assignedToValue,
        };
        await createTask(taskInput);
        toast.success("Task created");
      }
      setIsTaskDialogOpen(false);
      resetTaskForm();
      refreshData();
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
      refreshData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete task";
      toast.error(message);
    }
  }

  async function handleMoveTask(
    task: Task,
    newStatus: TaskStatus,
    newPosition = task.position,
  ): Promise<void> {
    try {
      await moveTask(task.id, newStatus, newPosition);
      refreshData();
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

  function resetBoardForm(): void {
    setBoardForm({
      name: "",
      description: "",
      is_default: false,
    });
    setEditingBoard(null);
  }

  function handleAddBoard(): void {
    resetBoardForm();
    setIsBoardDialogOpen(true);
  }

  function handleEditBoard(board: Board): void {
    setEditingBoard(board);
    setBoardForm({
      name: board.name,
      description: board.description || "",
      is_default: board.is_default,
    });
    setIsBoardDialogOpen(true);
  }

  async function handleSaveBoard(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!selectedCustomerId) return;

    setIsSubmitting(true);
    try {
      if (editingBoard) {
        await updateBoard(editingBoard.id, boardForm);
        toast.success("Board updated");
      } else {
        const boardInput: CreateBoardInput = {
          ...boardForm,
          customer_id: selectedCustomerId,
        };
        const newBoard = await createBoard(boardInput);
        toast.success("Board created");
        // Navigate to the new board
        handleBoardChange(newBoard.id);
      }
      setIsBoardDialogOpen(false);
      resetBoardForm();
      refreshData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save board";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteBoard(boardId: string): Promise<void> {
    try {
      await deleteBoard(boardId);
      toast.success("Board deleted");
      refreshData();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete board";
      toast.error(message);
    }
  }

  function handleAddTask(columnId: TaskStatus): void {
    resetTaskForm();
    setTaskForm((prev) => ({ ...prev, status: columnId }));
    setIsTaskDialogOpen(true);
  }

  function getDropPosition(
    task: Task,
    status: TaskStatus,
    beforeTaskId: string | null,
  ): number {
    const destinationTasks = (tasksByStatus[status] || []).filter(
      (candidate) => candidate.id !== task.id,
    );

    if (!beforeTaskId) {
      const lastTask = destinationTasks.at(-1);
      return lastTask ? lastTask.position + 1 : 0;
    }

    const targetIndex = destinationTasks.findIndex(
      (candidate) => candidate.id === beforeTaskId,
    );

    if (targetIndex <= 0) {
      return destinationTasks[0] ? destinationTasks[0].position - 1 : 0;
    }

    const previousTask = destinationTasks[targetIndex - 1];
    const targetTask = destinationTasks[targetIndex];
    return (previousTask.position + targetTask.position) / 2;
  }

  function handleTaskDragStart(
    event: React.DragEvent<HTMLDivElement>,
    task: Task,
  ): void {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
    setDraggingTask(task);
    setDragOverTarget({ status: task.status, taskId: task.id });
  }

  function handleTaskDragOver(
    event: React.DragEvent<HTMLDivElement>,
    status: TaskStatus,
    taskId: string,
  ): void {
    if (!draggingTask) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setDragOverTarget({ status, taskId });
  }

  function handleColumnDragOver(
    event: React.DragEvent<HTMLDivElement>,
    status: TaskStatus,
  ): void {
    if (!draggingTask) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverTarget({ status, taskId: null });
  }

  async function handleTaskDrop(
    event: React.DragEvent<HTMLDivElement>,
    status: TaskStatus,
    beforeTaskId: string | null,
  ): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!draggingTask) return;
    if (beforeTaskId === draggingTask.id) {
      setDragOverTarget(null);
      setDraggingTask(null);
      return;
    }

    const nextPosition = getDropPosition(draggingTask, status, beforeTaskId);
    const isSameSlot =
      draggingTask.status === status && draggingTask.position === nextPosition;

    setDragOverTarget(null);
    setDraggingTask(null);

    if (isSameSlot) return;

    await handleMoveTask(draggingTask, status, nextPosition);
  }

  function handleTaskDragEnd(): void {
    setDraggingTask(null);
    setDragOverTarget(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Customer and Board Selectors */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {selectedCustomer && (
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{selectedCustomer.name}</h1>
                {selectedBoard && (
                  <p className="text-sm text-muted-foreground">{selectedBoard.name}</p>
                )}
              </div>
            </div>
          )}
          {!selectedCustomer && (
            <h1 className="text-2xl font-semibold">Kanban Board</h1>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Board Selector */}
          {selectedCustomerId && boards.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isBoardSelectOpen}
                className="w-48 justify-between"
                onClick={() => setIsBoardSelectOpen(true)}
              >
                {selectedBoard ? (
                  <div className="flex items-center gap-2 overflow-hidden">
                    <LayoutGrid className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{selectedBoard.name}</span>
                    {selectedBoard.is_default && (
                      <Badge variant="secondary" className="text-xs shrink-0">Default</Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select board...</span>
                )}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </Button>

              {isBoardSelectOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 w-64">
                  <Command className="rounded-lg border shadow-md bg-popover">
                    <CommandInput
                      placeholder="Search boards..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No boards found.</CommandEmpty>
                      <CommandGroup>
                        {boards.map((board) => (
                          <CommandItem
                            key={board.id}
                            value={board.name.toLowerCase()}
                            onSelect={() => handleBoardChange(board.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <LayoutGrid className="size-4 text-muted-foreground" />
                              <div className="flex flex-col flex-1">
                                <span>{board.name}</span>
                                {board.description && (
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {board.description}
                                  </span>
                                )}
                              </div>
                              {board.id === selectedBoard?.id && (
                                <Check className="size-4 text-primary" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {customers.length > 0 && (
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleAddBoard}
                            className="cursor-pointer text-primary"
                          >
                            <Plus className="size-4 mr-2" />
                            Create new board
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </div>
              )}

              {isBoardSelectOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsBoardSelectOpen(false)}
                />
              )}
            </div>
          )}

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
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setIsCustomerDialogOpen(true);
                          setIsCustomerSelectOpen(false);
                        }}
                        className="cursor-pointer text-primary"
                      >
                        <Plus className="size-4 mr-2" />
                        Create new customer
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}

            {isCustomerSelectOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsCustomerSelectOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Empty State - No Customers At All */}
      {customers.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border/50 bg-card/30">
          <Building className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first customer to start using kanban boards.
          </p>
          <Button onClick={() => setIsCustomerDialogOpen(true)}>
            <Plus className="size-4 mr-2" />
            Create Customer
          </Button>
        </div>
      )}

      {/* Empty State - Customers Exist but No Customer Selected */}
      {customers.length > 0 && !selectedCustomerId && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border/50 bg-card/30">
          <KanbanSquare className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a customer</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Choose a customer from the dropdown above to view and manage their kanban boards.
          </p>
        </div>
      )}

      {/* Empty State - Customer Selected but No Boards */}
      {selectedCustomerId && boards.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border/50 bg-card/30">
          <LayoutGrid className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No boards yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first kanban board for {selectedCustomer?.name}.
          </p>
          <Button onClick={handleAddBoard}>
            <Plus className="size-4 mr-2" />
            Create Board
          </Button>
        </div>
      )}

      {/* Kanban Columns */}
      {selectedBoard && (
        <div className="flex flex-col h-full">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          {/* Board Actions */}
          <div className="flex items-center gap-2 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                <MoreHorizontal className="size-4 mr-1" />
                Board Actions
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleEditBoard(selectedBoard)}>
                  <Pencil className="size-4 mr-2" />
                  Edit Board
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDeleteBoard(selectedBoard.id)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="text-sm text-muted-foreground">
              {boards.length} board{boards.length !== 1 ? 's' : ''} for this customer
            </div>
          </div>

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
                <div
                  className={cn(
                    "flex-1 min-h-24 overflow-y-auto rounded-lg border border-transparent p-1 transition-colors",
                    dragOverTarget?.status === column.id &&
                      dragOverTarget.taskId === null &&
                      "border-dashed border-primary/40 bg-primary/5",
                  )}
                  onDragOver={(event) =>
                    handleColumnDragOver(event, column.id)
                  }
                  onDrop={(event) => handleTaskDrop(event, column.id, null)}
                >
                  <div className="flex flex-col gap-2">
                  {tasksByStatus[column.id]?.map((task) => {
                    const taskAssignee = teamMembers.find(
                      (u) => u.id === task.assigned_to,
                    );
                    const isDragging = draggingTask?.id === task.id;
                    const isDropTarget =
                      dragOverTarget?.status === column.id &&
                      dragOverTarget.taskId === task.id &&
                      draggingTask?.id !== task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        className={cn(
                          "group relative rounded-lg border bg-card p-4 transition-colors",
                          "cursor-pointer hover:border-primary/30",
                          isDragging && "opacity-50 ring-1 ring-primary/40",
                          isDropTarget &&
                            "border-primary/50 bg-primary/5 before:absolute before:inset-x-3 before:-top-1 before:h-0.5 before:rounded-full before:bg-primary",
                        )}
                        onDragStart={(event) =>
                          handleTaskDragStart(event, task)
                        }
                        onDragOver={(event) =>
                          handleTaskDragOver(event, column.id, task.id)
                        }
                        onDrop={(event) =>
                          handleTaskDrop(event, column.id, task.id)
                        }
                        onDragEnd={handleTaskDragEnd}
                        onClick={() => handleEditTask(task)}
                      >
                        {/* Header: Title + Menu */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100" />
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
                              <CalendarIcon className="size-3" />
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
              </div>
            ))}
          </div>
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
                : `Create a new task on ${selectedBoard?.name || "this board"}`}
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
                onValueChange={(v) =>
                  setTaskForm({
                    ...taskForm,
                    assigned_to: !v || v === "unassigned" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to...">
                    {(() => {
                      const member = teamMembers.find(m => m.id === taskForm.assigned_to);
                      if (!taskForm.assigned_to || taskForm.assigned_to === "unassigned") {
                        return (
                          <div className="flex items-center gap-2">
                            <UserCircle className="size-4 text-muted-foreground" />
                            <span>Unassigned</span>
                          </div>
                        );
                      }
                      if (member) {
                        return (
                          <div className="flex items-center gap-2">
                            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary border border-primary/20">
                              {getUserInitials(member)}
                            </div>
                            <span>{getUserDisplayName(member)}</span>
                          </div>
                        );
                      }
                      return <span>Assign to...</span>;
                    })()}
                  </SelectValue>
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
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "w-full justify-start text-left font-normal flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    !taskForm.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {taskForm.due_date ? (
                    format(parseISO(taskForm.due_date), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={taskForm.due_date ? parseISO(taskForm.due_date) : undefined}
                    onSelect={(date) =>
                      setTaskForm({
                        ...taskForm,
                        due_date: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

      {/* Board Dialog */}
      <Dialog
        open={isBoardDialogOpen}
        onOpenChange={setIsBoardDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBoard ? "Edit Board" : "New Board"}</DialogTitle>
            <DialogDescription>
              {editingBoard
                ? "Update the board details"
                : `Create a new kanban board for ${selectedCustomer?.name || "this customer"}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBoard} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="b-name">Board Name</Label>
              <Input
                id="b-name"
                value={boardForm.name}
                onChange={(e) =>
                  setBoardForm({ ...boardForm, name: e.target.value })
                }
                placeholder="Board name..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="b-description">Description (optional)</Label>
              <Textarea
                id="b-description"
                value={boardForm.description}
                onChange={(e) =>
                  setBoardForm({ ...boardForm, description: e.target.value })
                }
                placeholder="Brief description of this board..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="b-default"
                checked={boardForm.is_default}
                onChange={(e) =>
                  setBoardForm({ ...boardForm, is_default: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="b-default" className="text-sm cursor-pointer">
                Set as default board for this customer
              </Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBoardDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {editingBoard ? "Update Board" : "Create Board"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
