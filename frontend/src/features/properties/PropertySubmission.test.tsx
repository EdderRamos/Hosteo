import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { PropertyConfirmationPage, EditPropertyPage } from '../../pages/HostPropertyPages'
import { saveSession, logout } from '../auth/session'
const property = { id: 7, hostId: 1, title: 'Departamento del parque', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 1, beds: 1, bathrooms: 1, nightlyRate: 180.5, currency: 'PEN', status: 'DRAFT', createdAt: '2026-10-04T00:00:00Z', updatedAt: '2026-10-04T00:00:00Z', version: 2, submittedAt: null as string | null }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(path = '/host/properties/7') {
 saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'host@example.test', roleId: 67, roleCode: 'HOST' }, false)
 render(<QueryProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="/host/properties/:id" element={<PropertyConfirmationPage />} /><Route path="/host/properties/:id/edit" element={<EditPropertyPage />} /><Route path="/login" element={<p>Login</p>} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
async function open(user: ReturnType<typeof userEvent.setup>) { await user.click(await screen.findByRole('button', { name: 'Enviar a validación' })) }
test('confirmation can be canceled without submission and returns focus', async () => {
 const fetch = vi.fn(async () => new Response(JSON.stringify(property))); vi.stubGlobal('fetch', fetch)
 const user = setup(); await open(user); expect(screen.getByRole('button', { name: 'Confirmar envío' })).toBe(document.activeElement)
 await user.click(screen.getByRole('button', { name: 'Cancelar' })); expect(screen.queryByRole('region')).toBeNull(); expect(screen.getByRole('button', { name: 'Enviar a validación' })).toBe(document.activeElement); expect(fetch).toHaveBeenCalledTimes(1)
})
test('confirmed submission sends version and shows persisted pending review', async () => {
 let saved = property
 const fetch = vi.fn(async (_url: string, options?: RequestInit) => { if (options?.method === 'POST') saved = { ...property, status: 'PENDING_REVIEW', version: 3, submittedAt: '2026-10-05T00:00:00Z' }; return new Response(JSON.stringify(saved)) }); vi.stubGlobal('fetch', fetch)
 const user = setup(); await open(user); await user.click(screen.getByRole('button', { name: 'Confirmar envío' })); await screen.findByText('Pendiente de revisión'); await screen.findByText(/Solicitud enviada/)
 const call = fetch.mock.calls.find(call => call[1]?.method === 'POST')!; expect(call[0]).toBe('/api/v1/host/properties/7/submit'); expect(JSON.parse(String(call[1]?.body))).toEqual({ version: 2 }); expect(screen.queryByRole('link', { name: 'Editar propiedad' })).toBeNull(); expect(screen.queryByRole('button', { name: 'Enviar a validación' })).toBeNull()
})
test.each(['PUBLISHED', 'PENDING_REVIEW'])('%s has no send action', async status => {
 vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ...property, status })))); setup(); await screen.findByRole('heading', { name: property.title }); expect(screen.queryByRole('button', { name: 'Enviar a validación' })).toBeNull()
})
test('rejected property can be resubmitted', async () => { vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ...property, status: 'REJECTED' })))); const user = setup(); await open(user); expect(screen.getByRole('button', { name: 'Confirmar envío' })).toBeTruthy() })
test('network failure permits retry with the same version', async () => {
 let calls = 0
 const fetch = vi.fn(async (_url: string, options?: RequestInit) => { if (options?.method === 'POST') { if (++calls === 1) throw new TypeError('Network'); return new Response(JSON.stringify({ ...property, status: 'PENDING_REVIEW', version: 3, submittedAt: '2026-10-05T00:00:00Z' })) } return new Response(JSON.stringify(property)) }); vi.stubGlobal('fetch', fetch)
 const user = setup(); await open(user); await user.click(screen.getByRole('button', { name: 'Confirmar envío' })); await screen.findByRole('alert'); expect(screen.queryByText(/Solicitud enviada/)).toBeNull(); await user.click(screen.getByRole('button', { name: 'Confirmar envío' })); await screen.findByText(/Solicitud enviada/)
 const writes = fetch.mock.calls.filter(call => call[1]?.method === 'POST'); expect(writes).toHaveLength(2); expect(writes[0][1]?.body).toBe(writes[1][1]?.body)
})
test('version conflict offers status refresh instead of another write', async () => {
 let current = property
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => { if (options?.method === 'POST') { current = { ...property, status: 'PENDING_REVIEW', version: 3, submittedAt: '2026-10-05T00:00:00Z' }; return new Response('{}', { status: 409 }) } return new Response(JSON.stringify(current)) }))
 const user = setup(); await open(user); await user.click(screen.getByRole('button', { name: 'Confirmar envío' })); await screen.findByRole('alert'); expect(screen.queryByRole('button', { name: 'Confirmar envío' })).toBeNull(); await user.click(screen.getByRole('button', { name: 'Actualizar estado' })); await screen.findByText('Pendiente de revisión')
})
test('pending save prevents duplicate sending', async () => {
 let finish: ((response: Response) => void) | undefined
 const fetch = vi.fn((_url: string, options?: RequestInit) => options?.method === 'POST' ? new Promise<Response>(resolve => { finish = resolve }) : Promise.resolve(new Response(JSON.stringify(property)))); vi.stubGlobal('fetch', fetch)
 const user = setup(); await open(user); await user.click(screen.getByRole('button', { name: 'Confirmar envío' })); expect(screen.getByRole('button', { name: 'Enviando…' })).toHaveProperty('disabled', true); expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true); await user.click(screen.getByRole('button', { name: 'Enviando…' })); expect(fetch.mock.calls.filter(call => call[1]?.method === 'POST')).toHaveLength(1)
 finish?.(new Response(JSON.stringify({ ...property, status: 'PENDING_REVIEW', version: 3, submittedAt: '2026-10-05T00:00:00Z' }))); await screen.findByText(/Solicitud enviada/)
})
test('incomplete response never confirms sending', async () => {
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => new Response(JSON.stringify(options?.method === 'POST' ? { ...property, status: 'PENDING_REVIEW' } : property))))
 const user = setup(); await open(user); await user.click(screen.getByRole('button', { name: 'Confirmar envío' })); await screen.findByText(/No pudimos confirmar el envío/); expect(screen.queryByText(/Solicitud enviada/)).toBeNull()
})
test('submission 401 ends the session', async () => {
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => options?.method === 'POST' ? new Response('{}', { status: 401 }) : new Response(JSON.stringify(property))))
 const user = setup(); await open(user); await user.click(screen.getByRole('button', { name: 'Confirmar envío' })); await screen.findByText('Login')
})
test('pending review cannot open the edit form', async () => { vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ...property, status: 'PENDING_REVIEW' })))); setup('/host/properties/7/edit'); await screen.findByText('Propiedad en revisión'); expect(screen.queryByRole('button', { name: 'Guardar cambios' })).toBeNull() })
