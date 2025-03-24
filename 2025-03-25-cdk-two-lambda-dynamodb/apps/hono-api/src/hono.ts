import { Hono } from "hono";

export const app = new Hono();

app.get("/", (c) => {
	console.log("SERVER LOG for root '/'");
	return c.text("Hello Lambda in Hono!");
});
