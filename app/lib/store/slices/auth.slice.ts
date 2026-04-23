import type { StateCreator } from "zustand";
import type { BoundStore } from "../index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthSlice {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

export const createAuthSlice: StateCreator<
  BoundStore,
  [["zustand/devtools", never]],
  [],
  AuthSlice
> = (set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) =>
    set({ user, token, isAuthenticated: true }, false, "auth/setAuth"),

  clearAuth: () =>
    set({ user: null, token: null, isAuthenticated: false }, false, "auth/clearAuth"),
});
