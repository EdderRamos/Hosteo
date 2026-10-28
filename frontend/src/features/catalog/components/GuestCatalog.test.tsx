import { afterEach, expect, test, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
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

test('filters are sent to the server, preserved during pagination and cleared', async () => {
 const user = userEvent.setup()
 const fetcher = vi.fn(async (input: RequestInfo | URL) => { void input; return new Response(JSON.stringify({ items: [], total: 12, page: 0, pages: 2 })) })
 vi.stubGlobal('fetch', fetcher)
 render(<QueryProvider><MemoryRouter><GuestCatalog /></MemoryRouter></QueryProvider>)
 await screen.findByText('No hay alojamientos en esta página')
 await user.type(screen.getByLabelText('Buscar alojamiento'), 'Terraza')
 await user.type(screen.getByLabelText('Huéspedes'), '4')
 await user.selectOptions(screen.getByLabelText('Moneda'), 'PEN')
 await user.click(screen.getByText('Personalizar rango de precio'))
 await user.type(screen.getByLabelText('Precio máximo / noche'), '300')
 await user.click(screen.getByRole('button', { name: /Buscar alojamientos/ }))
 await screen.findByRole('button', { name: 'Siguiente' })
 expect(String(fetcher.mock.calls.at(-1)?.[0])).toContain('query=Terraza')
 expect(String(fetcher.mock.calls.at(-1)?.[0])).toContain('maxPrice=300')
 await user.click(screen.getByRole('button', { name: 'Siguiente' }))
 expect(String(fetcher.mock.calls.at(-1)?.[0])).toContain('page=1')
 expect(String(fetcher.mock.calls.at(-1)?.[0])).toContain('guests=4')
 await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0])
 expect((screen.getByLabelText('Buscar alojamiento') as HTMLInputElement).value).toBe('')
 expect(String(fetcher.mock.calls.at(-1)?.[0])).not.toContain('query=')
})
test('price range requires a currency and an ordered range', async () => {
 const user = userEvent.setup()
 vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [], total: 0, page: 0, pages: 0 }))))
 render(<QueryProvider><MemoryRouter><GuestCatalog /></MemoryRouter></QueryProvider>)
 await user.click(screen.getByText('Personalizar rango de precio'))
 await user.type(screen.getByLabelText('Precio mínimo / noche'), '200')
 await user.click(screen.getByRole('button', { name: /Buscar alojamientos/ }))
 await screen.findByText('Selecciona una moneda para comparar los precios por noche.')
 await user.selectOptions(screen.getByLabelText('Moneda'), 'PEN')
 await user.type(screen.getByLabelText('Precio máximo / noche'), '100')
 await user.click(screen.getByRole('button', { name: /Buscar alojamientos/ }))
 await screen.findByText('El precio máximo debe ser igual o mayor al mínimo.')
})
