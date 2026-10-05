import { useSyncExternalStore } from 'react'
import { currentUser } from './api/auth'
import type { AuthUser } from './schemas/login'

const KEY = 'hosteo.session'
type Session = { accessToken: string; user: AuthUser; expiresAt: number }
let session: Session | null = null
let revision = 0
let expiryTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()
function notify() { listeners.forEach((listener) => listener()) }
function clearStorage() {
  try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) } catch { /* Session still works in memory when storage is blocked. */ }
}
export function logout() {
  revision += 1
  session = null
  clearTimeout(expiryTimer)
  clearStorage()
  notify()
}
function expiration(token: string): number {
  try {
    const payload: unknown = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload === 'object' && payload !== null && 'exp' in payload && typeof payload.exp === 'number') return payload.exp * 1000
  } catch { /* A malformed token is never retained. */ }
  return 0
}
function activate(token: string, user: AuthUser) {
  const expiresAt = expiration(token)
  if (expiresAt <= Date.now()) throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.')
  session = { accessToken: token, user, expiresAt }
  clearTimeout(expiryTimer)
  expiryTimer = setTimeout(logout, Math.min(expiresAt - Date.now(), 2147483647))
  notify()
}
export function saveSession(token: string, user: AuthUser, remember: boolean) {
  revision += 1
  clearStorage()
  activate(token, user)
  try { (remember ? localStorage : sessionStorage).setItem(KEY, token) } catch { /* Memory-only fallback. */ }
}
export function updateSessionUser(user: Omit<AuthUser, 'roleCode'>, token: string) {
  if (!session || session.accessToken !== token) return
  session = { ...session, user: { ...session.user, ...user } }
  revision += 1
  notify()
}
export async function restoreSession(signal: AbortSignal) {
  const initialRevision = revision
  let token: string | null
  try { token = sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY) } catch { return }
  if (!token) return
  if (expiration(token) <= Date.now()) { logout(); return }
  try {
    const user = await currentUser(token, signal)
    if (!signal.aborted && revision === initialRevision) activate(token, user)
  } catch {
    if (!signal.aborted && revision === initialRevision) logout()
  }
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function useSession() { return useSyncExternalStore(subscribe, () => session) }
