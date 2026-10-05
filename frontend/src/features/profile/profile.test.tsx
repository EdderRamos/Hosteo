import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { ProfilePage } from '../../pages/ProfilePage'
import { logout, saveSession } from '../auth/session'
const profile = { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'ana@example.com', roleId: 4, roleCode: 'GUEST' as const, phone: null, gender: null, dateOfBirth: null, biography: null, occupation: null, location: null, avatarUrl: null, languages: [], interests: [], memberSince: '2026-01-01T00:00:00Z', version: 2 }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup() { saveSession(token, profile, false); render(<MemoryRouter><ProfilePage /></MemoryRouter>); return userEvent.setup() }
test('loads authenticated profile, discards edits and saves the current version with bearer token', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(profile))).mockResolvedValueOnce(new Response(JSON.stringify({ ...profile, firstName: 'Anita', version: 3 })))
  vi.stubGlobal('fetch', fetch)
  const user = setup()
  const name = await screen.findByLabelText('Nombre legal')
  expect(name).toHaveProperty('value', 'Ana')
  await user.clear(name); await user.type(name, 'Otra')
  await user.click(screen.getByRole('button', { name: 'Descartar' }))
  expect(name).toHaveProperty('value', 'Ana')
  await user.clear(name); await user.type(name, 'Anita')
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await screen.findByText('Tus cambios se guardaron correctamente.')
  expect(fetch.mock.calls[1][0]).toBe('/api/v1/customer/profile')
  const options = fetch.mock.calls[1][1]
  expect(options.method).toBe('PUT')
  expect(options.headers.Authorization).toBe(`Bearer ${token}`)
  expect(JSON.parse(options.body)).toMatchObject({ firstName: 'Anita', version: 2, languages: [], interests: [] })
  expect(JSON.parse(options.body)).not.toHaveProperty('roleId')
  expect(JSON.parse(options.body)).not.toHaveProperty('avatarUrl')
  expect(screen.queryByLabelText('URL HTTPS de tu foto de perfil')).toBeNull()
  expect(screen.getByRole('button', { name: 'Cambiar foto (no disponible)' })).toHaveProperty('disabled', true)
  expect(screen.getByRole('button', { name: 'Guardar cambios' })).toHaveProperty('disabled', true)
  expect(screen.getByText('Anita Lima', { selector: 'strong' })).toBeTruthy()
})
test('preserves edits and reports concurrent profile conflict without showing success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(profile))).mockResolvedValueOnce(new Response(JSON.stringify({ code: 'PROFILE_CONFLICT' }), { status: 409 })))
  const user = setup(); const name = await screen.findByLabelText('Nombre legal')
  await user.clear(name); await user.type(name, 'Anita')
  await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  expect((await screen.findByRole('alert')).textContent).toContain('otra sesión')
  expect(name).toHaveProperty('value', 'Anita')
  expect(screen.queryByText('Tus cambios se guardaron correctamente.')).toBeNull()
})
test('rejects expired authorization and clears persisted session', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  setup()
  await waitFor(() => expect(sessionStorage.getItem('hosteo.session')).toBeNull())
  expect(screen.getByText('Inicia sesión para consultar y actualizar tus datos.')).toBeTruthy()
})
