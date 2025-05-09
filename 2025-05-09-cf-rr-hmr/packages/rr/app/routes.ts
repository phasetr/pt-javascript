import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("users", "routes/users.tsx"),
	route("products", "routes/products.tsx"),
] satisfies RouteConfig;
