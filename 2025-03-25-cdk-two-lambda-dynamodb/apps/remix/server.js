import { createRequestHandler } from "@remix-run/node";
import * as build from "./build/server/index.js";

export const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});
