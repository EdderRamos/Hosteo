import { z } from 'zod'
import { roleSchema } from '../../shared/auth/roles'
import { request, ApiError } from '../../shared/api/http'
const language = z.object({ code: z.string(), proficiency: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'NATIVE']) })
export const profileSchema = z.object({
  id: z.number(), firstName: z.string(), lastName: z.string(), email: z.string(), roleId: z.number(), roleCode: roleSchema,
  phone: z.string().nullable(), gender: z.enum(['FEMALE', 'MALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY']).nullable(),
  dateOfBirth: z.string().nullable(), biography: z.string().nullable(), occupation: z.string().nullable(),
  location: z.string().nullable(), avatarUrl: z.string().nullable(), languages: z.array(language), interests: z.array(z.string()),
  memberSince: z.string().nullable(), version: z.number(),
})
export type Profile = z.infer<typeof profileSchema>
export type ProfileUpdate = Omit<Profile, 'id' | 'roleId' | 'roleCode' | 'memberSince' | 'avatarUrl'>
export async function loadProfile(token: string, signal?: AbortSignal) {
  return parse(await request('/profile', { headers: { Authorization: `Bearer ${token}` }, signal }))
}
export async function saveProfile(token: string, values: ProfileUpdate) {
  return parse(await request('/profile', { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(values) }))
}
function parse(value: unknown): Profile {
  const result = profileSchema.safeParse(value)
  if (!result.success) throw new ApiError(502, 'No pudimos interpretar los datos del perfil.')
  return result.data
}
