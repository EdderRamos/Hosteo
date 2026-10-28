import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { HostHomePage } from '../../pages/HostHomePage'
import { logout, saveSession } from '../auth/session'
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
const empty = { items: [], total: 0, page: 0, pages: 0 }
function renderHost() {
 saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Ramos', email: 'ana@example.test', roleId: 1, roleCode: 'HOST' }, false)
 return render(<QueryProvider><MemoryRouter><HostHomePage /></MemoryRouter></QueryProvider>)
}
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
test('host dashboard shows server totals and useful empty states without invented stays', async () => {
 const fetcher = vi.fn(async (input: string) => new Response(JSON.stringify(input.includes('/summary') ? { properties: 0, propertiesByStatus: {}, bookings: 0, bookingsByStatus: {}, upcomingBookings: 0, activeBlocks: 0, payments: 0, bookedAmountByCurrency: {}, paidAmountByCurrency: {} } : empty)))
 vi.stubGlobal('fetch', fetcher); renderHost()
 await screen.findByText('Tu primer alojamiento comienza aquí')
 await screen.findByText('Todo listo para recibir')
 expect(screen.getByText('0 publicadas · 0 en revisión')).toBeTruthy()
 expect(screen.getByRole('link', { name: 'Registrar mi primera propiedad' }).getAttribute('href')).toBe('/host/properties/new')
 expect(fetcher.mock.calls.every(([url]) => url.includes('/host/'))).toBe(true)
 expect(screen.queryByText(/Carlos Mendoza|Noches ocupadas|Uso propietario/)).toBeNull()
})
test('a failed summary never displays zero totals and does not hide the other sections', async () => {
 vi.stubGlobal('fetch', vi.fn(async (input: string) => input.includes('/summary') ? new Response('{}', { status: 503 }) : new Response(JSON.stringify(empty))))
 const { container } = renderHost()
 await screen.findByRole('alert')
 await screen.findByText('Tu primer alojamiento comienza aquí')
 expect(container.querySelectorAll('.host-stat').length).toBe(0)
 expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
 expect(screen.getByRole('link', { name: 'Consultar reservas →' }).getAttribute('href')).toBe('/host/bookings')
})
