import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode — all data fetching happens in the browser via clientLoader
  ssr: false,
} satisfies Config;
