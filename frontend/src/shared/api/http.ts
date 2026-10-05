import { API_BASE_URL } from './config'

export class ApiError extends Error {
  status: number
  code?: string
  fieldErrors: Record<string, string>
  constructor(status: number, message: string, code?: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  if (!API_BASE_URL) throw new ApiError(0, 'Falta configurar VITE_API_URL para conectar con Hosteo.')
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, cache: 'no-store', signal: options.signal ?? AbortSignal.timeout(15000) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'No pudimos conectar con Hosteo. Revisa tu conexión e intenta nuevamente.')
  }
  if (!response.ok) {
    let code: string | undefined
    const fieldErrors: Record<string, string> = {}
    try {
      const body: unknown = await response.json()
      if (typeof body === 'object' && body !== null) {
        if ('code' in body && typeof body.code === 'string') code = body.code
        if ('fieldErrors' in body && typeof body.fieldErrors === 'object' && body.fieldErrors !== null) {
          for (const [field, message] of Object.entries(body.fieldErrors)) if (typeof message === 'string') fieldErrors[field] = message
        }
      }
    } catch { /* HTTP status still provides a useful error if the body is absent. */ }
    const messages: Record<number, string> = {
      400: 'Revisa los datos ingresados e intenta nuevamente.',
      401: 'Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.',
      403: 'Tu cuenta no tiene permiso para realizar esta acción.',
      409: 'Ya existe una cuenta con esos datos. Revisa tu información o inicia sesión.',
      429: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    }
    throw new ApiError(response.status, messages[response.status] ?? 'El servicio no está disponible. Intenta nuevamente en unos minutos.', code, fieldErrors)
  }
  try { return await response.json() as unknown } catch { throw new ApiError(502, 'Recibimos una respuesta inesperada. Intenta nuevamente.') }
}
