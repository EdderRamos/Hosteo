import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuestCatalog } from './GuestCatalog'

afterEach(cleanup)
test('filters example inventory by district and clears it without API requests', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch')
  render(<GuestCatalog />); const user = userEvent.setup()
  expect(screen.getAllByRole('article')).toHaveLength(6)
  await user.click(screen.getByRole('button', { name: 'Barranco' }))
  expect(screen.getAllByRole('article')).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
  expect(screen.getAllByRole('article')).toHaveLength(6)
  expect(fetch).not.toHaveBeenCalled(); fetch.mockRestore()
})
test('combines price and capacity and supports empty state recovery', async () => {
  render(<GuestCatalog />); const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Hasta $100 / noche' }))
  expect(screen.getAllByRole('article')).toHaveLength(2)
  await user.click(screen.getByRole('button', { name: '3+ Huéspedes' }))
  expect(screen.queryAllByRole('article')).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Mostrar todos' }))
  expect(screen.getAllByRole('article')).toHaveLength(6)
})
test('search respects capacity without pretending to check availability', async () => {
  render(<GuestCatalog />); const user = userEvent.setup()
  await user.selectOptions(screen.getByLabelText(/Huéspedes/), '6')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  expect(screen.getAllByRole('article')).toHaveLength(1)
  expect(screen.getByRole('status').textContent).toContain('ejemplo')
})
