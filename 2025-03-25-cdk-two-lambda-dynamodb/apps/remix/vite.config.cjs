"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dev_1 = require("@remix-run/dev");
const vite_1 = require("vite");
const vite_tsconfig_paths_1 = require("vite-tsconfig-paths");
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, dev_1.vitePlugin)({
            future: {
                v3_fetcherPersist: true,
                v3_relativeSplatPath: true,
                v3_throwAbortReason: true,
                v3_singleFetch: true,
                v3_lazyRouteDiscovery: true,
            },
        }),
        (0, vite_tsconfig_paths_1.default)(),
    ],
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZS5jb25maWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ2aXRlLmNvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHdDQUFxRDtBQUNyRCwrQkFBb0M7QUFDcEMsNkRBQWdEO0FBUWhELGtCQUFlLElBQUEsbUJBQVksRUFBQztJQUMxQixPQUFPLEVBQUU7UUFDUCxJQUFBLGdCQUFLLEVBQUM7WUFDSixNQUFNLEVBQUU7Z0JBQ04saUJBQWlCLEVBQUUsSUFBSTtnQkFDdkIsb0JBQW9CLEVBQUUsSUFBSTtnQkFDMUIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLHFCQUFxQixFQUFFLElBQUk7YUFDNUI7U0FDRixDQUFDO1FBQ0YsSUFBQSw2QkFBYSxHQUFFO0tBQ2hCO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gXCJAcmVtaXgtcnVuL2RldlwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XG5cbmRlY2xhcmUgbW9kdWxlIFwiQHJlbWl4LXJ1bi9ub2RlXCIge1xuICBpbnRlcmZhY2UgRnV0dXJlIHtcbiAgICB2M19zaW5nbGVGZXRjaDogdHJ1ZTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVtaXgoe1xuICAgICAgZnV0dXJlOiB7XG4gICAgICAgIHYzX2ZldGNoZXJQZXJzaXN0OiB0cnVlLFxuICAgICAgICB2M19yZWxhdGl2ZVNwbGF0UGF0aDogdHJ1ZSxcbiAgICAgICAgdjNfdGhyb3dBYm9ydFJlYXNvbjogdHJ1ZSxcbiAgICAgICAgdjNfc2luZ2xlRmV0Y2g6IHRydWUsXG4gICAgICAgIHYzX2xhenlSb3V0ZURpc2NvdmVyeTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgdHNjb25maWdQYXRocygpLFxuICBdLFxufSk7XG4iXX0=