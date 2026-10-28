import { z } from 'zod'
import { ApiError, request } from '../../shared/api/http'
import { API_BASE_URL } from '../../shared/api/config'
import { logout } from '../auth/session'
import { bookingSchema } from './api'
export const reportFiltersSchema = z.object({ startDate: z.iso.date(), endDate: z.iso.date(), status: z.union([bookingSchema.shape.status, z.literal('')]) }).refine(value => value.endDate >= value.startDate && (Date.parse(value.endDate) - Date.parse(value.startDate)) / 86400000 <= 365, { message: 'Elige un rango ordenado de llegadas de hasta 366 días.', path: ['endDate'] })
export type ReportFilters = z.infer<typeof reportFiltersSchema>
const row = z.object({ id: z.number().int().positive(), confirmationCode: z.string().uuid(), propertyId: z.number().int().positive(), propertyTitle: z.string(), guestName: z.string(), guestEmail: z.string(), hostName: z.string(), checkIn: z.iso.date(), checkOut: z.iso.date(), guestCount: z.number().int().positive(), status: bookingSchema.shape.status, totalAmount: z.number().nonnegative(), currency: z.enum(['PEN', 'USD']) })
const reportSchema = z.object({ startDate: z.iso.date(), endDate: z.iso.date(), status: bookingSchema.shape.status.nullable(), generatedAt: z.string().refine(value => Number.isFinite(Date.parse(value))), records: z.object({ items: z.array(row), total: z.number().int().nonnegative(), page: z.number().int().nonnegative(), pages: z.number().int().nonnegative() }), bookingsByStatus: z.record(z.string(), z.number().int().nonnegative()), nonCancelledAmountByCurrency: z.record(z.string(), z.number().nonnegative()) })
const params = (filters: ReportFilters) => new URLSearchParams({ startDate: filters.startDate, endDate: filters.endDate, ...(filters.status ? { status: filters.status } : {}) })
export async function loadReport(token: string, filters: ReportFilters, page: number, signal?: AbortSignal) {
 try {
  const query = params(filters); query.set('page', String(page))
  const parsed = reportSchema.safeParse(await request(`/admin/reports/bookings?${query}`, { headers: { Authorization: `Bearer ${token}` }, signal }))
  if (!parsed.success) throw new ApiError(502, 'No pudimos verificar el reporte del servidor.')
  return parsed.data
 } catch (error) { if (error instanceof ApiError && error.status === 401) logout(); throw error }
}
export async function downloadReport(token: string, filters: ReportFilters) {
 let response: Response
 try { response = await fetch(`${API_BASE_URL}/admin/reports/bookings/export?${params(filters)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(30000) }) } catch { throw new Error('No pudimos descargar el reporte. Revisa tu conexión.') }
 if (response.status === 401) { logout(); throw new Error('Tu sesión expiró.') }
 if (!response.ok) throw new Error(response.status === 400 ? 'Reduce el rango o los filtros: el archivo admite hasta 10 000 reservas.' : 'No se pudo descargar el reporte.')
 if (!response.headers.get('content-type')?.includes('text/csv')) throw new Error('El archivo recibido no es un reporte CSV válido.')
 const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = `reservas-${filters.startDate}-${filters.endDate}.csv`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
