"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { useKanbanStore } from "@/lib/store";
import { KanbanBoard } from "./kanban-board";
import { getBoards, getTasksByStatus } from "@/app/actions/kanban";
import { toast } from "sonner";
import type { Customer, KanbanBoard as Board, ClerkUser, TasksByStatus } from "@/types/kanban";

interface KanbanDataProviderProps {
  initialCustomers: Customer[];
  initialTeamMembers: ClerkUser[];
}

interface KanbanContextType {
  refreshData: () => void;
}

const KanbanContext = createContext<KanbanContextType | null>(null);

export function useKanbanRefresh() {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error("useKanbanRefresh must be used within KanbanDataProvider");
  }
  return context.refreshData;
}

export function KanbanDataProvider({
  initialCustomers,
  initialTeamMembers,
}: KanbanDataProviderProps) {
  const { selectedCustomerId, selectedBoardId, setSelectedBoard } = useKanbanStore();
  const [mounted, setMounted] = useState(false);
  
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>({
    backlog: [],
    todo: [],
    in_progress: [],
    complete: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Load boards when customer changes
  const loadBoards = useCallback(async (customerId: string) => {
    try {
      const boardsData = await getBoards(customerId);
      setBoards(boardsData);
      
      // If we have boards but no selected board, pick the default or first one
      if (boardsData.length > 0 && !selectedBoardId) {
        const defaultBoard = boardsData.find(b => b.is_default) || boardsData[0];
        setSelectedBoard(defaultBoard.id);
      } else if (boardsData.length === 0) {
        setSelectedBoard(null);
      }
    } catch (error) {
      toast.error("Failed to load boards");
    }
  }, [selectedBoardId, setSelectedBoard]);

  // Load tasks when board changes
  const loadTasks = useCallback(async (boardId: string) => {
    if (!boardId) {
      setTasksByStatus({ backlog: [], todo: [], in_progress: [], complete: [] });
      return;
    }
    
    try {
      setIsLoading(true);
      const tasks = await getTasksByStatus(boardId);
      setTasksByStatus(tasks);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load boards when customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      loadBoards(selectedCustomerId);
    } else {
      setBoards([]);
      setTasksByStatus({ backlog: [], todo: [], in_progress: [], complete: [] });
    }
  }, [selectedCustomerId, loadBoards]);

  // Load tasks when board changes
  useEffect(() => {
    if (selectedBoardId) {
      loadTasks(selectedBoardId);
    } else {
      setTasksByStatus({ backlog: [], todo: [], in_progress: [], complete: [] });
    }
  }, [selectedBoardId, loadTasks]);

  // Reload tasks when refresh trigger changes
  useEffect(() => {
    if (selectedBoardId && refreshTrigger > 0) {
      loadTasks(selectedBoardId);
    }
  }, [refreshTrigger, selectedBoardId, loadTasks]);

  // Find selected customer
  const selectedCustomer = initialCustomers.find(c => c.id === selectedCustomerId);

  // Find selected board
  const selectedBoard = selectedBoardId
    ? boards.find(b => b.id === selectedBoardId)
    : undefined;

  // Sync store if selected board no longer exists
  useEffect(() => {
    if (selectedBoardId && boards.length > 0 && !boards.find(b => b.id === selectedBoardId)) {
      // Selected board was deleted or customer changed, clear it
      setSelectedBoard(boards.length > 0 ? (boards.find(b => b.is_default)?.id || boards[0]?.id) : null);
    }
  }, [boards, selectedBoardId, setSelectedBoard]);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <KanbanContext.Provider value={{ refreshData }}>
      <KanbanBoard
        customers={initialCustomers}
        boards={boards}
        teamMembers={initialTeamMembers}
        tasksByStatus={tasksByStatus}
        selectedCustomerId={selectedCustomerId || ""}
        selectedCustomer={selectedCustomer}
        selectedBoard={selectedBoard}
        isLoading={isLoading}
      />
    </KanbanContext.Provider>
  );
}
