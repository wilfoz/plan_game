import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
      },
      proxy: {
        "/api/claude": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/claude/, "/v1/messages"),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("x-api-key", env.ANTHROPIC_API_KEY || "");
              proxyReq.setHeader("anthropic-version", "2023-06-01");
              proxyReq.setHeader("content-type", "application/json");
              // Remove cabeçalhos de origem para que a Anthropic trate como server-to-server
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
            });
          },
        },
      },
    },
  }
})
