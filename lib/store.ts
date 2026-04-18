import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KanbanStore {
  // Selected customer and board
  selectedCustomerId: string | null;
  selectedBoardId: string | null;
  
  // Actions
  setSelectedCustomer: (customerId: string | null) => void;
  setSelectedBoard: (boardId: string | null) => void;
  clearSelection: () => void;
}

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set) => ({
      selectedCustomerId: null,
      selectedBoardId: null,
      
      setSelectedCustomer: (customerId) => 
        set({ selectedCustomerId: customerId, selectedBoardId: null }),
      
      setSelectedBoard: (boardId) => 
        set({ selectedBoardId: boardId }),
      
      clearSelection: () => 
        set({ selectedCustomerId: null, selectedBoardId: null }),
    }),
    {
      name: "kanban-storage",
    }
  )
);

// Sidebar collapsible state store
interface SidebarStore {
  openGroups: Record<string, boolean>;
  setGroupOpen: (groupTitle: string, isOpen: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      // Default: all groups expanded (uncollapsed)
      openGroups: {
        "Customers": true,
        "Dockyard": true,
      },
      
      setGroupOpen: (groupTitle, isOpen) =>
        set((state) => ({
          openGroups: {
            ...state.openGroups,
            [groupTitle]: isOpen,
          },
        })),
    }),
    {
      name: "sidebar-storage",
    }
  )
);
