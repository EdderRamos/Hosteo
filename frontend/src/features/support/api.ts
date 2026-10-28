import { z } from 'zod'
import { ApiError, request } from '../../shared/api/http'
import { logout } from '../auth/session'
import { bookingSchema, paymentSchema } from '../operations/api'
import { roleSchema } from '../../shared/auth/roles'
import { propertyResponseSchema, propertyListSchema } from '../properties/schemas'
const userSchema = z.object({ id: z.number().int().positive(), firstName: z.string(), lastName: z.string(), email: z.string(), roleCode: roleSchema, active: z.boolean(), version: z.number().int().nonnegative() })
const usersSchema = z.object({ items: z.array(userSchema), total: z.number().int().nonnegative(), page: z.number().int().nonnegative(), pages: z.number().int().nonnegative() })
async function get<T>(path: string, token: string, schema: z.ZodType<T>, signal?: AbortSignal) {
 try { const parsed = schema.safeParse(await request(path, { headers: { Authorization: `Bearer ${token}` }, signal })); if (!parsed.success) throw new ApiError(502, 'No pudimos verificar la respuesta de soporte.'); return parsed.data } catch (error) { if (error instanceof ApiError && error.status === 401) logout(); if (error instanceof ApiError && error.status === 404) throw new Error('No encontramos el registro solicitado o su asociación. Comprueba el identificador y actualiza el listado.', { cause: error }); throw error }
}
export const searchUsers = (token: string, query: string, page: number, signal?: AbortSignal) => get(`/support/users?${new URLSearchParams({ query, page: String(page) })}`, token, usersSchema, signal)
export const loadUser = (token: string, id: string, signal?: AbortSignal) => get(`/support/users/${encodeURIComponent(id)}`, token, userSchema, signal)
export const loadProperties = (token: string, id: string, page: number, signal?: AbortSignal) => get(`/support/users/${encodeURIComponent(id)}/properties?page=${page}`, token, propertyListSchema, signal)
export const loadProperty = (token: string, id: string, propertyId: string, signal?: AbortSignal) => get(`/support/users/${encodeURIComponent(id)}/properties/${encodeURIComponent(propertyId)}`, token, propertyResponseSchema, signal)

export const bookingSearchSchema = z.object({ id: z.string().trim().refine(v => !v || /^[1-9]\d*$/.test(v) && BigInt(v) <= 9223372036854775807n, 'Ingresa un ID de reserva válido.'), confirmationCode: z.union([z.string().uuid('Ingresa el código completo de confirmación.'), z.literal('')]), email: z.string().trim().max(100) })
export type BookingFilters = z.infer<typeof bookingSearchSchema>

const bookingsSchema = z.object({ items: z.array(bookingSchema), total: z.number().int().nonnegative(), page: z.number().int().nonnegative(), pages: z.number().int().nonnegative() })
const operationalSchema = z.object({ generatedAt: z.string().refine(v => Number.isFinite(Date.parse(v))), today: z.iso.date(), properties: z.number().int().nonnegative(), propertiesByStatus: z.record(z.string(), z.number()), bookings: z.number().int().nonnegative(), bookingsByStatus: z.record(z.string(), z.number()), upcomingArrivals: z.number().int().nonnegative(), activeBlocks: z.number().int().nonnegative() })
export const searchBookings = (token: string, filters: BookingFilters, page: number, signal?: AbortSignal) => {
 const params = new URLSearchParams({ page: String(page), email: filters.email }); if (filters.id) params.set('id', filters.id); if (filters.confirmationCode) params.set('confirmationCode', filters.confirmationCode)
 return get(`/support/bookings?${params}`, token, bookingsSchema, signal)
}
export const loadBooking = (token: string, id: string, signal?: AbortSignal) => get(`/support/bookings/${encodeURIComponent(id)}`, token, bookingSchema, signal)
export const loadPayment = (token: string, id: string, signal?: AbortSignal) => get(`/support/bookings/${encodeURIComponent(id)}/payment`, token, z.object({ payment: paymentSchema.nullable() }).transform(value => value.payment), signal)
export const operationalSummary = (token: string, signal?: AbortSignal) => get('/support/operations/summary', token, operationalSchema, signal)
