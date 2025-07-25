import { showRoutes } from "hono/dev";
import { createApp } from "honox/server";
import { dbMiddleware } from "./middleware/db.js";

const app = createApp({
	init: (app) => {
		// データベースミドルウェアを最初に登録
		// app.use("*", dbMiddleware);
	},
});

showRoutes(app);

export default app;
