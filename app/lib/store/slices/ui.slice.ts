import type { StateCreator } from "zustand";
import type { BoundStore } from "../index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UiSlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createUiSlice: StateCreator<BoundStore, [["zustand/devtools", never]], [], UiSlice> = (
  set,
) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }), false, "ui/toggleSidebar"),
  setSidebarOpen: (open) => set({ sidebarOpen: open }, false, "ui/setSidebarOpen"),
});
