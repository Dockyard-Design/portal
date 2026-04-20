"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import type { RecentRequest } from "@/lib/api-keys";

const ITEMS_PER_PAGE = 10;

interface ApiRequestsTableProps {
  requests: RecentRequest[];
}

export function ApiRequestsTable({ requests }: ApiRequestsTableProps) {
  const [page, setPage] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<RecentRequest | null>(
    null,
  );
  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const paginatedRequests = requests.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  const handlePrevPage = () => setPage((p) => Math.max(0, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return {
        label: String(status),
        className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      };
    }
    if (status >= 400) {
      return {
        label: String(status),
        className: "bg-red-500/10 text-red-600 border-red-500/20",
      };
    }
    return {
      label: String(status),
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    };
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Recent API Requests</h2>
          <span className="text-sm text-muted-foreground ml-2">
            Last {requests.length} requests
          </span>
        </div>

        <div className="rounded-xl border border-border/40 bg-background overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead className="w-75">Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Auth</TableHead>
                <TableHead className="w-30">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No API requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((req) => {
                  const statusBadge = getStatusBadge(req.status_code);
                  return (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-secondary/30"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            req.method === "GET"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono"
                              : "bg-violet-500/10 text-violet-600 border-violet-500/20 font-mono"
                          }
                        >
                          {req.method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm font-mono text-muted-foreground">
                          {req.path}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusBadge.className}
                        >
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {req.response_time_ms}ms
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge
                            variant="outline"
                            className={
                              req.auth_method === "clerk"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20 w-fit"
                                : "bg-violet-500/10 text-violet-600 border-violet-500/20 w-fit"
                            }
                          >
                            {req.auth_method === "clerk"
                              ? "Session"
                              : "API Key"}
                          </Badge>
                          {req.auth_method === "api-key" && req.api_key && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {req.api_key.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(req.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-secondary/10">
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevPage}
                  disabled={page === 0}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextPage}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">
                    Method
                  </Label>
                  <Badge
                    variant="outline"
                    className={
                      selectedRequest.method === "GET"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono mt-1"
                        : "bg-violet-500/10 text-violet-600 border-violet-500/20 font-mono mt-1"
                    }
                  >
                    {selectedRequest.method}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">
                    Status
                  </Label>
                  <Badge
                    variant="outline"
                    className={
                      getStatusBadge(selectedRequest.status_code).className +
                      " mt-1"
                    }
                  >
                    {selectedRequest.status_code}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase">
                  Path
                </Label>
                <code className="block text-sm font-mono bg-secondary/50 p-2 rounded-md mt-1">
                  {selectedRequest.path}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">
                    Response Time
                  </Label>
                  <p className="text-sm font-mono mt-1">
                    {selectedRequest.response_time_ms}ms
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">
                    Auth Method
                  </Label>
                  <Badge
                    variant="outline"
                    className={
                      selectedRequest.auth_method === "clerk"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20 mt-1"
                        : "bg-violet-500/10 text-violet-600 border-violet-500/20 mt-1"
                    }
                  >
                    {selectedRequest.auth_method === "clerk"
                      ? "Session"
                      : "API Key"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase">
                  Timestamp
                </Label>
                <p className="text-sm font-mono mt-1">
                  {new Date(selectedRequest.created_at).toLocaleString()}
                </p>
              </div>

              {selectedRequest.auth_method === "api-key" &&
                selectedRequest.api_key && (
                  <div className="p-3 bg-secondary/30 rounded-md">
                    <Label className="text-xs text-muted-foreground uppercase">
                      API Key Used
                    </Label>
                    <div className="mt-1">
                      <p className="text-sm font-medium">
                        {selectedRequest.api_key.name}
                      </p>
                      <code className="text-xs font-mono text-muted-foreground">
                        {selectedRequest.api_key.key_prefix}...
                      </code>
                    </div>
                  </div>
                )}

              {selectedRequest.auth_method === "api-key" &&
                !(selectedRequest.api_key && selectedRequest.api_key.name) && (
                  <div className="p-3 bg-secondary/30 rounded-md">
                    <Label className="text-xs text-muted-foreground uppercase">
                      API Key Used
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Unknown key
                    </p>
                  </div>
                )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
