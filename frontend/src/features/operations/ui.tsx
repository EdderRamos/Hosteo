import { useEffect, useRef, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useSession } from '../auth/session'
import { homePath } from '../../shared/auth/roles'
import { AccountHeader } from '../../shared/ui/AccountHeader'
import { StaffHeader, StaffSidebar } from '../../shared/ui/StaffNavigation'
import { base, title, type Role } from './hooks'
import '../../styles/guest-home.css'
import '../../styles/staff.css'
import '../../styles/operations.css'
export function RolePage({ role, children }: { role: Role; children: (token: string) => ReactNode }) {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== role) return <Navigate to={homePath(session.user.roleCode)} replace />
  const navigation = <nav className="ops-nav" aria-label="Operaciones"><Link to={homePath(role)}>Inicio</Link>{role !== 'GUEST' && <Link to={`${base(role)}/operations`}>Resumen y propiedades</Link>}<Link to={`${base(role)}/bookings`}>{title(role)}</Link>{role === 'ADMINISTRATOR' && <Link to="/hosteo/payments">Pagos simulados</Link>}</nav>
  return role === 'ADMINISTRATOR' ? <div className="staff-app"><StaffHeader name={`${session.user.firstName} ${session.user.lastName}`} admin /><StaffSidebar admin active="operations" /><main className="staff-main ops-main">{navigation}<div key={session.accessToken}>{children(session.accessToken)}</div></main></div> : <div className="operations-app"><AccountHeader /><main className="guest-container ops-main">{navigation}<div key={session.accessToken}>{children(session.accessToken)}</div></main></div>
}
export function Confirmation({ label, busy, cancel, children }: { label: string; busy: boolean; cancel: () => void; children: ReactNode }) {
  const region = useRef<HTMLDivElement>(null)
  useEffect(() => { const previous = document.activeElement; region.current?.focus(); return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus() } }, [])
  return <div className="ops-confirm" role="region" tabIndex={-1} ref={region} aria-label={label} aria-busy={busy} onKeyDown={event => { if (event.key === 'Escape' && !busy) cancel() }}>{children}</div>
}
export function ErrorBox({ error, retry }: { error: Error; retry?: () => void }) { return <div className="ops-error" role="alert"><p>{error.message}</p>{retry && <button onClick={retry}>Reintentar</button>}</div> }
export function Pagination({ page, pages, change, busy }: { page: number; pages: number; change: (page: number) => void; busy?: boolean }) { return pages > 1 ? <nav className="ops-pagination" aria-label="Páginas de resultados"><button disabled={page === 0 || busy} onClick={() => change(page - 1)}>Anterior</button><span>Página {page + 1} de {pages}</span><button disabled={page + 1 >= pages || busy} onClick={() => change(page + 1)}>Siguiente</button></nav> : null }
export function Heading({ text, note }: { text: string; note: string }) { return <header className="ops-heading"><p>HOSTEO · OPERACIONES</p><h1>{text}</h1><p>{note}</p></header> }
