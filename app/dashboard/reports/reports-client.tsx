"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CalendarIcon,
  Download,
  Filter,
  Landmark,
  Receipt,
  Scale,
} from "lucide-react";
import type { Invoice } from "@/types/agency";
import type { Expense } from "@/types/expense";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReportPeriod = "month" | "year";

type MonthlyReportRow = {
  month: string;
  earnings: number;
  expenses: number;
  profit: number;
};

interface ReportsClientProps {
  invoices: Invoice[];
  expenses: Expense[];
  monthlyRows: MonthlyReportRow[];
  availableMonths: string[];
  availableYears: string[];
}

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
});

function getReportDate(invoice: Invoice): string {
  return invoice.paid_at || invoice.issue_date || invoice.created_at;
}

function isInPeriod(date: string, period: ReportPeriod, value: string): boolean {
  if (period === "month") return date.slice(0, 7) === value;
  return date.slice(0, 4) === value;
}

function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

function getMonthOptions(availableMonths: string[]): string[] {
  const currentMonth = getCurrentMonth();
  return availableMonths.includes(currentMonth) ? availableMonths : [currentMonth, ...availableMonths];
}

function getYearOptions(availableYears: string[]): string[] {
  const currentYear = getCurrentYear();
  return availableYears.includes(currentYear) ? availableYears : [currentYear, ...availableYears];
}

function monthValueToDate(value: string): Date {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function dateToMonthValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function ReportsClient({
  invoices,
  expenses,
  monthlyRows,
  availableMonths,
  availableYears,
}: ReportsClientProps) {
  const monthOptions = useMemo(() => getMonthOptions(availableMonths), [availableMonths]);
  const yearOptions = useMemo(() => getYearOptions(availableYears), [availableYears]);
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0] ?? getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(yearOptions[0] ?? getCurrentYear());

  const selectedValue = period === "month" ? selectedMonth : selectedYear;
  const selectedLabel = period === "month" ? formatMonth(selectedMonth) : selectedYear;
  const pdfUrl = `/api/reports/financial?period=${period}&value=${encodeURIComponent(selectedValue)}`;

  const filteredInvoices = useMemo(
    () => invoices.filter((invoice) => isInPeriod(getReportDate(invoice), period, selectedValue)),
    [invoices, period, selectedValue]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((expense) => isInPeriod(expense.expense_date, period, selectedValue)),
    [expenses, period, selectedValue]
  );
  const filteredMonthlyRows = useMemo(
    () =>
      period === "month"
        ? monthlyRows.filter((row) => row.month === selectedMonth)
        : monthlyRows.filter((row) => row.month.startsWith(selectedYear)),
    [monthlyRows, period, selectedMonth, selectedYear]
  );

  const totals = useMemo(() => {
    const earnings = filteredInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.amount_paid || 0),
      0
    );
    const invoiced = filteredInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const outstanding = filteredInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.balance_due || 0),
      0
    );
    const expenseTotal = filteredExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );
    const taxDeductible = filteredExpenses
      .filter((expense) => expense.tax_deductible)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      earnings,
      invoiced,
      expenses: expenseTotal,
      profit: earnings - expenseTotal,
      outstanding,
      taxDeductible,
      invoiceCount: filteredInvoices.length,
      expenseCount: filteredExpenses.length,
    };
  }, [filteredExpenses, filteredInvoices]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end lg:p-7">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Landmark className="size-3" />
                Financial reporting
              </Badge>
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <CalendarDays className="size-3" />
                {selectedLabel}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Reports</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Build a traceable month or year report with invoices, payments, expenses,
              categories, receipts, line items, balances, and generation metadata in the PDF.
            </p>
          </div>

          <Card className="border-border/70 bg-background/45 py-4">
            <CardHeader className="px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="size-4 text-primary" />
                Report period
              </CardTitle>
              <CardDescription>Choose exactly what the PDF should cover.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={period === "month" ? "default" : "outline"}
                  onClick={() => setPeriod("month")}
                >
                  Month
                </Button>
                <Button
                  type="button"
                  variant={period === "year" ? "default" : "outline"}
                  onClick={() => setPeriod("year")}
                >
                  Year
                </Button>
              </div>

              {period === "month" ? (
                <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
              ) : (
                <YearPicker value={selectedYear} years={yearOptions} onChange={setSelectedYear} />
              )}

              <Button asChild className="h-10 gap-2">
                <a href={pdfUrl}>
                  <Download className="size-4" />
                  Download PDF
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Earnings"
          value={currency.format(totals.earnings)}
          detail={`${totals.invoiceCount} invoice records`}
          icon={<ArrowUpRight className="size-4" />}
        />
        <MetricCard
          label="Expenses"
          value={currency.format(totals.expenses)}
          detail={`${totals.expenseCount} expense records`}
          icon={<ArrowDownRight className="size-4" />}
        />
        <MetricCard
          label="Profit"
          value={currency.format(totals.profit)}
          detail={`${currency.format(totals.invoiced)} invoiced value`}
          icon={<Scale className="size-4" />}
        />
        <MetricCard
          label="Outstanding"
          value={currency.format(totals.outstanding)}
          detail={`${currency.format(totals.taxDeductible)} tax deductible`}
          icon={<Receipt className="size-4" />}
        />
      </div>

      <Card className="border-border/70 bg-card/95">
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>
            {period === "month"
              ? "The selected month as it will appear in the report."
              : "Every month included in the selected year."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMonthlyRows.length > 0 ? (
                filteredMonthlyRows.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{formatMonth(row.month)}</TableCell>
                    <TableCell className="text-right">{currency.format(row.earnings)}</TableCell>
                    <TableCell className="text-right">{currency.format(row.expenses)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {currency.format(row.profit)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No invoice or expense activity for this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = monthValueToDate(value);

  return (
    <div className="grid gap-2">
      <Label>Month</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="inline-flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <CalendarIcon className="mr-2 size-4" />
          {formatMonth(value)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            captionLayout="dropdown"
            onSelect={(date) => {
              if (!date) return;
              onChange(dateToMonthValue(date));
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function YearPicker({
  value,
  years,
  onChange,
}: {
  value: string;
  years: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-2">
      <Label>Year</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="inline-flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <CalendarIcon className="mr-2 size-4" />
          {value}
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start">
          <div className="grid grid-cols-2 gap-2">
            {years.map((year) => (
              <Button
                key={year}
                type="button"
                variant={year === value ? "default" : "outline"}
                onClick={() => {
                  onChange(year);
                  setOpen(false);
                }}
              >
                {year}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
          {label}
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
