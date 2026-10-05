import { request, ApiError } from '../../shared/api/http'
import { propertyResponseSchema, type PropertyValues, type HostProperty } from './schemas'
function parse(response: unknown): HostProperty {
  const parsed = propertyResponseSchema.safeParse(response)
  if (!parsed.success) throw new ApiError(502, 'No pudimos confirmar el registro. Conserva los datos y reintenta: este mismo intento no creará otra propiedad.')
  return parsed.data
}
export async function createProperty(token: string, values: PropertyValues, key: string) {
  return parse(await request('/host/properties', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(values) }))
}
export async function loadProperty(token: string, id: string, signal?: AbortSignal) {
  return parse(await request(`/host/properties/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, signal }))
}
