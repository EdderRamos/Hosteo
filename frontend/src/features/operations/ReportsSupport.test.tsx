import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { AdminReportsPage } from '../../pages/OperationsPages'
import { SupportUsersPage, SupportUserPage, SupportPropertyPage } from '../../pages/SupportPages'
import { saveSession, logout } from '../auth/session'
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
const property = { id: 7, hostId: 1, title: 'Casa del parque', description: 'Casa luminosa', type: 'HOUSE', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 2, beds: 2, bathrooms: 1, nightlyRate: 100, currency: 'PEN', status: 'DRAFT', createdAt: '2026-10-04T00:00:00Z', updatedAt: '2026-10-04T00:00:00Z', version: 0 }
const user = { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'ana@test.local', roleCode: 'HOST', active: true, version: 0 }
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(role: 'SUPPORT' | 'ADMINISTRATOR', path: string) {
 saveSession(token, { id: 3, firstName: 'Valeria', lastName: 'Costa', email: 'staff@test.local', roleCode: role, roleId: 1 }, false)
 render(<QueryProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="/hosteo/reports/bookings" element={<AdminReportsPage />} /><Route path="/support/users" element={<SupportUsersPage />} /><Route path="/support/users/:id" element={<SupportUserPage />} /><Route path="/support/users/:id/properties/:propertyId" element={<SupportPropertyPage />} /><Route path="/hosteo" element={<p>Portal personal</p>} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
test('report filters are sent to the server and CSV downloads the selected range', async () => {
 const fetch = vi.fn(async (url: string) => {
  if (url.includes('/export?')) return new Response('id,total_amount\n7,200', { headers: { 'Content-Type': 'text/csv' } })
  const params = new URL(url, 'http://localhost').searchParams
  return new Response(JSON.stringify({ startDate: params.get('startDate'), endDate: params.get('endDate'), status: params.get('status') || null, generatedAt: '2026-10-28T00:00:00Z', records: { items: [], total: 0, page: 0, pages: 0 }, bookingsByStatus: {}, nonCancelledAmountByCurrency: {} }))
 }); vi.stubGlobal('fetch', fetch)
 const create = vi.fn(() => 'blob:test'); vi.stubGlobal('URL', class extends URL { static createObjectURL = create; static revokeObjectURL = vi.fn() }); vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
 const actor = setup('ADMINISTRATOR', '/hosteo/reports/bookings'); await screen.findByText('0 reservas en el reporte')
 await actor.clear(screen.getByLabelText('Llegadas desde')); await actor.type(screen.getByLabelText('Llegadas desde'), '2030-01-01'); await actor.clear(screen.getByLabelText('Llegadas hasta')); await actor.type(screen.getByLabelText('Llegadas hasta'), '2030-01-31'); await actor.selectOptions(screen.getByLabelText('Estado de reserva'), 'CONFIRMED'); await actor.click(screen.getByRole('button', { name: 'Generar reporte' })); await screen.findByText('0 reservas en el reporte')
 expect(fetch.mock.calls.some(([url]) => url.includes('startDate=2030-01-01') && url.includes('status=CONFIRMED'))).toBe(true)
 await actor.click(screen.getByRole('button', { name: 'Descargar CSV' })); expect(fetch.mock.calls.some(([url]) => url.includes('/export?') && url.includes('endDate=2030-01-31'))).toBe(true)
 vi.restoreAllMocks()
})
test('support searches users and opens only their property information without writes', async () => {
 const fetch = vi.fn(async (url: string) => {
  if (url.includes('/properties/7')) return new Response(JSON.stringify(property))
  if (url.includes('/properties?')) return new Response(JSON.stringify({ items: [property], total: 1, page: 0, pages: 1 }))
  if (url.endsWith('/users/1')) return new Response(JSON.stringify(user))
  return new Response(JSON.stringify({ items: [user], total: 1, page: 0, pages: 1 }))
 }); vi.stubGlobal('fetch', fetch)
 const actor = setup('SUPPORT', '/support/users'); await screen.findByText('ana@test.local'); await actor.type(screen.getByLabelText('Buscar usuario'), 'ana'); await actor.click(screen.getByRole('button', { name: 'Buscar' })); await screen.findByText('ana@test.local'); expect(fetch.mock.calls.some(([url]) => url.includes('query=ana'))).toBe(true)
 await actor.click(screen.getByRole('link', { name: /Consultar usuario y propiedades/ })); await actor.click(await screen.findByRole('link', { name: 'Consultar propiedad #7 →' })); await screen.findByText('Calle 123, Miraflores, Lima'); expect(screen.queryByRole('button', { name: /Editar|Aprobar|Rechazar/ })).toBeNull(); expect(fetch.mock.calls.every(([url]) => url.includes('/support/users'))).toBe(true)
})
test('support cannot enter administrative reports', async () => { const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); setup('SUPPORT', '/hosteo/reports/bookings'); await screen.findByText('Portal personal'); expect(fetch).not.toHaveBeenCalled() })
