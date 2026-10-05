import { z } from 'zod'

const text = (max: number) => z.string().trim().min(1, 'Completa este campo.').max(max, `Usa hasta ${max} caracteres.`)
const count = (min: number) => z.number().int('Ingresa un número entero.').min(min, `El mínimo es ${min}.`).max(2147483647, 'El número es demasiado grande.')
export const propertySchema = z.object({
  title: text(150), description: text(5000), type: z.enum(['APARTMENT', 'HOUSE', 'ROOM']),
  address: text(255), city: text(100), district: text(100),
  capacity: count(1), bedrooms: count(0), beds: count(1), bathrooms: count(0),
  nightlyRate: z.number().min(0.01, 'La tarifa debe ser mayor que cero.').max(9999999999.99, 'La tarifa es demasiado grande.').refine(value => /^\d+(?:\.\d{1,2})?$/.test(String(value)), 'Usa como máximo dos decimales.'),
  currency: z.enum(['PEN', 'USD']),
})
export type PropertyValues = z.infer<typeof propertySchema>
export const propertyResponseSchema = propertySchema.extend({
  id: z.number().int().positive(), hostId: z.number().int().positive(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']),
  createdAt: z.string().refine(value => Number.isFinite(Date.parse(value))), updatedAt: z.string().refine(value => Number.isFinite(Date.parse(value))), version: z.number().int().nonnegative(),
  submittedAt: z.string().refine(value => Number.isFinite(Date.parse(value))).nullable().optional(),
})
export type HostProperty = z.infer<typeof propertyResponseSchema>
export const typeLabels = { APARTMENT: 'Departamento', HOUSE: 'Casa', ROOM: 'Habitación' }

export const propertyListSchema = z.object({ items: z.array(propertyResponseSchema), total: z.number().int().nonnegative(), page: z.number().int().nonnegative(), pages: z.number().int().nonnegative() })
export const statusLabels = { DRAFT: 'Borrador', PENDING_REVIEW: 'Pendiente de revisión', PUBLISHED: 'Publicada', REJECTED: 'Rechazada' } as const
export const statusDescriptions = { DRAFT: 'Todavía no está publicada.', PENDING_REVIEW: 'En espera de revisión administrativa.', PUBLISHED: 'Disponible en el catálogo.', REJECTED: 'No aprobada para publicación.' } as const
