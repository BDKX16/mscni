import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import type { ReactNode } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#9c27b0",
    },
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      "sans-serif",
    ].join(","),
  },
  shape: {
    borderRadius: 8,
  },
});

// ─── Providers ────────────────────────────────────────────────────────────────

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
