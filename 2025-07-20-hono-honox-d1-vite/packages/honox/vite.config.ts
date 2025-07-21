import { defineConfig } from "vite";
import honox from "honox/vite";
import pages from "@hono/vite-cloudflare-pages";
import adapter from "@hono/vite-dev-server/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { getPlatformProxy } from "wrangler";

export default defineConfig(async () => {
  const { env, dispose } = await getPlatformProxy({
    configPath: "./wrangler.toml",
    persistTo: "../../.wrangler-persist",
  });

  return {
    plugins: [
      tailwindcss(),
      honox({
        devServer: {
          env,
          adapter,
          plugins: [{ onServerClose: dispose }],
        },
      }),
      pages(),
    ],
    build: {
      rollupOptions: {
        external: [],
      },
      commonjsOptions: {
        include: [/drizzle-orm/, /node_modules/],
      },
    },
    optimizeDeps: {
      include: ["drizzle-orm", "drizzle-orm/d1"],
    },
    ssr: {
      noExternal: ["drizzle-orm"],
    },
  };
});
