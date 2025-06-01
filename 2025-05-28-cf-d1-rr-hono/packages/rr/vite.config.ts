import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({
      persistState: {
        path: "../../.wrangler-persist",
      },
      viteEnvironment: {
        name: "ssr",
      },
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
