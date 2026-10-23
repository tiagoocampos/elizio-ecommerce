import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Em build de produção, falha cedo se a API não estiver configurada de forma utilizável,
  // em vez de publicar um site que aponta para localhost.
  if (mode === "production") {
    const env = loadEnv(mode, process.cwd(), "VITE_")
    const apiUrl = env.VITE_API_URL
    if (!apiUrl) {
      throw new Error("VITE_API_URL não definido: configure a URL do backend (ex.: https://sua-api.up.railway.app) nas variáveis do build.")
    }
    if (!/^https:\/\//.test(apiUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(apiUrl)) {
      throw new Error(`VITE_API_URL deve usar https:// em produção (recebido: ${apiUrl}). Páginas https bloqueiam chamadas http.`)
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
