import { useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { RoleCode } from '../../shared/auth/roles'
import type { Scope } from './api'
export type Role = Extract<RoleCode, 'GUEST' | 'HOST' | 'ADMINISTRATOR'>
export const scope = (role: Role): Scope => role === 'GUEST' ? 'guest' : role === 'HOST' ? 'host' : 'admin'
export const base = (role: Role) => role === 'ADMINISTRATOR' ? '/hosteo' : `/${scope(role)}`
export const title = (role: Role) => role === 'GUEST' ? 'Mis reservas' : role === 'HOST' ? 'Reservas de mis propiedades' : 'Todas las reservas'
export const time = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(value))
export function usePage() { const [params, setParams] = useSearchParams(); const raw = params.get('page') ?? '0'; const page = /^\d+$/.test(raw) && Number(raw) <= 100000 ? Number(raw) : 0; return { page, change: (value: number) => setParams({ page: String(value) }) } }
export function useRefresh() { const client = useQueryClient(); return () => client.invalidateQueries({ queryKey: ['operations'] }) }

