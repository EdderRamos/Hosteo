import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (command === 'build') {
    const apiUrl = env.VITE_API_URL?.trim()
    if (!apiUrl || !/^https:\/\//i.test(apiUrl)) {
      throw new Error('Configura VITE_API_URL con la URL HTTPS completa de la API (incluye /api/v1) antes de compilar para producción.')
    }
    new URL(apiUrl)
  }
  const proxyTarget = env.DEV_API_PROXY_URL?.trim()
  return {
    plugins: [react()],
    server: {
      proxy: proxyTarget ? { '/api': { target: proxyTarget, changeOrigin: true } } : undefined,
    },
  }
})
