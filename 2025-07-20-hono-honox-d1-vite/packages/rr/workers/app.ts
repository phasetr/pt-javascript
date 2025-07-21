// @ts-nocheck
import { createRequestHandler } from "react-router";

export interface Env {
  DB: D1Database;
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  "production",
);

export default {
  async fetch(request, env, ctx) {
    return await requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
};