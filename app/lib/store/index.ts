import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createAuthSlice, type AuthSlice } from "./slices/auth.slice";
import { createUiSlice, type UiSlice } from "./slices/ui.slice";

// ─── Bound store type (union of all slices) ───────────────────────────────────

export type BoundStore = UiSlice & AuthSlice;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<BoundStore>()(
  devtools(
    (...a) => ({
      ...createUiSlice(...a),
      ...createAuthSlice(...a),
    }),
    { name: "mscni-store" },
  ),
);

// ─── Typed selectors (prevent re-renders on unrelated state changes) ──────────

export const useUi = () => useStore((s) => ({ sidebarOpen: s.sidebarOpen, toggleSidebar: s.toggleSidebar, setSidebarOpen: s.setSidebarOpen }));
export const useAuth = () => useStore((s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated, setAuth: s.setAuth, clearAuth: s.clearAuth }));
