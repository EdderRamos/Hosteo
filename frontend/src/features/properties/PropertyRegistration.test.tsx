import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { RegisterPropertyPage, PropertyConfirmationPage } from '../../pages/HostPropertyPages'
import { saveSession, logout } from '../auth/session'
import type { RoleCode } from '../../shared/auth/roles'
const property = { id: 7, hostId: 1, title: 'Departamento del parque', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 1, beds: 1, bathrooms: 1, nightlyRate: 180.5, currency: 'PEN', status: 'DRAFT', createdAt: '2026-10-04T00:00:00Z', updatedAt: '2026-10-04T00:00:00Z', version: 0 }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(role: RoleCode = 'HOST', path = '/host/properties/new') {
  saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'host@example.test', roleId: 67, roleCode: role }, false)
  render(<QueryProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="/host/properties/new" element={<RegisterPropertyPage />} /><Route path="/host/properties/:id" element={<PropertyConfirmationPage />} /><Route path="/guest" element={<p>Guest portal</p>} /><Route path="/hosteo" element={<p>Staff portal</p>} /><Route path="/login" element={<p>Login</p>} /></Routes></MemoryRouter></QueryProvider>)
  return userEvent.setup()
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Título del alojamiento/), property.title)
  await user.type(screen.getByLabelText(/Descripción/), property.description)
  await user.type(screen.getByLabelText(/^Dirección/), property.address)
  await user.type(screen.getByLabelText(/^Distrito/), property.district)
  const rate = screen.getByLabelText(/Precio por noche/); await user.clear(rate); await user.type(rate, '180.50')
  const capacity = screen.getByLabelText(/^Huéspedes/); await user.clear(capacity); await user.type(capacity, '4')
}
test('empty form validates without creating a property', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  const user = setup(); await user.click(screen.getByRole('button', { name: 'Registrar propiedad' }))
  expect(await screen.findAllByText('Completa este campo.')).not.toHaveLength(0)
  expect(fetch).not.toHaveBeenCalled()
})
test('confirmed creation submits only principal data and shows persisted draft', async () => {
  const fetch = vi.fn(async () => new Response(JSON.stringify(property), { status: 201 })); vi.stubGlobal('fetch', fetch)
  const user = setup(); await fill(user); await user.click(screen.getByRole('button', { name: 'Registrar propiedad' }))
  expect(await screen.findByText('Borrador · Sin publicar')).toBeTruthy()
  const call = fetch.mock.calls[0] as unknown as [string, RequestInit]
  expect(call[0]).toBe('/api/v1/host/properties')
  expect(JSON.parse(String(call[1].body))).toMatchObject({ title: property.title, capacity: 4, nightlyRate: 180.5, currency: 'PEN' })
  expect(JSON.parse(String(call[1].body))).not.toHaveProperty('hostId')
  expect(JSON.parse(String(call[1].body))).not.toHaveProperty('status')
  expect(call[1].headers).toHaveProperty('Authorization', `Bearer ${token}`)
  expect(call[1].headers).toHaveProperty('Idempotency-Key')
})
test('lost response preserves fields and reuses the key when retrying', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(property))).mockRejectedValueOnce(new TypeError('Network failure'))
  vi.stubGlobal('fetch', fetch)
  const user = setup(); await fill(user); await user.click(screen.getByRole('button', { name: 'Registrar propiedad' }))
  expect((await screen.findByRole('alert')).textContent).toContain('No pudimos conectar')
  expect(screen.getByLabelText(/Título del alojamiento/)).toHaveProperty('value', property.title)
  await user.click(screen.getByRole('button', { name: 'Registrar propiedad' })); await screen.findByText('Borrador · Sin publicar')
  expect(fetch.mock.calls[0][1].headers['Idempotency-Key']).toBe(fetch.mock.calls[1][1].headers['Idempotency-Key'])
})
test('an incomplete server response never shows a false successful registration', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 201 })))
  const user = setup(); await fill(user); await user.click(screen.getByRole('button', { name: 'Registrar propiedad' }))
  expect((await screen.findByRole('alert')).textContent).toContain('No pudimos confirmar')
  expect(screen.queryByText('Borrador · Sin publicar')).toBeNull()
})
test('submitting prevents duplicate registration and disables fields', async () => {
  let finish: ((response: Response) => void) | undefined
  const fetch = vi.fn((_input: string, options?: RequestInit) => {
    if (options?.method !== 'POST') return Promise.resolve(new Response(JSON.stringify(property)))
    return new Promise<Response>(resolve => { finish = resolve })
  }); vi.stubGlobal('fetch', fetch)
  const user = setup(); await fill(user); await user.click(screen.getByRole('button', { name: 'Registrar propiedad' }))
  expect(screen.getByRole('button', { name: 'Registrando…' })).toHaveProperty('disabled', true)
  await user.click(screen.getByRole('button', { name: 'Registrando…' }))
  expect(fetch).toHaveBeenCalledTimes(1)
  finish?.(new Response(JSON.stringify(property), { status: 201 }))
  await screen.findByText('Borrador · Sin publicar')
})
test.each(['GUEST', 'SUPPORT', 'ADMINISTRATOR'] as const)('%s cannot open host registration', async role => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); setup(role)
  expect(await screen.findByText(role === 'GUEST' ? 'Guest portal' : 'Staff portal')).toBeTruthy()
  expect(fetch).not.toHaveBeenCalled()
})
test('confirmation reloads from the owner API and can retry read failures', async () => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(property))).mockRejectedValueOnce(new TypeError('Network failure'))
  vi.stubGlobal('fetch', fetch); const user = setup('HOST', '/host/properties/7')
  await screen.findByRole('alert'); await user.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(await screen.findByText('Borrador · Sin publicar')).toBeTruthy()
  await waitFor(() => expect(fetch.mock.calls[0][0]).toBe('/api/v1/host/properties/7'))
})
