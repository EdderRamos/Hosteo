import { z } from 'zod'
import { ApiError, request } from '../../shared/api/http'
import { propertyResponseSchema, type ReviewDecisionValues } from './schemas'
const pendingSchema = z.object({
  property: propertyResponseSchema.refine(value => value.status === 'PENDING_REVIEW', 'Property must be pending review'),
  host: z.object({ id: z.number().int().positive(), firstName: z.string(), lastName: z.string(), email: z.string() }),
}).refine(value => value.host.id === value.property.hostId, 'Host must match the property owner')
const pageSchema = z.object({ items: z.array(pendingSchema), total: z.number().int().nonnegative(), page: z.number().int().nonnegative(), pages: z.number().int().nonnegative() })
async function get<T>(path: string, token: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const response = await request(path, { headers: { Authorization: `Bearer ${token}` }, signal })
  const parsed = schema.safeParse(response)
  if (!parsed.success) throw new ApiError(502, 'No pudimos verificar la información de las propiedades pendientes. Intenta nuevamente.')
  return parsed.data
}
export const loadPendingProperties = (token: string, page: number, signal?: AbortSignal) => get(`/hosteo/properties/pending?page=${page}`, token, pageSchema, signal)
export const loadPendingProperty = (token: string, id: string, signal?: AbortSignal) => get(`/hosteo/properties/pending/${encodeURIComponent(id)}`, token, pendingSchema, signal)

export async function decideProperty(token: string, id: number, version: number, values: ReviewDecisionValues) {
  const response = await request(`/hosteo/properties/pending/${id}/decision`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ version, ...values }) })
  const parsed = propertyResponseSchema.safeParse(response)
  const expected = values.decision === 'APPROVED' ? 'PUBLISHED' : 'REJECTED'
  if (!parsed.success || parsed.data.id !== id || parsed.data.status !== expected || !parsed.data.reviewedAt || (expected === 'PUBLISHED' && !parsed.data.publishedAt))
    throw new ApiError(502, 'No pudimos confirmar la decisión. Reintenta la misma solicitud o consulta la bandeja actual.')
  return parsed.data
}
