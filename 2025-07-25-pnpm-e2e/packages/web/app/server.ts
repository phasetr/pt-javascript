import { showRoutes } from "hono/dev";
import type { Env } from "hono/types";
import { createApp } from "honox/server";

const app = createApp<Env>();

showRoutes(app);

export default app;
