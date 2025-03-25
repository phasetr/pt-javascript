import { serve } from "@hono/node-server";
import { app } from "./hono.js";

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(_info) => {
		console.log("Server is running in dev");
	},
);
