import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gateway =
    env.VITE_DEV_PROXY_TARGET?.replace(/\/$/, "") || "http://localhost:8080";
  const localCacheRoot =
    process.env.LOCALAPPDATA || path.join(process.cwd(), ".local-cache");


  return {
    cacheDir: path.join(localCacheRoot, "finalproject-vite-cache"),
    plugins: [react(), tailwindcss()],
    define: {
      global: "globalThis",
    },
    optimizeDeps: {
      include: [
        "docx-preview",
        "@syncfusion/ej2-base",
        "@syncfusion/ej2-react-documenteditor",
        "@syncfusion/ej2-react-pdfviewer",
        "@syncfusion/ej2-react-spreadsheet",
      ],
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // REST gateway (auth, users, blogs, notifications, VC under /api, etc.)
        "/api": { target: gateway, changeOrigin: true },
        "/file": { target: gateway, changeOrigin: true },
        "/auth": { target: gateway, changeOrigin: true },
        "/repos": { target: gateway, changeOrigin: true },
        "/students": { target: gateway, changeOrigin: true },
        "/departments": { target: gateway, changeOrigin: true },
        "/batches": { target: gateway, changeOrigin: true },
        "/teachers": { target: gateway, changeOrigin: true },
        "/employees": { target: gateway, changeOrigin: true },
      },
    },
  };
});
