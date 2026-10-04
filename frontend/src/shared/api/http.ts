export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const baseUrl = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

export async function request(path: string, options: RequestInit = {}): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, cache: 'no-store', signal: options.signal ?? AbortSignal.timeout(15000) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'No pudimos conectar con Hosteo. Revisa tu conexión e intenta nuevamente.')
  }
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: 'Revisa el correo y la contraseña ingresados.',
      401: 'Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.',
      403: 'Tu cuenta no tiene permiso para realizar esta acción.',
      429: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    }
    throw new ApiError(response.status, messages[response.status] ?? 'El servicio no está disponible. Intenta nuevamente en unos minutos.')
  }
  try { return await response.json() as unknown } catch { throw new ApiError(502, 'Recibimos una respuesta inesperada. Intenta nuevamente.') }
}
