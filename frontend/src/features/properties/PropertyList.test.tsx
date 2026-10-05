import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { HostPropertiesPage } from '../../pages/HostPropertyPages'
import { saveSession, logout } from '../auth/session'
import type { RoleCode } from '../../shared/auth/roles'
const property = { id: 7, hostId: 1, title: 'Departamento del parque', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 1, beds: 1, bathrooms: 1, nightlyRate: 180.5, currency: 'PEN', status: 'DRAFT', createdAt: '2026-10-04T00:00:00Z', updatedAt: '2026-10-04T00:00:00Z', version: 0 }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(role: RoleCode = 'HOST', path = '/host/properties') {
 saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'host@example.test', roleId: 67, roleCode: role }, false)
 render(<QueryProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="/host/properties" element={<HostPropertiesPage />} /><Route path="/guest" element={<p>Guest portal</p>} /><Route path="/hosteo" element={<p>Staff portal</p>} /><Route path="/login" element={<p>Login</p>} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
function response(items = [property], total = items.length, page = 0, pages = 1) { return new Response(JSON.stringify({ items, total, page, pages })) }
test('shows all current states and property detail links', async () => {
 vi.stubGlobal('fetch', vi.fn(async () => response(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'].map((status, i) => ({ ...property, id: i + 1, status })))))
 setup(); for (const label of ['Borrador', 'Pendiente de revisión', 'Publicada', 'Rechazada']) expect(await screen.findByText(label)).toBeTruthy()
 expect(screen.getAllByRole('link', { name: /Ver información de/ })[0].getAttribute('href')).toBe('/host/properties/1')
})
test('empty list invites registration', async () => {
 vi.stubGlobal('fetch', vi.fn(async () => response([], 0, 0, 0))); setup()
 expect(await screen.findByText('Aún no tienes propiedades registradas')).toBeTruthy()
 expect(screen.getByRole('link', { name: 'Registrar propiedad' }).getAttribute('href')).toBe('/host/properties/new')
})
test('pagination requests the next server page and refreshes status', async () => {
 const fetch = vi.fn(async (url: string) => response([{ ...property, status: url.endsWith('1') ? 'PUBLISHED' : 'DRAFT' }], 11, url.endsWith('1') ? 1 : 0, 2)); vi.stubGlobal('fetch', fetch)
 const user = setup(); await screen.findByText('Borrador'); await user.click(screen.getByRole('button', { name: 'Siguiente' })); await screen.findByText('Publicada')
 expect(fetch.mock.calls[1][0]).toBe('/api/v1/host/properties?page=1')
 expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveProperty('disabled', true)
 await user.click(screen.getByRole('button', { name: 'Actualizar estados' })); expect(fetch.mock.calls.length).toBe(3)
})
test('read failures can be retried without claiming an empty list', async () => {
 vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Network failure')).mockImplementation(async () => response()))
 const user = setup(); await screen.findByRole('alert'); expect(screen.queryByText('Aún no tienes propiedades registradas')).toBeNull(); await user.click(screen.getByRole('button', { name: 'Reintentar' })); await screen.findByText('Borrador')
})
test('unauthorized response ends the session', async () => { vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 }))); setup(); await screen.findByText('Login') })
test.each(['GUEST', 'SUPPORT', 'ADMINISTRATOR'] as const)('%s cannot query host properties', async role => {
 const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); setup(role); await screen.findByText(role === 'GUEST' ? 'Guest portal' : 'Staff portal'); expect(fetch).not.toHaveBeenCalled()
})
