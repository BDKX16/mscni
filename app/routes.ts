import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("http-demo", "routes/http-demo.tsx"),
] satisfies RouteConfig;
