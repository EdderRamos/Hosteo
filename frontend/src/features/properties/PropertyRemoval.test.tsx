import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { HostPropertiesPage } from '../../pages/HostPropertyPages'
import { saveSession, logout } from '../auth/session'
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
const p = { id: 7, hostId: 1, title: 'Departamento del parque', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Centro', capacity: 4, bedrooms: 1, beds: 1, bathrooms: 1, nightlyRate: 180, currency: 'PEN', status: 'DRAFT', createdAt: '2026-11-04T00:00:00Z', updatedAt: '2026-11-04T00:00:00Z', version: 0 }
const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeAll(() => { Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function () { this.setAttribute('open', '') } }); Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function () { this.removeAttribute('open') } }) })
afterAll(() => { for (const [name, descriptor] of [['showModal', originalShow], ['close', originalClose]] as const) { if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor); else Reflect.deleteProperty(HTMLDialogElement.prototype, name) } })
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(mode: 'DELETE' | 'ARCHIVE', conflict = false) {
 let items = [p]
 const fetcher = vi.fn(async (input: string, options?: RequestInit) => {
  if (input.endsWith('/removal')) return new Response(JSON.stringify({ propertyId: 7, version: 0, mode, hasBookings: mode === 'ARCHIVE' }))
  if (options?.method === 'DELETE') {
   if (conflict) return new Response('{}', { status: 409 })
   items = mode === 'DELETE' ? [] : [{ ...p, status: 'ARCHIVED', version: 1 }]
   return new Response(JSON.stringify({ propertyId: 7, mode }))
  }
  return new Response(JSON.stringify({ items, total: items.length, page: 0, pages: items.length ? 1 : 0 }))
 })
 vi.stubGlobal('fetch', fetcher);saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Ramos', email: 'ana@example.test', roleId: 1, roleCode: 'HOST' }, false)
 render(<QueryProvider><MemoryRouter initialEntries={['/host/properties']}><HostPropertiesPage /></MemoryRouter></QueryProvider>)
 return { user: userEvent.setup(), fetcher }
}
test('unused draft is deleted only after explicit confirmation with version and mode', async () => {
 const { user, fetcher } = setup('DELETE')
 await user.click(await screen.findByRole('button', { name: 'Eliminar propiedad' }))
 const dialog = await screen.findByRole('dialog');await within(dialog).findByText(/no podrás recuperarlo/)
 expect(fetcher.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false)
 await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }))
 await screen.findByText('Propiedad eliminada correctamente.')
 await screen.findByText('Aún no tienes propiedades registradas')
 const deletion = fetcher.mock.calls.find(([, options]) => options?.method === 'DELETE')
 expect(deletion?.[0]).toBe('/api/v1/host/properties/7?version=0&mode=DELETE')
 expect(deletion?.[1]?.headers).toEqual({ Authorization: `Bearer ${token}` })
})
test('history forces an archive confirmation and the retained property is read-only', async () => {
 const { user } = setup('ARCHIVE')
 await user.click(await screen.findByRole('button', { name: 'Eliminar propiedad' }))
 const dialog = await screen.findByRole('dialog');await within(dialog).findByText(/reservas existentes seguirán vigentes/)
 expect(within(dialog).queryByRole('button', { name: 'Eliminar definitivamente' })).toBeNull()
 await user.click(within(dialog).getByRole('button', { name: 'Confirmar archivado' }))
 await screen.findByText('Propiedad archivada. Sus reservas y su historial se conservan.')
 await screen.findByText('Archivada')
 expect(screen.queryByRole('link', { name: /Editar Departamento/ })).toBeNull()
 expect(screen.queryByRole('button', { name: /Eliminar propiedad|Archivar propiedad/ })).toBeNull()
})
test('cancel never sends a deletion', async () => {
 const { user, fetcher } = setup('DELETE')
 await user.click(await screen.findByRole('button', { name: 'Eliminar propiedad' }))
 const dialog = await screen.findByRole('dialog');await within(dialog).findByText(/no podrás recuperarlo/)
 await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
 expect(screen.queryByRole('dialog')).toBeNull()
 expect(fetcher.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false)
})
test('a conflict preserves the property and does not announce success', async () => {
 const { user } = setup('DELETE', true)
 await user.click(await screen.findByRole('button', { name: 'Eliminar propiedad' }))
 const dialog = await screen.findByRole('dialog');await within(dialog).findByText(/no podrás recuperarlo/)
 await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }))
 await screen.findByText(/no se aplicó la operación/)
 expect(screen.queryByText('Propiedad eliminada correctamente.')).toBeNull()
 expect(screen.getByRole('heading', { name: p.title })).toBeTruthy()
})
