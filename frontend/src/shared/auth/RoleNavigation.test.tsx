import { afterEach, expect, test } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { logout, saveSession } from '../../features/auth/session'
import { HomeRedirect } from '../../pages/HomeRedirect'
import { HostHomePage } from '../../pages/HostHomePage'
import { GuestHomePage } from '../../pages/GuestHomePage'
import { roleLabels, type RoleCode } from './roles'
const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
function session(roleCode: RoleCode) { saveSession(token, { id: 1, firstName: 'Ana', lastName: 'Lima', email: 'ana@example.test', roleId: 51, roleCode }, false) }
afterEach(() => { cleanup(); logout() })
test.each([['GUEST', 'Guest home'], ['HOST', 'Host home'], ['ADMINISTRATOR', 'Staff home'], ['SUPPORT', 'Staff home']] as const)('root routes %s to its correct portal', async (role, destination) => {
  session(role)
  render(<MemoryRouter><Routes><Route path="/" element={<HomeRedirect />} /><Route path="/guest" element={<p>Guest home</p>} /><Route path="/host" element={<p>Host home</p>} /><Route path="/hosteo" element={<p>Staff home</p>} /></Routes></MemoryRouter>)
  expect(await screen.findByText(destination)).toBeTruthy()
})
test('host portal preserves HOST identity and marks its pending business flows', () => {
  session('HOST'); render(<MemoryRouter initialEntries={['/host']}><HostHomePage /></MemoryRouter>)
  expect(screen.getByText('Portal del anfitrión')).toBeTruthy()
  expect(screen.getByText('Anfitrión')).toBeTruthy()
  expect(screen.getAllByText('Pendiente de implementación')).toHaveLength(1)
  expect(screen.getByRole('link', { name: 'Editar mi perfil' }).getAttribute('href')).toBe('/profile')
})
test('host cannot enter guest home', async () => {
  session('HOST')
  render(<MemoryRouter initialEntries={['/guest']}><Routes><Route path="/guest" element={<GuestHomePage />} /><Route path="/host" element={<p>Host home</p>} /></Routes></MemoryRouter>)
  expect(await screen.findByText('Host home')).toBeTruthy()
})
test('guest cannot enter host portal', async () => {
  session('GUEST')
  render(<MemoryRouter initialEntries={['/host']}><Routes><Route path="/host" element={<HostHomePage />} /><Route path="/guest" element={<p>Guest home</p>} /></Routes></MemoryRouter>)
  expect(await screen.findByText('Guest home')).toBeTruthy()
})
test('only the four business roles have labels', () => {
  expect(roleLabels).toEqual({ GUEST: 'Huésped', HOST: 'Anfitrión', ADMINISTRATOR: 'Administrador', SUPPORT: 'Soporte' })
})
