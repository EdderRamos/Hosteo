import { z } from 'zod'

export const roleSchema = z.enum(['GUEST', 'HOST', 'ADMINISTRATOR', 'SUPPORT'])
export type RoleCode = z.infer<typeof roleSchema>
export const roleLabels: Record<RoleCode, string> = {
  GUEST: 'Huésped', HOST: 'Anfitrión', ADMINISTRATOR: 'Administrador', SUPPORT: 'Soporte',
}
export function homePath(role?: RoleCode) {
  switch (role) {
    case 'HOST': return '/host'
    case 'ADMINISTRATOR':
    case 'SUPPORT': return '/hosteo'
    default: return '/guest'
  }
}
