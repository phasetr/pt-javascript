import { serve } from "@hono/node-server";
import { app } from "./hono.js";

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	() => {
		console.log("Server is running");
	},
);
