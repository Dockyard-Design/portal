"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Receipt, Plus, Search, MoreVertical, Edit, Trash2, Eye, Download, ChevronLeft, ChevronRight, Building, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Expense, ExpenseCategory, RecurringFrequency } from "@/types/expense";

const ITEMS_PER_PAGE = 25;
const RECURRING_FREQUENCIES: RecurringFrequency[] = ["monthly", "quarterly", "yearly"];

// Month Navigator using ShadCN
function MonthNavigator({ 
  currentDate, 
  onChange 
}: { 
  currentDate: Date; 
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(subMonths(currentDate, 1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-normal ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <CalendarIcon className="size-4" />
          {format(currentDate, "MMMM yyyy")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(addMonths(currentDate, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

// Compact Category Dropdown
function CategoryDropdown({ 
  categories, 
  value, 
  onChange, 
  placeholder = "All Categories",
  showAll = true 
}: { 
  categories: ExpenseCategory[]; 
  value: string; 
  onChange: (v: string) => void;
  placeholder?: string;
  showAll?: boolean;
}) {
  const selected = showAll && value === "all" 
    ? null
    : categories.find((c) => c.id === value);

  return (
    <Popover>
      <PopoverTrigger className="flex w-[160px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground">
        <div className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <span className={`w-2 h-2 rounded-full ${selected.color}`} />
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto py-1">
          {showAll && (
            <button
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                value === "all" && "bg-muted"
              )}
              onClick={() => onChange("all")}
            >
              All Categories
            </button>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2",
                value === cat.id && "bg-muted"
              )}
              onClick={() => onChange(cat.id)}
            >
              <span className={`w-2 h-2 rounded-full ${cat.color}`} />
              {cat.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Date Picker Component with Calendar Popover
function DatePicker({ 
  date, 
  onChange, 
  label 
}: { 
  date: Date; 
  onChange: (date: Date) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="grid gap-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "inline-flex w-full items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-left text-sm font-normal transition-colors hover:bg-accent hover:text-accent-foreground",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
          </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                onChange(d);
                setOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category_id: "",
    expense_date: new Date(),
    vendor: "",
    tax_deductible: false,
    is_recurring: false,
    recurring_frequency: "monthly" as RecurringFrequency,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { getExpenses, getExpenseCategories } = await import("@/app/actions/expenses");
      
      const [expensesData, categoriesData] = await Promise.all([
        getExpenses(),
        getExpenseCategories(),
      ]);
      
      setExpenses(expensesData);
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setFormData((prev) =>
          prev.category_id ? prev : { ...prev, category_id: categoriesData[0].id }
        );
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = searchQuery
      ? expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = categoryFilter === "all" || expense.category_id === categoryFilter;
    
    const expenseDate = parseISO(expense.expense_date);
    const matchesMonth = isWithinInterval(expenseDate, { 
      start: startOfMonth(filterDate), 
      end: endOfMonth(filterDate) 
    });
    
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleView = (expense: Expense) => {
    setSelectedExpense(expense);
    setViewModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      category_id: categories[0]?.id || "",
      expense_date: new Date(),
      vendor: "",
      tax_deductible: false,
      is_recurring: false,
      recurring_frequency: "monthly",
    });
    setAddModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || "",
      amount: expense.amount.toString(),
      category_id: expense.category_id,
      expense_date: parseISO(expense.expense_date),
      vendor: expense.vendor || "",
      tax_deductible: expense.tax_deductible,
      is_recurring: expense.is_recurring,
      recurring_frequency: expense.recurring_frequency || "monthly",
    });
    setEditModalOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedExpense) return;
    try {
      const { deleteExpense } = await import("@/app/actions/expenses");
      await deleteExpense(selectedExpense.id);
      await loadData();
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeleteModalOpen(false);
      setSelectedExpense(null);
    }
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.category_id) {
      toast.error("Please select a category");
      return;
    }

    setSaving(true);
    try {
      const { createExpense } = await import("@/app/actions/expenses");
      await createExpense({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        expense_date: format(formData.expense_date, "yyyy-MM-dd"),
        vendor: formData.vendor.trim() || undefined,
        tax_deductible: formData.tax_deductible,
        is_recurring: formData.is_recurring,
        recurring_frequency: formData.is_recurring ? formData.recurring_frequency : undefined,
      });
      toast.success("Expense created");
      setAddModalOpen(false);
      await loadData();
    } catch {
      toast.error("Failed to create expense");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    
    setSaving(true);
    try {
      const { updateExpense } = await import("@/app/actions/expenses");
      await updateExpense(selectedExpense.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id,
        expense_date: format(formData.expense_date, "yyyy-MM-dd"),
        vendor: formData.vendor.trim() || null,
        tax_deductible: formData.tax_deductible,
        is_recurring: formData.is_recurring,
        recurring_frequency: formData.is_recurring ? formData.recurring_frequency : null,
      });
      toast.success("Expense updated");
      setEditModalOpen(false);
      await loadData();
    } catch {
      toast.error("Failed to update expense");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setFilterDate(new Date());
    setCurrentPage(1);
  };

  const hasFilters = searchQuery || categoryFilter !== "all";
  const monthTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Receipt className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Expenses</h1>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} expenses • £{monthTotal.toLocaleString()} total
            </p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="size-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, vendor, category..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <MonthNavigator 
                currentDate={filterDate} 
                onChange={(date) => { setFilterDate(date); setCurrentPage(1); }} 
              />
              <CategoryDropdown 
                categories={categories} 
                value={categoryFilter} 
                onChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }} 
              />
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>All Expenses</span>
            {monthTotal > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                {format(filterDate, "MMMM yyyy")}: £{monthTotal.toLocaleString()}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded" />)}
            </div>
          ) : paginatedExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="size-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters ? "Try adjusting your filters" : "Add your first expense to get started"}
              </p>
              {!hasFilters && <Button onClick={handleAdd}>Add Expense</Button>}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-lg ${expense.category?.color || "bg-slate-500"} flex items-center justify-center shrink-0`}>
                            <span className="text-white text-sm font-medium">
                              {expense.category?.name.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{expense.title}</p>
                            {expense.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{expense.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-sm">{expense.category?.name || "-"}</span></TableCell>
                      <TableCell><span className="text-sm">{expense.vendor || "-"}</span></TableCell>
                      <TableCell><span className="text-sm">{format(parseISO(expense.expense_date), "MMM d, yyyy")}</span></TableCell>
                      <TableCell><span className="font-semibold">£{expense.amount.toLocaleString()}</span></TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {expense.tax_deductible && <Badge variant="secondary" className="text-xs">Tax</Badge>}
                          {expense.is_recurring && (
                            <Badge variant="outline" className="text-xs">
                              {expense.recurring_frequency?.charAt(0).toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleView(expense)}>
                              <Eye className="size-4 mr-2" />View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(expense)}>
                              <Edit className="size-4 mr-2" />Edit
                            </DropdownMenuItem>
                            {expense.receipt_url && (
                              <DropdownMenuItem >
                                <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="size-4 mr-2" />Receipt
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense)}>
                              <Trash2 className="size-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)} of {filteredExpenses.length} expenses
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* VIEW MODAL */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="size-5" />
              Expense Details
            </DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-6">
              <div className="p-6 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-14 rounded-lg ${selectedExpense.category?.color} flex items-center justify-center`}>
                      <Receipt className="size-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{selectedExpense.category?.name}</p>
                      <p className="text-4xl font-bold">£{selectedExpense.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {selectedExpense.tax_deductible && <Badge variant="secondary">Tax Deductible</Badge>}
                    {selectedExpense.is_recurring && <Badge variant="outline">Recurring • {selectedExpense.recurring_frequency}</Badge>}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="text-lg font-medium">{selectedExpense.title}</p>
                </div>
                
                {selectedExpense.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{selectedExpense.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p>{format(parseISO(selectedExpense.expense_date), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Vendor</p>
                      <p>{selectedExpense.vendor || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${selectedExpense.category?.color}`} />
                      <p>{selectedExpense.category?.name}</p>
                    </div>
                  </div>
                </div>

                {selectedExpense.receipt_url && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Receipt</p>
                    <Button variant="outline" >
                      <a href={selectedExpense.receipt_url} target="_blank" rel="noopener noreferrer">
                        <Download className="size-4 mr-2" />View Receipt
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
                <Button onClick={() => { setViewModalOpen(false); handleEdit(selectedExpense); }}>
                  <Edit className="size-4 mr-2" />Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD MODAL */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[800px] w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5" />
              Add New Expense
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="add-title">Title *</Label>
                <Input
                  id="add-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Office Rent"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="add-description">Description</Label>
                <Textarea
                  id="add-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Amount (£) *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <DatePicker 
                  date={formData.expense_date} 
                  onChange={(date) => setFormData({ ...formData, expense_date: date })}
                  label="Date *"
                />
              </div>

              <div className="grid gap-2">
                <Label>Category *</Label>
                <CategoryDropdown 
                  categories={categories} 
                  value={formData.category_id} 
                  onChange={(v) => setFormData({ ...formData, category_id: v })}
                  placeholder="Select category"
                  showAll={false}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="add-vendor">Vendor</Label>
                <Input
                  id="add-vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="e.g., Amazon"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="add-tax"
                  checked={formData.tax_deductible}
                  onCheckedChange={(checked) => setFormData({ ...formData, tax_deductible: checked as boolean })}
                />
                <Label htmlFor="add-tax" className="font-normal cursor-pointer">Tax deductible expense</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="add-recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked as boolean })}
                  />
                  <Label htmlFor="add-recurring" className="font-normal cursor-pointer">Recurring expense</Label>
                </div>
                {formData.is_recurring && (
                  <Popover>
                    <PopoverTrigger className="ml-6 flex w-[160px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                      {formData.recurring_frequency.charAt(0).toUpperCase() + formData.recurring_frequency.slice(1)}
                      <ChevronLeft className="size-4 rotate-[-90deg]" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[160px] p-0">
                      <div className="py-1">
                        {RECURRING_FREQUENCIES.map((freq) => (
                          <button
                            key={freq}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                              formData.recurring_frequency === freq && "bg-muted"
                            )}
                            onClick={() => setFormData({ ...formData, recurring_frequency: freq })}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Expense"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[800px] w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5" />
              Edit Expense
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Amount (£) *</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <DatePicker 
                  date={formData.expense_date} 
                  onChange={(date) => setFormData({ ...formData, expense_date: date })}
                  label="Date *"
                />
              </div>

              <div className="grid gap-2">
                <Label>Category *</Label>
                <CategoryDropdown 
                  categories={categories} 
                  value={formData.category_id} 
                  onChange={(v) => setFormData({ ...formData, category_id: v })}
                  placeholder="Select category"
                  showAll={false}
                />
              </div>

              <div className="grid gap-2">
                <Label>Vendor</Label>
                  <Input
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-tax"
                  checked={formData.tax_deductible}
                  onCheckedChange={(checked) => setFormData({ ...formData, tax_deductible: checked as boolean })}
                />
                <Label htmlFor="edit-tax" className="font-normal cursor-pointer">Tax deductible expense</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked as boolean })}
                  />
                  <Label htmlFor="edit-recurring" className="font-normal cursor-pointer">Recurring expense</Label>
                </div>
                {formData.is_recurring && (
                  <Popover>
                    <PopoverTrigger className="ml-6 flex w-[160px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                      {formData.recurring_frequency.charAt(0).toUpperCase() + formData.recurring_frequency.slice(1)}
                      <ChevronLeft className="size-4 rotate-[-90deg]" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[160px] p-0">
                      <div className="py-1">
                        {RECURRING_FREQUENCIES.map((freq) => (
                          <button
                            key={freq}
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                              formData.recurring_frequency === freq && "bg-muted"
                            )}
                            onClick={() => setFormData({ ...formData, recurring_frequency: freq })}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete &quot;{selectedExpense?.title}&quot;? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
