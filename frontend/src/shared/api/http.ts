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
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new ApiError(408, 'La solicitud tardó demasiado. Comprueba tu conexión y vuelve a intentarlo.')
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
      401: path === '/auth/login' ? 'Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.' : 'Tu sesión expiró o ya no es válida. Inicia sesión nuevamente.',
      403: 'Tu cuenta no tiene permiso para realizar esta acción.',
      404: 'No encontramos el registro solicitado. Actualiza el listado y comprueba el identificador.',
      408: 'La solicitud tardó demasiado. Revisa tu conexión y vuelve a intentarlo.',
      409: 'Los datos cambiaron o entran en conflicto con otro registro. Actualiza la información antes de continuar.',
      503: 'El servicio no está disponible temporalmente. Intenta nuevamente en unos minutos.',
      429: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    }
    const specific: Record<string, string> = { EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo. Usa otro correo o inicia sesión.', PROFILE_CONFLICT: 'El perfil cambió en otra sesión. Recarga sus datos antes de guardar.', VALIDATION_ERROR: 'Revisa los campos, las fechas y los parámetros ingresados.', INVALID_REQUEST: 'La solicitud contiene datos incompletos o con formato incorrecto.' }
    throw new ApiError(response.status, ((code && specific[code]) || messages[response.status]) ?? 'El servicio no está disponible. Intenta nuevamente en unos minutos.', code, fieldErrors)
  }
  try { return await response.json() as unknown } catch { throw new ApiError(502, 'Recibimos una respuesta inesperada. Intenta nuevamente.') }
}
