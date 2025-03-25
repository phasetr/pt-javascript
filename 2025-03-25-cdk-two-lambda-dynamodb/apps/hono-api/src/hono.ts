import { Hono } from "hono";
import { cors } from "hono/cors";

export const app = new Hono();
app.use("*", cors());
app.get("/", (c) => {
	console.log("SERVER LOG for root '/'");
	return c.text("Hello Lambda in Hono!");
});
