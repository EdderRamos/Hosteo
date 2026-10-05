import { z } from 'zod'
import { request, ApiError } from '../../shared/api/http'
import { logout } from '../auth/session'
import { propertySchema, propertyResponseSchema } from '../properties/schemas'
const amount = z.number().finite().nonnegative()
const instant = z.string().refine(value => Number.isFinite(Date.parse(value)))
const id = z.number().int().positive()
const identity = z.object({ id, name: z.string(), email: z.string() })
export const publicPropertySchema = propertySchema.extend({ id, version: z.number().int().nonnegative() })
export const paymentSchema = z.object({ id, bookingId: id, reference: z.string().uuid(), status: z.enum(['PENDING', 'APPROVED', 'REJECTED']), amount, currency: z.enum(['PEN', 'USD']), processedAt: instant, version: z.number().int().nonnegative() })
export const bookingSchema = z.object({ id, confirmationCode: z.string().uuid(), propertyId: id, propertyTitle: z.string(), district: z.string(), guest: identity, host: identity, checkIn: z.iso.date(), checkOut: z.iso.date(), guestCount: z.number().int().positive(), nightlyRate: amount, totalAmount: amount, currency: z.enum(['PEN', 'USD']), status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']), confirmedAt: instant, createdAt: instant, version: z.number().int().nonnegative(), payment: paymentSchema.nullable() })
const blockSchema = z.object({ id, propertyId: id, startDate: z.iso.date(), endDate: z.iso.date(), reason: z.string(), active: z.boolean(), createdById: id, createdAt: instant, version: z.number().int().nonnegative() })
const page = <T extends z.ZodType>(schema: T) => z.object({ items: z.array(schema), total: z.number().int().nonnegative(), page: z.number().int().nonnegative(), pages: z.number().int().nonnegative() })
const calendarSchema = z.object({ propertyId: id, startDate: z.iso.date(), endDate: z.iso.date(), blocks: z.array(blockSchema), reservations: z.array(z.object({ startDate: z.iso.date(), endDate: z.iso.date(), kind: z.literal('BOOKING') })) })
const availabilitySchema = z.object({ propertyId: id, propertyVersion: z.number().int().nonnegative(), checkIn: z.iso.date(), checkOut: z.iso.date(), guestCount: z.number().int().positive(), available: z.boolean(), nights: z.number().int().positive(), nightlyRate: amount, totalAmount: amount, currency: z.enum(['PEN', 'USD']) })
const summarySchema = z.object({ properties: z.number(), propertiesByStatus: z.record(z.string(), z.number()), bookings: z.number(), bookingsByStatus: z.record(z.string(), z.number()), upcomingBookings: z.number(), activeBlocks: z.number(), payments: z.number(), bookedAmountByCurrency: z.record(z.string(), amount), paidAmountByCurrency: z.record(z.string(), amount) })
const paymentRecordSchema = z.object({ payment: paymentSchema, confirmationCode: z.string().uuid(), propertyTitle: z.string(), guest: identity })
const historySchema = z.array(z.object({ previousStatus: bookingSchema.shape.status.nullable(), newStatus: bookingSchema.shape.status, comment: z.string().nullable(), changedAt: instant }))
export type Booking = z.infer<typeof bookingSchema>
export type BookingStatus = Booking['status']
export type PublicProperty = z.infer<typeof publicPropertySchema>
export type Block = z.infer<typeof blockSchema>
export type Quote = z.infer<typeof availabilitySchema>
export type Scope = 'guest' | 'host' | 'admin'
export const bookingLabels = { CONFIRMED: 'Confirmada', IN_PROGRESS: 'En curso', COMPLETED: 'Completada', CANCELLED: 'Cancelada' }
export const paymentLabels = { PENDING: 'Pendiente', APPROVED: 'Aprobado (simulado)', REJECTED: 'Rechazado (simulado)' }
export const money = (value: number, currency: string) => new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value)
export function today() { const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const get = (name: string) => parts.find(p => p.type === name)?.value; return `${get('year')}-${get('month')}-${get('day')}` }
export const addDays = (value: string, days: number) => { const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10) }
export const dateRangeSchema = z.object({ startDate: z.iso.date('Selecciona una fecha válida.'), endDate: z.iso.date('Selecciona una fecha válida.') }).refine(v => v.endDate > v.startDate && (Date.parse(v.endDate) - Date.parse(v.startDate)) / 86400000 <= 366, { message: 'La salida debe ser posterior al inicio, hasta 366 noches.', path: ['endDate'] })
export const staySchema = z.object({ checkIn: z.iso.date(), checkOut: z.iso.date(), guestCount: z.number().int().positive() }).refine(v => v.checkIn >= today() && v.checkOut > v.checkIn && (Date.parse(v.checkOut) - Date.parse(v.checkIn)) / 86400000 <= 366, { message: 'Elige fechas desde hoy, con salida posterior y hasta 366 noches.', path: ['checkOut'] })
async function call<T>(path: string, token: string | undefined, schema: z.ZodType<T>, options: RequestInit = {}): Promise<T> {
  try {
    const raw = await request(path, { ...options, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json', ...options.headers } })
    const parsed = schema.safeParse(raw)
    if (!parsed.success) throw new ApiError(502, 'No pudimos verificar la respuesta. Actualiza los datos antes de continuar.')
    return parsed.data
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 && token) logout()
      if (error.status === 409) throw new ApiError(409, 'Las fechas, el precio o el estado cambiaron. Actualiza los datos antes de continuar.')
      if (error.status === 404) throw new ApiError(404, 'El registro no está disponible para tu cuenta.')
    }
    throw error
  }
}
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })
export const catalog = (pageNumber: number, signal?: AbortSignal) => call(`/catalog/properties?page=${pageNumber}`, undefined, page(publicPropertySchema), { signal })
export const property = (propertyId: string, signal?: AbortSignal) => call(`/catalog/properties/${encodeURIComponent(propertyId)}`, undefined, publicPropertySchema, { signal })
export const availability = (token: string, propertyId: number, input: z.infer<typeof staySchema>) => call(`/guest/properties/${propertyId}/availability?${new URLSearchParams({ checkIn: input.checkIn, checkOut: input.checkOut, guestCount: String(input.guestCount) })}`, token, availabilitySchema)
export const reserve = (token: string, quote: Quote, key: string) => call('/guest/bookings', token, bookingSchema, { ...json('POST', { propertyId: quote.propertyId, propertyVersion: quote.propertyVersion, checkIn: quote.checkIn, checkOut: quote.checkOut, guestCount: quote.guestCount }), headers: { 'Idempotency-Key': key } })
export const bookings = (token: string, scope: Scope, pageNumber: number, signal?: AbortSignal) => call(`/${scope}/bookings?page=${pageNumber}`, token, page(bookingSchema), { signal })
export const booking = (token: string, scope: Scope, bookingId: string, signal?: AbortSignal) => call(`/${scope}/bookings/${encodeURIComponent(bookingId)}`, token, bookingSchema, { signal })
export const pay = (token: string, value: Booking) => call(`/guest/bookings/${value.id}/payment`, token, paymentSchema, json('POST', { version: value.version }))
export const changeStatus = (token: string, value: Booking, status: BookingStatus, comment: string) => call(`/admin/bookings/${value.id}/status`, token, bookingSchema, json('PATCH', { version: value.version, status, comment }))
export const history = (token: string, bookingId: number, signal?: AbortSignal) => call(`/admin/bookings/${bookingId}/history`, token, historySchema, { signal })
export const payments = (token: string, pageNumber: number, signal?: AbortSignal) => call(`/admin/payments?page=${pageNumber}`, token, page(paymentRecordSchema), { signal })
export const managedProperties = (token: string, scope: Scope, pageNumber: number, signal?: AbortSignal) => call(`/${scope}/managed-properties?page=${pageNumber}`, token, page(propertyResponseSchema), { signal })
export const calendar = (token: string, scope: Scope, propertyId: string, range: z.infer<typeof dateRangeSchema>, signal?: AbortSignal) => call(`/${scope}/properties/${encodeURIComponent(propertyId)}/calendar?${new URLSearchParams(range)}`, token, calendarSchema, { signal })
export const block = (token: string, scope: Scope, propertyId: string, values: z.infer<typeof dateRangeSchema> & { reason: string }) => call(`/${scope}/properties/${encodeURIComponent(propertyId)}/blocks`, token, blockSchema, json('POST', values))
export const deactivate = (token: string, scope: Scope, value: Block) => call(`/${scope}/properties/${value.propertyId}/blocks/${value.id}/deactivate`, token, blockSchema, json('PATCH', { version: value.version }))
export const summary = (token: string, scope: Scope, signal?: AbortSignal) => call(`/${scope}/operations/summary`, token, summarySchema, { signal })
