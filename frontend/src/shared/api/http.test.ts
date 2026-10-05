import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

test('production requests use the configured Railway API and preserve authorization', async () => {
  vi.stubEnv('VITE_API_URL', 'https://hosteo-production.up.railway.app/api/v1/')
  vi.stubEnv('DEV', false)
  vi.resetModules()
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 })))
  vi.stubGlobal('fetch', fetch)
  const { request } = await import('./http')
  await request('/profile', { headers: { Authorization: 'Bearer test-token' } })
  expect(fetch).toHaveBeenCalledWith('https://hosteo-production.up.railway.app/api/v1/profile', expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } }))
})

test('development retains same-origin requests for the local Vite proxy', async () => {
  vi.stubEnv('VITE_API_URL', '')
  vi.stubEnv('DEV', true)
  vi.resetModules()
  const fetch = vi.fn().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch', fetch)
  const { request } = await import('./http')
  await request('/auth/me')
  expect(fetch.mock.calls[0][0]).toBe('/api/v1/auth/me')
})
