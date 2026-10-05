import { afterEach, expect, test, vi } from 'vitest'
import { logout, restoreSession, saveSession } from './session'

const user = { id: 1, email: 'guest@hosteo.pe', firstName: 'Ana', lastName: 'Lima', roleId: 4, roleCode: 'GUEST' as const }
function token(seconds: number) { return `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }))}.signature` }
afterEach(() => { logout(); vi.useRealTimers(); vi.unstubAllGlobals() })
test('remember persists only until token expiration and logout clears both stores', () => {
  vi.useFakeTimers()
  const accessToken = token(30)
  saveSession(accessToken, user, true)
  expect(localStorage.getItem('hosteo.session')).toBe(accessToken)
  expect(sessionStorage.getItem('hosteo.session')).toBeNull()
  vi.advanceTimersByTime(30000)
  expect(localStorage.getItem('hosteo.session')).toBeNull()
})
test('expired tokens are discarded without contacting the backend', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  sessionStorage.setItem('hosteo.session', token(-60))
  await restoreSession(new AbortController().signal)
  expect(sessionStorage.getItem('hosteo.session')).toBeNull()
  expect(fetch).not.toHaveBeenCalled()
})
test('restored sessions must be accepted by the backend', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  localStorage.setItem('hosteo.session', token(1800))
  await restoreSession(new AbortController().signal)
  expect(localStorage.getItem('hosteo.session')).toBeNull()
})
