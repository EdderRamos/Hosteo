import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StaffHomePage } from '../../pages/StaffHomePage'
import { HomeRedirect } from '../../pages/HomeRedirect'
import { logout, saveSession } from '../auth/session'
import type { RoleCode } from './api'
const account = { id: 2, firstName: 'Ana', lastName: 'Lima', email: 'ana@hosteo.test', roleCode: 'GUEST', active: true, version: 4 }
const accessToken = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup(roleCode: RoleCode, path = '/hosteo', patchStatus = 200, active = true) {
  let target = { ...account, active }
  saveSession(accessToken, { id: 1, firstName: 'Valeria', lastName: 'Costa', email: 'staff@hosteo.test', roleId: 87, roleCode }, false)
  const fetch = vi.fn(async (input: string, options?: RequestInit) => {
    if (options?.method === 'PATCH') {
      if (patchStatus === 200) target = { ...target, ...JSON.parse(String(options.body)), version: target.version + 1 }
      return new Response(JSON.stringify(target), { status: patchStatus })
    }
    if (input.includes('/summary')) return new Response(JSON.stringify({ guests: 1, hosts: 0, support: 0, administrators: 1 }))
    if (input.includes('/roles')) return new Response(JSON.stringify(['GUEST', 'HOST', 'SUPPORT', 'ADMINISTRATOR']))
    return new Response(JSON.stringify({ items: [target, { ...account, id: 1, firstName: 'Valeria', lastName: 'Costa', roleCode }], total: 2, page: 0, pages: 1 }))
  })
  vi.stubGlobal('fetch', fetch)
  render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/hosteo" element={<StaffHomePage />} /><Route path="/" element={<HomeRedirect />} /><Route path="/guest" element={<p>Guest home</p>} /><Route path="/host" element={<p>Host home</p>} /><Route path="/login" element={<p>Login</p>} /></Routes></MemoryRouter>)
  return { fetch, user: userEvent.setup() }
}
test('administrator confirms a role change with version and bearer token', async () => {
  const { user, fetch } = setup('ADMINISTRATOR')
  expect(await screen.findByText('Cuenta protegida')).toBeTruthy()
  expect(screen.queryByLabelText('Rol de Valeria Costa')).toBeNull()
  await user.selectOptions(await screen.findByLabelText('Rol de Ana Lima'), 'SUPPORT')
  expect(fetch.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Confirmar cambio' }))
  await screen.findByText(/Rol actualizado para Ana Lima/)
  const patch = fetch.mock.calls.find(([, options]) => options?.method === 'PATCH')
  expect(patch?.[0]).toContain('/hosteo/users/2/role')
  expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ roleCode: 'SUPPORT', version: 4 })
  expect(patch?.[1]?.headers).toHaveProperty('Authorization', `Bearer ${accessToken}`)
})
test('support can search accounts but has no role assignment controls', async () => {
  const { user, fetch } = setup('SUPPORT')
  await screen.findByText('Ana Lima')
  expect(screen.queryByRole('combobox')).toBeNull()
  expect(screen.queryByRole('button', { name: /Activar a|Desactivar a/ })).toBeNull()
  await user.type(screen.getByLabelText('Buscar por email o nombre'), 'ana@hosteo.test')
  await user.click(screen.getByRole('button', { name: 'Buscar' }))
  await waitFor(() => expect(fetch.mock.calls.some(([url]) => url.includes('query=ana%40hosteo.test'))).toBe(true))
})
test('conflict supports reloading current accounts', async () => {
  const { user } = setup('ADMINISTRATOR', '/hosteo', 409)
  await user.selectOptions(await screen.findByLabelText('Rol de Ana Lima'), 'SUPPORT')
  await user.click(screen.getByRole('button', { name: 'Confirmar cambio' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Esta cuenta cambió')
  await user.click(screen.getByRole('button', { name: 'Recargar usuarios' }))
  expect(screen.queryByRole('button', { name: 'Confirmar cambio' })).toBeNull()
})
test('hosts cannot enter staff portal', async () => {
  const { fetch } = setup('HOST')
  await screen.findByText('Host home')
  expect(fetch).not.toHaveBeenCalled()
})
test('root selects staff portal by role code instead of database ID', async () => {
  setup('SUPPORT', '/')
  await screen.findByText('Asignación de Roles y Cuentas')
})

test('deactivation requires confirmation, can be cancelled and refreshes status after success', async () => {
  const { user, fetch } = setup('ADMINISTRATOR')
  await user.click(await screen.findByRole('button', { name: 'Desactivar a Ana Lima' }))
  expect(screen.queryByRole('button', { name: 'Desactivar a Valeria Costa' })).toBeNull()
  expect(screen.getByText(/Sus datos y registros se conservarán/)).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Cancelar' }))
  expect(fetch.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Desactivar a Ana Lima' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))
  await screen.findByText(/Cuenta de Ana Lima desactivada/)
  const patch = fetch.mock.calls.find(([, options]) => options?.method === 'PATCH')
  expect(patch?.[0]).toContain('/hosteo/users/2/status')
  expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ active: false, version: 4 })
  expect(patch?.[1]?.headers).toHaveProperty('Authorization', `Bearer ${accessToken}`)
  expect(await screen.findByRole('button', { name: 'Activar a Ana Lima' })).toBeTruthy()
})
test('reactivation is confirmed and refreshes the user status', async () => {
  const { user } = setup('ADMINISTRATOR', '/hosteo', 200, false)
  await user.click(await screen.findByRole('button', { name: 'Activar a Ana Lima' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar activación' }))
  await screen.findByText(/Cuenta de Ana Lima activada/)
  expect(await screen.findByRole('button', { name: 'Desactivar a Ana Lima' })).toBeTruthy()
})
test('status conflicts preserve access and never announce success', async () => {
  const { user } = setup('ADMINISTRATOR', '/hosteo', 409)
  await user.click(await screen.findByRole('button', { name: 'Desactivar a Ana Lima' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))
  expect((await screen.findByRole('alert')).textContent).toContain('Esta cuenta cambió')
  expect(screen.queryByText(/Cuenta de Ana Lima desactivada/)).toBeNull()
  expect(screen.getByRole('button', { name: 'Desactivar a Ana Lima' })).toBeTruthy()
})
test('rejected session clears staff access during an account change', async () => {
  const { user } = setup('ADMINISTRATOR', '/hosteo', 401)
  await user.click(await screen.findByRole('button', { name: 'Desactivar a Ana Lima' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))
  expect(await screen.findByText('Login')).toBeTruthy()
  expect(sessionStorage.getItem('hosteo.session')).toBeNull()
})

test('blocks repeated status submissions while the server is saving', async () => {
  const { user, fetch } = setup('ADMINISTRATOR')
  let finish: (() => void) | undefined
  const delayed = vi.fn((input: string, options?: RequestInit) => {
    if (options?.method !== 'PATCH') return fetch(input, options)
    return new Promise<Response>(resolve => { finish = () => { void fetch(input, options).then(resolve) } })
  })
  vi.stubGlobal('fetch', delayed)
  await user.click(await screen.findByRole('button', { name: 'Desactivar a Ana Lima' }))
  await user.click(screen.getByRole('button', { name: 'Confirmar desactivación' }))
  expect(screen.getByRole('button', { name: 'Guardando…' })).toHaveProperty('disabled', true)
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true)
  await user.click(screen.getByRole('button', { name: 'Guardando…' }))
  expect(delayed.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(1)
  finish?.()
  await screen.findByText(/Cuenta de Ana Lima desactivada/)
})
