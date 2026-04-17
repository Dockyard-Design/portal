"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface RecentRequest {
  id: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  auth_method: string;
  created_at: string;
}

export function ExpandableRequestList({ requests, limit = 5 }: { requests: RecentRequest[]; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = requests.length > limit;
  const visible = expanded ? requests : requests.slice(0, limit);

  if (requests.length === 0) return null;

  return (
    <div>
      <div className="divide-y divide-border/40">
        {visible.map((req) => (
          <div key={req.id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                req.method === "GET" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
              }`}>
                {req.method}
              </span>
              <span className="text-sm font-mono text-muted-foreground">{req.path}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                req.status_code >= 200 && req.status_code < 300
                  ? "bg-emerald-500/10 text-emerald-400"
                  : req.status_code >= 400
                  ? "bg-red-500/10 text-red-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}>
                {req.status_code}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                req.auth_method === "clerk"
                  ? "bg-blue-500/10 text-blue-400"
                  : "bg-violet-500/10 text-violet-400"
              }`}>
                {req.auth_method === "clerk" ? "Session" : "API Key"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {req.response_time_ms}ms
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(req.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-2 hover:bg-secondary/30"
        >
          {expanded ? (
            <>Show less <ChevronUp className="size-3.5" /></>
          ) : (
            <>Show {requests.length - limit} more requests <ChevronDown className="size-3.5" /></>
          )}
        </button>
      )}
    </div>
  );
}