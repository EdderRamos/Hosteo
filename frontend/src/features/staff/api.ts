import { z } from 'zod'
import { ApiError, request } from '../../shared/api/http'
import { roleSchema, type RoleCode } from '../../shared/auth/roles'
export { roleLabels } from '../../shared/auth/roles'
export type { RoleCode } from '../../shared/auth/roles'
const accountSchema = z.object({ id: z.number(), firstName: z.string(), lastName: z.string(), email: z.string(), roleCode: roleSchema, active: z.boolean(), version: z.number() })
export type StaffAccount = z.infer<typeof accountSchema>
const pageSchema = z.object({ items: z.array(accountSchema), total: z.number(), page: z.number(), pages: z.number() })
const summarySchema = z.object({ guests: z.number(), hosts: z.number(), administrators: z.number(), support: z.number() })
async function get<T>(path: string, token: string, schema: z.ZodType<T>, signal?: AbortSignal, options: RequestInit = {}): Promise<T> {
  const response = await request(path, { ...options, signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
  const parsed = schema.safeParse(response)
  if (!parsed.success) throw new ApiError(502, 'No pudimos verificar la respuesta del portal.')
  return parsed.data
}
export const loadAccounts = (token: string, query: string, page: number, signal: AbortSignal) => get(`/hosteo/users?${new URLSearchParams({ query, page: String(page) })}`, token, pageSchema, signal)
export const loadSummary = (token: string, signal: AbortSignal) => get('/hosteo/summary', token, summarySchema, signal)
export const loadRoles = (token: string, signal: AbortSignal) => get('/hosteo/roles', token, z.array(roleSchema), signal)
export const assignRole = (token: string, user: StaffAccount, roleCode: RoleCode) => get(`/hosteo/users/${user.id}/role`, token, accountSchema, undefined, { method: 'PATCH', body: JSON.stringify({ roleCode, version: user.version }) })

export const updateUserStatus = (token: string, user: StaffAccount, active: boolean) => get(`/hosteo/users/${user.id}/status`, token, accountSchema, undefined, { method: 'PATCH', body: JSON.stringify({ active, version: user.version }) })
