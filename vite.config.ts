import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Target is your backend API
      "/grist": {
        target: "https://docs.getgrist.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/grist/, ""),

        configure: (proxy, options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Request sent to target:", req.method, req.url);
            console.log("Req headers", req.headers);
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("sec-fetch-dest");
            proxyReq.removeHeader("sec-fetch-mode");
            proxyReq.removeHeader("sec-fetch-site");
            proxyReq.removeHeader("referer");
            //proxyReq.removeHeader("content-type");
            console.log("Req headers", req.headers);

            console.log("proxyReq headers", proxyReq.getHeaders());
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log(
              "Response received from target:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
