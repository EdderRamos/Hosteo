import { afterEach, expect, test, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { SupportBookingsPage, SupportBookingPage, SupportOperationalPage } from '../../pages/SupportOperationsPages'
import { saveSession, logout } from '../auth/session'
import { request } from '../../shared/api/http'
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
const b = { id: 7, confirmationCode: '91c42855-14cd-4a37-b03d-02fd45f8e0b2', propertyId: 1, propertyTitle: 'Casa del parque', district: 'Miraflores', guest: { id: 2, name: 'Ana Lima', email: 'ana@test.local' }, host: { id: 1, name: 'Luis Lima', email: 'luis@test.local' }, checkIn: '2030-01-01', checkOut: '2030-01-03', guestCount: 2, nightlyRate: 100, totalAmount: 200, currency: 'PEN', status: 'CONFIRMED', confirmedAt: '2026-10-28T00:00:00Z', createdAt: '2026-10-28T00:00:00Z', version: 0, payment: null }
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(path = '/support/bookings') {
 saveSession(token, { id: 3, firstName: 'Valeria', lastName: 'Costa', email: 'staff@test.local', roleCode: 'SUPPORT', roleId: 1 }, false)
 render(<QueryProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="/support/bookings" element={<SupportBookingsPage />} /><Route path="/support/bookings/:id" element={<SupportBookingPage />} /><Route path="/support/operations" element={<SupportOperationalPage />} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
test('support searches a reservation, checks payment and sees no write actions', async () => {
 const fetch = vi.fn(async (url: string) => {
  if (url.endsWith('/payment')) return new Response('{"payment":null}')
  if (url.endsWith('/bookings/7')) return new Response(JSON.stringify(b))
  return new Response(JSON.stringify({ items: [b], total: 1, page: 0, pages: 1 }))
 }); vi.stubGlobal('fetch', fetch)
 const actor = setup(); await screen.findByText('Casa del parque'); await actor.type(screen.getByLabelText('Email del huésped'), 'ana'); await actor.click(screen.getByRole('button', { name: 'Buscar reservas' })); await screen.findByText('Casa del parque'); expect(fetch.mock.calls.some(([url]) => url.includes('email=ana'))).toBe(true)
 await actor.click(screen.getByRole('link', { name: 'Consultar reserva y pago #7 →' })); await screen.findByText('No se ha registrado un pago para esta reserva.'); expect(screen.queryByRole('button', { name: /Registrar pago|Cambiar estado|Cancelar reserva/ })).toBeNull()
})
test('operational overview handles errors and retry with actual counters', async () => {
 vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Network')).mockImplementation(async () => new Response(JSON.stringify({ generatedAt: '2026-10-28T00:00:00Z', today: '2026-10-28', properties: 3, propertiesByStatus: { PUBLISHED: 2 }, bookings: 4, bookingsByStatus: { CONFIRMED: 4 }, upcomingArrivals: 4, activeBlocks: 1 }))))
 const actor = setup('/support/operations'); await screen.findByRole('alert'); await actor.click(screen.getByRole('button', { name: 'Reintentar' })); await screen.findByText('Propiedades por estado'); expect(screen.getByText('Publicada')).toBeTruthy()
})
test('shared errors distinguish login, expired session, missing records and conflicts', async () => {
 vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response('{}', { status: url.includes('missing') ? 404 : url.includes('conflict') ? 409 : 401 })))
 await expect(request('/auth/login')).rejects.toThrow('Correo o contraseña incorrectos')
 await expect(request('/support/bookings')).rejects.toThrow('Tu sesión expiró')
 await expect(request('/missing')).rejects.toThrow('No encontramos')
 await expect(request('/conflict')).rejects.toThrow('Los datos cambiaron')
})
