import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("users", "routes/users.tsx"),
  route("users/new", "routes/users.new.tsx"),
  route("users/:id", "routes/users.$id.tsx"),
  route("users/:id/edit", "routes/users.$id.edit.tsx"),
] satisfies RouteConfig;
