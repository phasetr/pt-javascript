import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("customers", "routes/customers.tsx"),
  route("customers/:id", "routes/customers.$id.tsx"),
  route("customers/new", "routes/customers.new.tsx"),
  route("customers/:id/edit", "routes/customers.$id.edit.tsx"),
  route("customers/:id/delete", "routes/customers.$id.delete.tsx")
] satisfies RouteConfig;
