import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { PendingPropertiesPage, PendingPropertyDetailPage } from '../../pages/PropertyReviewPages'
import { saveSession, logout } from '../auth/session'
import type { RoleCode } from '../../shared/auth/roles'
const entry = { property: { id: 7, hostId: 1, title: 'Departamento del parque', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 1, beds: 2, bathrooms: 1, nightlyRate: 180.5, currency: 'PEN', status: 'PENDING_REVIEW', createdAt: '2026-10-04T00:00:00Z', updatedAt: '2026-10-05T00:00:00Z', version: 2, submittedAt: '2026-10-05T00:00:00Z' }, host: { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'host@example.test' } }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(role: RoleCode = 'ADMINISTRATOR', path = '/hosteo/properties/pending') {
 saveSession(token, { id: 5, firstName: 'Valeria', lastName: 'Costa', email: 'admin@example.test', roleId: 67, roleCode: role }, false)
 render(<QueryProvider><MemoryRouter initialEntries={[path]}><Routes><Route path="/hosteo/properties/pending" element={<PendingPropertiesPage />} /><Route path="/hosteo/properties/pending/:id" element={<PendingPropertyDetailPage />} /><Route path="/hosteo" element={<p>Staff home</p>} /><Route path="/guest" element={<p>Guest home</p>} /><Route path="/host" element={<p>Host home</p>} /><Route path="/login" element={<p>Login</p>} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
const pageResponse = (items = [entry], page = 0, total = items.length, pages = 1) => new Response(JSON.stringify({ items, page, total, pages }))
test('inbox opens complete pending information without decision actions', async () => {
 const fetch = vi.fn(async (url: string) => url.includes('?') ? pageResponse() : new Response(JSON.stringify(entry))); vi.stubGlobal('fetch', fetch)
 const user = setup(); await screen.findByText('host@example.test'); expect(fetch.mock.calls[0][0]).toBe('/api/v1/hosteo/properties/pending?page=0')
 await user.click(screen.getByRole('link', { name: /Revisar información de/ })); await screen.findByText('Calle 123'); expect(screen.getByText('Alojamiento luminoso.')).toBeTruthy(); expect(screen.getByText('Camas')).toBeTruthy(); expect(screen.getByText('host@example.test')).toBeTruthy()
 expect(screen.queryByRole('button', { name: /Aprobar|Rechazar/ })).toBeNull()
})
test('pagination uses server page and refreshes the inbox', async () => {
 const fetch = vi.fn(async (url: string) => pageResponse([{ ...entry, property: { ...entry.property, title: url.endsWith('1') ? 'Segunda página' : entry.property.title } }], url.endsWith('1') ? 1 : 0, 11, 2)); vi.stubGlobal('fetch', fetch)
 const user = setup(); await screen.findByText(entry.property.title); await user.click(screen.getByRole('button', { name: 'Siguiente' })); await screen.findByText('Segunda página'); expect(fetch.mock.calls[1][0]).toContain('page=1'); expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveProperty('disabled', true)
 await user.click(screen.getByRole('button', { name: 'Actualizar bandeja' })); expect(fetch.mock.calls).toHaveLength(3)
})
test('empty inbox has an explicit empty state', async () => { vi.stubGlobal('fetch', vi.fn(async () => pageResponse([], 0, 0, 0))); setup(); await screen.findByText('No hay propiedades pendientes de revisión') })
test('inbox read error can be retried without showing a false empty state', async () => {
 vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Network')).mockImplementation(async () => pageResponse()))
 const user = setup(); await screen.findByRole('alert'); expect(screen.queryByText('No hay propiedades pendientes de revisión')).toBeNull(); await user.click(screen.getByRole('button', { name: 'Reintentar' })); await screen.findByText(entry.property.title)
})
test('detail reloads the server and handles a property leaving review', async () => {
 vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(async () => new Response(JSON.stringify(entry))).mockImplementation(async () => new Response('{}', { status: 404 })))
 const user = setup('ADMINISTRATOR', '/hosteo/properties/pending/7'); await screen.findByText('Calle 123'); await user.click(screen.getByRole('button', { name: 'Actualizar información' })); await screen.findByText('Solicitud no disponible'); expect(screen.getByRole('link', { name: /Volver a la bandeja/ })).toBeTruthy()
})
test('malformed or non-pending records show an error', async () => { vi.stubGlobal('fetch', vi.fn(async () => pageResponse([{ ...entry, property: { ...entry.property, status: 'PUBLISHED' } }]))); setup(); await screen.findByRole('alert'); expect(screen.queryByText(entry.property.title)).toBeNull() })
test('expired session returns to login', async () => { vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 }))); setup(); await screen.findByText('Login') })
test.each(['GUEST', 'HOST', 'SUPPORT'] as const)('%s cannot query the inbox', async role => { const fetch = vi.fn(); vi.stubGlobal('fetch', fetch); setup(role); await screen.findByText(role === 'GUEST' ? 'Guest home' : role === 'HOST' ? 'Host home' : 'Staff home'); expect(fetch).not.toHaveBeenCalled() })
