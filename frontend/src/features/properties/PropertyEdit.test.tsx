import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { EditPropertyPage, PropertyConfirmationPage } from '../../pages/HostPropertyPages'
import { saveSession, logout } from '../auth/session'
import type { RoleCode } from '../../shared/auth/roles'
const property = { id: 7, hostId: 1, title: 'Departamento del parque', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 1, beds: 1, bathrooms: 1, nightlyRate: 180.5, currency: 'PEN', status: 'DRAFT', createdAt: '2026-10-04T00:00:00Z', updatedAt: '2026-10-04T00:00:00Z', version: 2 }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(role: RoleCode = 'HOST') {
 saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'host@example.test', roleId: 67, roleCode: role }, false)
 render(<QueryProvider><MemoryRouter initialEntries={['/host/properties/7/edit']}><Routes><Route path="/host/properties/:id/edit" element={<EditPropertyPage />} /><Route path="/host/properties/:id" element={<PropertyConfirmationPage />} /><Route path="/guest" element={<p>Guest portal</p>} /><Route path="/hosteo" element={<p>Staff portal</p>} /><Route path="/login" element={<p>Login</p>} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
test('loads existing data and saves only information and version', async () => {
 let saved = property
 const fetch = vi.fn(async (_url: string, options?: RequestInit) => { if (options?.method === 'PUT') saved = { ...property, ...JSON.parse(String(options.body)), version: 3 }; return new Response(JSON.stringify(saved)) }); vi.stubGlobal('fetch', fetch)
 const user = setup(); const title = await screen.findByLabelText(/Título del alojamiento/); expect(title).toHaveProperty('value', property.title)
 await user.clear(title); await user.type(title, 'Nuevo título'); await user.click(screen.getByRole('button', { name: 'Guardar cambios' })); await screen.findByText('Cambios guardados correctamente.')
 const put = fetch.mock.calls.find(call => call[1]?.method === 'PUT')!; const body = JSON.parse(String(put[1]?.body))
 expect(body).toMatchObject({ title: 'Nuevo título', version: 2 }); expect(body).not.toHaveProperty('hostId'); expect(body).not.toHaveProperty('status'); expect(put[0]).toBe('/api/v1/host/properties/7')
})
test('conflict preserves edits until explicit discard and reload', async () => {
 let reads = 0
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => options?.method === 'PUT' ? new Response('{}', { status: 409 }) : new Response(JSON.stringify({ ...property, title: ++reads === 1 ? property.title : 'Cambio remoto', version: reads + 1 }))))
 const user = setup(); const title = await screen.findByLabelText(/Título del alojamiento/); await user.clear(title); await user.type(title, 'Mi cambio'); await user.click(screen.getByRole('button', { name: 'Guardar cambios' })); await screen.findByText(/La propiedad cambió en otra sesión/)
 expect(title).toHaveProperty('value', 'Mi cambio'); expect(screen.getByRole('button', { name: 'Guardar cambios' })).toHaveProperty('disabled', true)
 await user.click(screen.getByRole('button', { name: 'Descartar cambios y recargar' })); await screen.findByDisplayValue('Cambio remoto'); expect(screen.getByRole('button', { name: 'Guardar cambios' })).toHaveProperty('disabled', false)
})
test('network failure keeps input and never confirms success', async () => {
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => { if (options?.method === 'PUT') throw new TypeError('Network'); return new Response(JSON.stringify(property)) }))
 const user = setup(); await screen.findByLabelText(/Título del alojamiento/); await user.click(screen.getByRole('button', { name: 'Guardar cambios' })); await screen.findByRole('alert'); expect(screen.queryByText('Cambios guardados correctamente.')).toBeNull(); expect(screen.getByLabelText(/Título del alojamiento/)).toHaveProperty('value', property.title)
})
test('foreign property is not editable', async () => { vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 }))); setup(); await screen.findByText('Propiedad no encontrada'); expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull() })
test.each(['GUEST', 'SUPPORT', 'ADMINISTRATOR'] as const)('%s cannot edit host properties', async role => { const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); setup(role); await screen.findByText(role === 'GUEST' ? 'Guest portal' : 'Staff portal'); expect(fetch).not.toHaveBeenCalled() })
test('pending save blocks duplicate writes and cancellation', async () => {
 let finish: ((response: Response) => void) | undefined
 const fetch = vi.fn((_url: string, options?: RequestInit) => options?.method === 'PUT' ? new Promise<Response>(resolve => { finish = resolve }) : Promise.resolve(new Response(JSON.stringify(property)))); vi.stubGlobal('fetch', fetch)
 const user = setup(); await screen.findByLabelText(/Título del alojamiento/); await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
 expect(screen.getByRole('button', { name: 'Guardando…' })).toHaveProperty('disabled', true)
 expect(screen.getByLabelText(/Título del alojamiento/).matches(':disabled')).toBe(true)
 await user.click(screen.getByRole('link', { name: 'Cancelar edición' })); expect(screen.getByRole('button', { name: 'Guardando…' })).toBeTruthy()
 await user.click(screen.getByRole('button', { name: 'Guardando…' })); expect(fetch.mock.calls.filter(call => call[1]?.method === 'PUT')).toHaveLength(1)
 finish?.(new Response(JSON.stringify({ ...property, version: 3 }))); await screen.findByText('Cambios guardados correctamente.')
})
test('incomplete save response does not confirm success', async () => {
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => new Response(JSON.stringify(options?.method === 'PUT' ? {} : property))))
 const user = setup(); await screen.findByLabelText(/Título del alojamiento/); await user.click(screen.getByRole('button', { name: 'Guardar cambios' })); await screen.findByText(/No pudimos confirmar el guardado/); expect(screen.queryByText('Cambios guardados correctamente.')).toBeNull()
})
