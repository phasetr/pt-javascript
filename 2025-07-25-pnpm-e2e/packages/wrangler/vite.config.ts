import cloudflare from "@hono/vite-cloudflare-pages";
import honox from "honox/vite";
import { defineConfig } from "vite";

export default defineConfig({
	// @ts-ignore - Vite version mismatch between honox and cloudflare plugins
	plugins: [...honox(), cloudflare()],
});
