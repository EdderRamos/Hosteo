import { z } from 'zod'
import { request, ApiError } from '../../shared/api/http'
import { propertyListSchema, propertyResponseSchema, type PropertyValues, type HostProperty } from './schemas'
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

export async function loadProperties(token: string, page: number, signal?: AbortSignal) {
  const response = await request(`/host/properties?page=${page}`, { headers: { Authorization: `Bearer ${token}` }, signal })
  const parsed = propertyListSchema.safeParse(response)
  if (!parsed.success) throw new ApiError(502, 'No pudimos leer tus propiedades. Intenta nuevamente.')
  return parsed.data
}

export async function updateProperty(token: string, id: number, values: PropertyValues, version: number) {
  const response = await request(`/host/properties/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, version }) })
  const parsed = propertyResponseSchema.safeParse(response)
  if (!parsed.success) throw new ApiError(502, 'No pudimos confirmar el guardado. Consulta la información actual antes de volver a guardar.')
  return parsed.data
}

export async function submitProperty(token: string, id: number, version: number) {
  const response = await request(`/host/properties/${id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ version }) })
  const parsed = propertyResponseSchema.safeParse(response)
  if (!parsed.success || parsed.data.id !== id || parsed.data.status !== 'PENDING_REVIEW' || !parsed.data.submittedAt)
    throw new ApiError(502, 'No pudimos confirmar el envío. Consulta el estado actual o reintenta la solicitud.')
  return parsed.data
}

const removalPreviewSchema = z.object({ propertyId: z.number().int().positive(), version: z.number().int().nonnegative(), mode: z.enum(['DELETE', 'ARCHIVE']), hasBookings: z.boolean() })
export type RemovalPreview = z.infer<typeof removalPreviewSchema>
export async function previewPropertyRemoval(token: string, id: number, signal?: AbortSignal) {
  const parsed = removalPreviewSchema.safeParse(await request(`/host/properties/${id}/removal`, { headers: { Authorization: `Bearer ${token}` }, signal }))
  if (!parsed.success || parsed.data.propertyId !== id) throw new ApiError(502, 'No pudimos verificar cómo retirar esta propiedad.')
  return parsed.data
}
export async function removeProperty(token: string, preview: RemovalPreview) {
  const params = new URLSearchParams({ version: String(preview.version), mode: preview.mode })
  const parsed = z.object({ propertyId: z.number().int().positive(), mode: z.enum(['DELETE', 'ARCHIVE']) }).safeParse(await request(`/host/properties/${preview.propertyId}?${params}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }))
  if (!parsed.success || parsed.data.propertyId !== preview.propertyId || parsed.data.mode !== preview.mode) throw new ApiError(502, 'No pudimos confirmar el resultado. Actualiza el listado antes de reintentar.')
  return parsed.data
}
