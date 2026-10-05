import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { PendingPropertyDetailPage } from '../../pages/PropertyReviewPages'
import { PropertyConfirmationPage } from '../../pages/HostPropertyPages'
import { saveSession, logout } from '../auth/session'
const entry = { property: { id: 7, hostId: 1, title: 'Departamento del parque', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 1, beds: 2, bathrooms: 1, nightlyRate: 180.5, currency: 'PEN', status: 'PENDING_REVIEW', createdAt: '2026-10-04T00:00:00Z', updatedAt: '2026-10-05T00:00:00Z', version: 2, submittedAt: '2026-10-05T00:00:00Z' }, host: { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'host@example.test' } }
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
const approved = { ...entry.property, status: 'PUBLISHED', version: 3, reviewedAt: '2026-10-05T01:00:00Z', publishedAt: '2026-10-05T01:00:00Z', reviewComment: null }
const rejected = { ...approved, status: 'REJECTED', publishedAt: null, reviewComment: 'Corrige la dirección' }
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(host = false) {
 saveSession(token, { id: host ? 1 : 5, firstName: 'Valeria', lastName: 'Costa', email: 'admin@example.test', roleId: 67, roleCode: host ? 'HOST' : 'ADMINISTRATOR' }, false)
 render(<QueryProvider><MemoryRouter initialEntries={[host ? '/host/properties/7' : '/hosteo/properties/pending/7']}><Routes><Route path="/hosteo/properties/pending/:id" element={<PendingPropertyDetailPage />} /><Route path="/host/properties/:id" element={<PropertyConfirmationPage />} /><Route path="/login" element={<p>Login</p>} /></Routes></MemoryRouter></QueryProvider>)
 return userEvent.setup()
}
function mockDecision(result: unknown = approved) { const fetch = vi.fn(async (_url: string, options?: RequestInit) => new Response(JSON.stringify(options?.method === 'POST' ? result : entry))); vi.stubGlobal('fetch', fetch); return fetch }
test('approval requires confirmation and submits the reviewed version', async () => {
 const fetch = mockDecision(); const user = setup(); await user.click(await screen.findByRole('button', { name: 'Aprobar propiedad' })); expect(fetch).toHaveBeenCalledTimes(1); expect(screen.getByRole('region', { name: 'Confirmar decisión de publicación' })).toBe(document.activeElement)
 await user.click(screen.getByRole('button', { name: 'Confirmar aprobación' })); await screen.findByText('Propiedad aprobada y publicada.')
 const post = fetch.mock.calls.find(call => call[1]?.method === 'POST')!; expect(post[0]).toBe('/api/v1/hosteo/properties/pending/7/decision'); expect(JSON.parse(String(post[1]?.body))).toEqual({ version: 2, decision: 'APPROVED', comment: '' }); expect(screen.queryByRole('button', { name: 'Aprobar propiedad' })).toBeNull()
})
test('cancel restores focus without writing', async () => {
 const fetch = mockDecision(); const user = setup(); await user.click(await screen.findByRole('button', { name: 'Rechazar propiedad' })); await user.click(screen.getByRole('button', { name: 'Cancelar' })); expect(screen.getByRole('button', { name: 'Rechazar propiedad' })).toBe(document.activeElement); expect(fetch).toHaveBeenCalledTimes(1)
})
test('rejection requires a reason and saves a trimmed comment', async () => {
 const fetch = mockDecision(rejected); const user = setup(); await user.click(await screen.findByRole('button', { name: 'Rechazar propiedad' })); await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' })); await screen.findByText('Indica el motivo del rechazo.'); expect(fetch).toHaveBeenCalledTimes(1)
 await user.type(screen.getByLabelText('Motivo del rechazo'), '  Corrige la dirección  '); await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' })); await screen.findByText(/Propiedad rechazada/)
 const post = fetch.mock.calls.find(call => call[1]?.method === 'POST')!; expect(JSON.parse(String(post[1]?.body))).toMatchObject({ decision: 'REJECTED', comment: 'Corrige la dirección' })
})
test('network errors preserve the comment and allow the same request retry', async () => {
 let writes = 0
 const fetch = vi.fn(async (_url: string, options?: RequestInit) => { if (options?.method === 'POST') { if (++writes === 1) throw new TypeError('Network'); return new Response(JSON.stringify(rejected)) } return new Response(JSON.stringify(entry)) }); vi.stubGlobal('fetch', fetch)
 const user = setup(); await user.click(await screen.findByRole('button', { name: 'Rechazar propiedad' })); await user.type(screen.getByLabelText('Motivo del rechazo'), 'Corrige la dirección'); await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' })); await screen.findByRole('alert'); expect(screen.getByLabelText('Motivo del rechazo')).toHaveProperty('value', 'Corrige la dirección'); expect(screen.queryByText(/Propiedad rechazada/)).toBeNull()
 await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' })); await screen.findByText(/Propiedad rechazada/); const posts = fetch.mock.calls.filter(call => call[1]?.method === 'POST'); expect(posts[0][1]?.body).toBe(posts[1][1]?.body)
})
test('conflict stops writes and offers reloading the changed expediente', async () => {
 let changed = false
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => { if (options?.method === 'POST') { changed = true; return new Response('{}', { status: 409 }) } return changed ? new Response('{}', { status: 404 }) : new Response(JSON.stringify(entry)) }))
 const user = setup(); await user.click(await screen.findByRole('button', { name: 'Aprobar propiedad' })); await user.click(screen.getByRole('button', { name: 'Confirmar aprobación' })); await screen.findByRole('alert'); expect(screen.queryByRole('button', { name: 'Confirmar aprobación' })).toBeNull(); await user.click(screen.getByRole('button', { name: 'Actualizar expediente' })); await screen.findByText('Solicitud no disponible')
})
test('pending decision blocks duplicate sending and cancellation', async () => {
 let finish: ((response: Response) => void) | undefined
 const fetch = vi.fn((_url: string, options?: RequestInit) => options?.method === 'POST' ? new Promise<Response>(resolve => { finish = resolve }) : Promise.resolve(new Response(JSON.stringify(entry)))); vi.stubGlobal('fetch', fetch)
 const user = setup(); await user.click(await screen.findByRole('button', { name: 'Aprobar propiedad' })); await user.click(screen.getByRole('button', { name: 'Confirmar aprobación' })); expect(screen.getByRole('button', { name: 'Guardando decisión…' })).toHaveProperty('disabled', true); expect(screen.getByRole('button', { name: 'Cancelar' }).matches(':disabled')).toBe(true); await user.click(screen.getByRole('button', { name: 'Guardando decisión…' })); expect(fetch.mock.calls.filter(call => call[1]?.method === 'POST')).toHaveLength(1); finish?.(new Response(JSON.stringify(approved))); await screen.findByText('Propiedad aprobada y publicada.')
})
test('incomplete decision response never confirms publication', async () => {
 mockDecision({ ...approved, publishedAt: null }); const user = setup(); await user.click(await screen.findByRole('button', { name: 'Aprobar propiedad' })); await user.click(screen.getByRole('button', { name: 'Confirmar aprobación' })); await screen.findByText(/No pudimos confirmar la decisión/); expect(screen.queryByText('Propiedad aprobada y publicada.')).toBeNull()
})
test('decision 401 ends the administrative session', async () => {
 vi.stubGlobal('fetch', vi.fn(async (_url: string, options?: RequestInit) => options?.method === 'POST' ? new Response('{}', { status: 401 }) : new Response(JSON.stringify(entry))))
 const user = setup(); await user.click(await screen.findByRole('button', { name: 'Aprobar propiedad' })); await user.click(screen.getByRole('button', { name: 'Confirmar aprobación' })); await screen.findByText('Login')
})
test('host can read the persisted rejection reason and resubmit', async () => { vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(rejected)))); setup(true); await screen.findByText('Motivo del rechazo'); expect(screen.getByText('Corrige la dirección')).toBeTruthy(); expect(screen.getByRole('button', { name: 'Enviar a validación' })).toBeTruthy() })
