import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryProvider } from '../../../app/QueryProvider'
import { GuestCatalog } from './GuestCatalog'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
test('catalog uses published server data and does not fall back to example properties', async () => {
 vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, page: 0, pages: 0 }))))
 render(<QueryProvider><MemoryRouter><GuestCatalog /></MemoryRouter></QueryProvider>)
 await screen.findByText('Aún no hay alojamientos publicados'); expect(screen.queryByRole('link', { name: 'Ver disponibilidad' })).toBeNull()
})
