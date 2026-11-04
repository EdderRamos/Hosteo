import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { QueryProvider } from '../../app/QueryProvider'
import { HostReviewNotification } from './HostReviewNotification'
import { saveSession, logout } from '../auth/session'
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
const p = { id: 1, hostId: 1, title: 'Casa del parque', description: 'Casa luminosa', type: 'HOUSE', address: 'Calle 1', city: 'Lima', district: 'Centro', capacity: 4, bedrooms: 2, beds: 2, bathrooms: 1, nightlyRate: 100, currency: 'PEN', status: 'PUBLISHED', createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-03T00:00:00Z', reviewedAt: '2026-11-03T00:00:00Z', version: 1 }
function setup(roleCode: 'HOST' | 'SUPPORT' = 'HOST') {
 saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Ramos', email: 'ana@example.test', roleId: 1, roleCode }, false)
 render(<QueryProvider><MemoryRouter><HostReviewNotification /></MemoryRouter></QueryProvider>)
}
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
test('host receives approval and rejection results including properties beyond the first page', async () => {
 const fetcher = vi.fn(async (url: string) => new Response(JSON.stringify({ items: url.endsWith('page=0') ? [p] : [{ ...p, id: 2, title: 'Casa del jardín', status: 'REJECTED', reviewedAt: '2026-11-04T00:00:00Z', reviewComment: 'Corrige la dirección de la propiedad.' }], total: 2, page: url.endsWith('page=0') ? 0 : 1, pages: 2 })))
 vi.stubGlobal('fetch', fetcher);setup()
 await screen.findByText('Corrige la dirección de la propiedad.')
 expect(screen.getByText('Aprobada y publicada')).toBeTruthy()
 expect(screen.getByRole('link', { name: /Ver motivo y corregir/ }).getAttribute('href')).toBe('/host/properties/2')
 expect(fetcher.mock.calls.map(([url]) => url)).toEqual(['/api/v1/host/properties?page=0', '/api/v1/host/properties?page=1'])
 await userEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }))
 expect(screen.queryByRole('status')).toBeNull()
})
test('drafts, pending properties and unreviewed publications never announce a decision', async () => {
 vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [{ ...p, status: 'DRAFT' }, { ...p, id: 2, status: 'PENDING_REVIEW' }, { ...p, id: 3, reviewedAt: null }], total: 3, page: 0, pages: 1 }))))
 setup();await vi.waitFor(() => expect(screen.queryByRole('status')).toBeNull())
})
test('support never requests host review results', () => {
 const fetcher = vi.fn();vi.stubGlobal('fetch', fetcher);setup('SUPPORT')
 expect(fetcher).not.toHaveBeenCalled()
 expect(screen.queryByRole('status')).toBeNull()
})
