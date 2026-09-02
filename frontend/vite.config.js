import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Hostnames a tunnel (ngrok) can hand you. Vite refuses requests whose Host
// header it doesn't recognise — a DNS-rebinding protection — so these have to
// be listed. A leading dot means "this domain and any subdomain of it", which
// matters because a free ngrok account gives you a different random name
// (tasty-garri-1234.ngrok-free.app) every single run.
const TUNNEL_HOSTS = [".ngrok-free.app", ".ngrok.app", ".ngrok.io", ".ngrok-free.dev"];

// While developing, the frontend and Laravel still run as two processes —
// `npm run dev` here (port 5173) and `php artisan serve` (port 8000) — with
// Vite quietly proxying /api and /storage through to Laravel so the browser
// only ever talks to one origin. In production there's no proxy: `npm run
// build` writes straight into ../public/build-frontend, and Laravel (see
// routes/web.php) serves that build directly — one app, one process, one
// thing to deploy to cPanel.
const BACKEND_PROXY = {
  "/api": { target: "http://127.0.0.1:8000", changeOrigin: false },
  "/storage": { target: "http://127.0.0.1:8000", changeOrigin: false },
};

export default defineConfig({
  plugins: [react()],

  // Every built asset is referenced as /build-frontend/... so it works no
  // matter what subpath (if any) the app is deployed under.
  base: "/build-frontend/",

  build: {
    outDir: "../public/build-frontend",
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    allowedHosts: TUNNEL_HOSTS,
    proxy: BACKEND_PROXY,
  },

  preview: {
    port: 5173,
    allowedHosts: TUNNEL_HOSTS,
    proxy: BACKEND_PROXY,
  },
});
