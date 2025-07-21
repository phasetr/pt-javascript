import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      persistState: true,
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    rollupOptions: {
      // 外部依存を指定しない（すべてバンドルに含める）
      external: [],
    },
    // drizzle-ormとそのサブパスをバンドルに含めるための設定
    commonjsOptions: {
      include: [/drizzle-orm/, /node_modules/],
    },
  },
  optimizeDeps: {
    // drizzle-ormとそのサブパスを最適化対象に含める
    include: ["drizzle-orm", "drizzle-orm/d1"],
  },
});
