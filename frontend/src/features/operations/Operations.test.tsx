import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { GuestPropertyBookingPage, GuestBookingDetailPage } from '../../pages/OperationsPages'
import { saveSession, logout } from '../auth/session'
import { today, addDays } from './api'
const property = { id: 1, title: 'Casa del parque', description: 'Casa luminosa', type: 'HOUSE', address: 'Calle 1', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 2, beds: 2, bathrooms: 1, nightlyRate: 100, currency: 'PEN', version: 1 }
const booking = { id: 7, confirmationCode: '91c42855-14cd-4a37-b03d-02fd45f8e0b2', propertyId: 1, propertyTitle: property.title, district: property.district, guest: { id: 2, name: 'Ana Lima', email: 'ana@test.local' }, host: { id: 3, name: 'Luis Lima', email: 'luis@test.local' }, checkIn: today(), checkOut: addDays(today(), 1), guestCount: 1, nightlyRate: 100, totalAmount: 100, currency: 'PEN', status: 'CONFIRMED', confirmedAt: '2026-10-05T00:00:00Z', createdAt: '2026-10-05T00:00:00Z', version: 0, payment: null as unknown }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup() {
 saveSession(token, { id: 2, firstName: 'Ana', lastName: 'Lima', email: 'ana@test.local', roleId: 1, roleCode: 'GUEST' }, false)
 render(<QueryProvider><MemoryRouter initialEntries={['/guest/properties/1']}><Routes><Route path="/guest/properties/:id" element={<GuestPropertyBookingPage />} /><Route path="/guest/bookings/:id" element={<GuestBookingDetailPage />} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
test('essential availability, reservation confirmation and simulated payment journey', async () => {
 let saved = booking
 const fetch = vi.fn(async (url: string, options?: RequestInit) => {
  if (url.includes('/catalog/properties/')) return new Response(JSON.stringify(property))
  if (url.includes('/availability?')) return new Response(JSON.stringify({ propertyId: 1, propertyVersion: 1, checkIn: booking.checkIn, checkOut: booking.checkOut, guestCount: 1, available: true, nights: 1, nightlyRate: 100, totalAmount: 100, currency: 'PEN' }))
  if (url.endsWith('/payment') && options?.method === 'POST') { saved = { ...booking, payment: { id: 1, bookingId: 7, reference: 'd1eb4df6-8e76-4f46-8070-5f16f2bca291', status: 'APPROVED', amount: 100, currency: 'PEN', processedAt: '2026-10-05T00:00:00Z', version: 0 } }; return new Response(JSON.stringify(saved.payment)) }
  return new Response(JSON.stringify(saved))
 }); vi.stubGlobal('fetch', fetch)
 const user = setup(); await user.click(await screen.findByRole('button', { name: 'Consultar disponibilidad' })); await screen.findByText('Fechas disponibles'); await user.click(screen.getByRole('button', { name: 'Solicitar reserva' })); await user.click(screen.getByRole('button', { name: 'Confirmar reserva' })); await screen.findByText('Reserva registrada'); expect(screen.getByText(/91c42855/)).toBeTruthy()
 const post = fetch.mock.calls.find(call => call[0].endsWith('/guest/bookings') && call[1]?.method === 'POST')!; expect(post[1]?.headers).toHaveProperty('Idempotency-Key'); expect(JSON.parse(String(post[1]?.body))).toMatchObject({ propertyId: 1, propertyVersion: 1 }); expect(JSON.parse(String(post[1]?.body))).not.toHaveProperty('totalAmount')
 await user.click(screen.getByRole('button', { name: 'Registrar pago simulado' })); await user.click(screen.getByRole('button', { name: 'Confirmar pago simulado' })); await screen.findByText(/Aprobado \(simulado\)/)
 expect(screen.queryByRole('button', { name: 'Registrar pago simulado' })).toBeNull()
})
test('date changes invalidate a quote and reservation conflicts never show confirmation', async () => {
 vi.stubGlobal('fetch', vi.fn(async (url: string, options?: RequestInit) => {
  if (url.includes('/catalog/')) return new Response(JSON.stringify(property))
  if (options?.method === 'POST') return new Response('{}', { status: 409 })
  return new Response(JSON.stringify({ propertyId: 1, propertyVersion: 1, checkIn: booking.checkIn, checkOut: booking.checkOut, guestCount: 1, available: true, nights: 1, nightlyRate: 100, totalAmount: 100, currency: 'PEN' }))
 }))
 const user = setup(); await user.click(await screen.findByRole('button', { name: 'Consultar disponibilidad' })); await screen.findByText('Fechas disponibles'); await user.click(screen.getByRole('button', { name: 'Solicitar reserva' })); await user.click(screen.getByRole('button', { name: 'Confirmar reserva' })); await screen.findByRole('alert'); expect(screen.queryByText('Reserva registrada')).toBeNull()
 await user.clear(screen.getByLabelText('Huéspedes')); await user.type(screen.getByLabelText('Huéspedes'), '2'); expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).toBeNull()
})
