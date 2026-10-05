import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { LoginForm } from './LoginForm'
import { logout } from '../session'

afterEach(() => { cleanup(); logout(); vi.unstubAllGlobals() })
function setup() { render(<MemoryRouter><LoginForm /></MemoryRouter>); return userEvent.setup() }
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'guest@hosteo.pe')
  await user.type(screen.getByLabelText('Contraseña', { exact: true }), 'valid-password')
}
test('validates empty fields without sending credentials', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión en Hosteo' }))
  expect(await screen.findByText('Ingresa tu correo electrónico')).toBeTruthy()
  expect(screen.getByText('Ingresa tu contraseña')).toBeTruthy()
  expect(fetch).not.toHaveBeenCalled()
})
test('toggles password visibility without submitting', async () => {
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
  expect(screen.getByLabelText('Contraseña', { exact: true }).getAttribute('type')).toBe('text')
  await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
  expect(screen.getByLabelText('Contraseña', { exact: true }).getAttribute('type')).toBe('password')
})
test('shows invalid credentials without persisting a session', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })))
  const user = setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión en Hosteo' }))
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.')
  expect(sessionStorage.getItem('hosteo.session')).toBeNull()
})
test('blocks duplicate submissions and stores only a valid token for the session', async () => {
  const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
  let finish: ((value: Response) => void) | undefined
  const fetch = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve }))
  vi.stubGlobal('fetch', fetch)
  const user = setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión en Hosteo' }))
  expect(screen.getByRole('button', { name: 'Iniciando sesión…' })).toHaveProperty('disabled', true)
  finish?.(new Response(JSON.stringify({ accessToken: token, user: { id: 1, email: 'guest@hosteo.pe', firstName: 'Ana', lastName: 'Lima', roleId: 4, roleCode: 'GUEST' as const } })))
  await waitFor(() => expect(sessionStorage.getItem('hosteo.session')).toBe(token))
  expect(localStorage.getItem('hosteo.session')).toBeNull()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch.mock.calls[0]).toBeDefined()
})
test('reports network failure and allows another attempt', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))
  const user = setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión en Hosteo' }))
  expect((await screen.findByRole('alert')).textContent).toContain('No pudimos conectar')
  expect(screen.getByRole('button', { name: 'Iniciar sesión en Hosteo' })).toHaveProperty('disabled', false)
})

test('staff login opens the Hosteo portal using roleCode', async () => {
  const token = `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 1800 }))}.signature`
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ accessToken: token, user: { id: 1, firstName: 'Valeria', lastName: 'Costa', email: 'staff@hosteo.test', roleId: 92, roleCode: 'ADMINISTRATOR' } }))))
  render(<MemoryRouter initialEntries={['/login']}><Routes><Route path="/login" element={<LoginForm />} /><Route path="/hosteo" element={<p>Staff portal</p>} /></Routes></MemoryRouter>)
  const user = userEvent.setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión en Hosteo' }))
  expect(await screen.findByText('Staff portal')).toBeTruthy()
})
