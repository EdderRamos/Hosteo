import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { AdminReviewNotification } from './AdminReviewNotification'
import { saveSession, logout } from '../auth/session'
import type { RoleCode } from '../../shared/auth/roles'
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
function account(role: RoleCode) { saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Ramos', email: 'ana@example.test', roleId: 1, roleCode: role }, false) }
function view() { return render(<QueryProvider><MemoryRouter initialEntries={['/hosteo']}><AdminReviewNotification /><Routes><Route path="/hosteo/properties/pending" element={<h1>Bandeja de validación</h1>} /></Routes></MemoryRouter></QueryProvider>) }
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
test('administrator sees the server count and can open the real review inbox', async () => {
 account('ADMINISTRATOR')
 const fetcher = vi.fn(async () => new Response(JSON.stringify({ items: [], total: 3, page: 0, pages: 1 })))
 vi.stubGlobal('fetch', fetcher);view()
 await screen.findByText(/Hay 3 propiedades pendientes/)
 expect(fetcher).toHaveBeenCalledTimes(1)
 const [url, options] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
 expect(url).toContain('/hosteo/properties/pending?page=0')
 expect(options.headers).toEqual({ Authorization: `Bearer ${token}` })
 await userEvent.click(screen.getByRole('link', { name: /Revisar solicitudes/ }))
 await screen.findByRole('heading', { name: 'Bandeja de validación' })
 expect(screen.queryByRole('status')).toBeNull()
})
test('dismissal hides the notification and a reload checks again', async () => {
 account('ADMINISTRATOR')
 const fetcher = vi.fn(async () => new Response(JSON.stringify({ items: [], total: 1, page: 0, pages: 1 })))
 vi.stubGlobal('fetch', fetcher);const first = view()
 await screen.findByText(/Hay 1 propiedad pendiente/)
 await userEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }))
 expect(screen.queryByRole('status')).toBeNull()
 first.unmount();view()
 await screen.findByText(/Hay 1 propiedad pendiente/)
 expect(fetcher).toHaveBeenCalledTimes(2)
})
test.each(['SUPPORT','HOST','GUEST'] as const)('%s cannot receive or request administrator notifications', role => {
 account(role);const fetcher = vi.fn();vi.stubGlobal('fetch', fetcher);view()
 expect(screen.queryByRole('status')).toBeNull()
 expect(fetcher).not.toHaveBeenCalled()
})
test('zero pending properties produce no notification', async () => {
 account('ADMINISTRATOR');const fetcher = vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, page: 0, pages: 0 })))
 vi.stubGlobal('fetch', fetcher);view()
 await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
 expect(screen.queryByRole('status')).toBeNull()
})
test('a failed query is not represented as an empty inbox and can be retried', async () => {
 account('ADMINISTRATOR');const fetcher = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 503 })).mockImplementation(async () => new Response(JSON.stringify({ items: [], total: 1, page: 0, pages: 1 })))
 vi.stubGlobal('fetch', fetcher);view()
 await screen.findByText('No pudimos consultar las solicitudes')
 await userEvent.click(screen.getByRole('button', { name: 'Volver a consultar' }))
 await screen.findByText(/Hay 1 propiedad pendiente/)
})
