// Vercel supplies this value at build time. Local development uses the Vite proxy.
export const API_BASE_URL = (import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? '/api/v1' : '')).replace(/\/+$/, '')
