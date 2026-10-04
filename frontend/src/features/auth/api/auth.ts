import { request, ApiError } from '../../../shared/api/http'
import { loginResponseSchema, userSchema, type LoginValues } from '../schemas/login'

export async function login(values: LoginValues) {
  const response = await request('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: values.email, password: values.password }),
  })
  const parsed = loginResponseSchema.safeParse(response)
  if (!parsed.success) throw new ApiError(502, 'La respuesta de inicio de sesión no es válida. Intenta nuevamente.')
  return parsed.data
}

export async function currentUser(token: string, signal: AbortSignal) {
  const response = await request('/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal })
  const parsed = userSchema.safeParse(response)
  if (!parsed.success) throw new ApiError(502, 'No pudimos verificar tu sesión.')
  return parsed.data
}
