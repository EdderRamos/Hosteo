import { afterEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { RegisterPage } from '../../../pages/RegisterPage'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); sessionStorage.clear() })
function setup() { render(<MemoryRouter><RegisterPage /></MemoryRouter>); return userEvent.setup() }
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Nombres/), 'Camila')
  await user.type(screen.getByLabelText(/^Apellidos/), 'Salazar')
  await user.type(screen.getByLabelText(/^Correo electrónico/), 'Camila@correo.pe')
  await user.type(screen.getByLabelText(/^Contraseña/), 'Hosteo2026*')
  await user.type(screen.getByLabelText(/^Confirmar contraseña/), 'Hosteo2026*')
}
test('validates required data without sending a request', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  const user = setup()
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(screen.queryByLabelText('Tipo de documento')).toBeNull()
  expect(screen.queryByLabelText('Número de documento')).toBeNull()
  expect(await screen.findByText('Ingresa tus nombres')).toBeTruthy()
  expect(screen.getByText('Ingresa tus apellidos')).toBeTruthy()
  expect(fetch).not.toHaveBeenCalled()
})
test('rejects mismatched passwords', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch)
  const user = setup(); await fill(user)
  await user.type(screen.getByLabelText(/^Confirmar contraseña/), 'different')
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByText('Las contraseñas no coinciden')).toBeTruthy()
  expect(fetch).not.toHaveBeenCalled()
})
test('sends the registration contract, prevents repeat submissions, and confirms creation only on success', async () => {
  let finish: ((response: Response) => void) | undefined
  const fetch = vi.fn<(url: string, options: RequestInit) => Promise<Response>>(() => new Promise<Response>(resolve => { finish = resolve }))
  vi.stubGlobal('fetch', fetch)
  const user = setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  const pending = screen.getByRole('button', { name: 'Creando cuenta…' })
  expect(pending).toHaveProperty('disabled', true)
  await user.click(pending)
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch.mock.calls[0][0]).toBe('/api/v1/auth/register')
  expect(JSON.parse(String(fetch.mock.calls[0][1].body))).toEqual({ firstName: 'Camila', lastName: 'Salazar', email: 'camila@correo.pe', password: 'Hosteo2026*' })
  finish?.(new Response(JSON.stringify({ id: 9, firstName: 'Camila', lastName: 'Salazar', email: 'camila@correo.pe', roleId: 4 }), { status: 201 }))
  expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Tu cuenta se creó correctamente.')
  expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/login')
  expect(sessionStorage.length).toBe(0)
  expect(localStorage.length).toBe(0)
})
test.each([
  ['EMAIL_ALREADY_EXISTS', 'Este correo ya está registrado. Inicia sesión o utiliza otro.'],
])('shows duplicate account error for %s', async (code, message) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code }), { status: 409 })))
  const user = setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect(await screen.findByText(message)).toBeTruthy()
  expect(screen.queryByRole('status')).toBeNull()
})
test('preserves inputs on network failure and enables retry', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))
  const user = setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  expect((await screen.findByRole('alert')).textContent).toContain('No pudimos conectar')
  expect(screen.getByLabelText(/^Nombres/)).toHaveProperty('value', 'Camila')
  expect(screen.getByRole('button', { name: 'Crear cuenta' })).toHaveProperty('disabled', false)
})
test('associates backend validation with the corresponding field', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'VALIDATION_ERROR', fieldErrors: { firstName: 'Invalid name' } }), { status: 400 })))
  const user = setup(); await fill(user)
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  await waitFor(() => expect(screen.getByLabelText(/^Nombres/).getAttribute('aria-invalid')).toBe('true'))
  expect(screen.getByText('Revisa este dato. El servidor no lo aceptó.')).toBeTruthy()
})
