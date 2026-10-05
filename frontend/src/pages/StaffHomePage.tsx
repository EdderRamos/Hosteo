import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { StaffHeader, StaffSidebar } from '../shared/ui/StaffNavigation'
import { homePath } from '../shared/auth/roles'
import { logout, useSession } from '../features/auth/session'
import { ApiError } from '../shared/api/http'
import { assignRole, updateUserStatus, loadAccounts, loadRoles, loadSummary, roleLabels, type RoleCode, type StaffAccount } from '../features/staff/api'
import '../styles/staff.css'

type PendingChange = { kind: 'role'; user: StaffAccount; role: RoleCode } | { kind: 'status'; user: StaffAccount; active: boolean }

export function StaffHomePage() {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== 'ADMINISTRATOR' && session.user.roleCode !== 'SUPPORT') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <StaffPortal key={session.accessToken} token={session.accessToken} currentId={session.user.id} name={`${session.user.firstName} ${session.user.lastName}`} admin={session.user.roleCode === 'ADMINISTRATOR'} />
}

function StaffPortal({ token, currentId, name, admin }: { token: string; currentId: number; name: string; admin: boolean }) {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof loadSummary>> | null>(null)
  const [accounts, setAccounts] = useState<Awaited<ReturnType<typeof loadAccounts>> | null>(null)
  const [roles, setRoles] = useState<RoleCode[]>([])
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState<PendingChange | null>(null)
  const [saving, setSaving] = useState(false)
  const confirmationRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement | HTMLSelectElement | null>(null)
  useEffect(() => {
    if (pending) {
      confirmationRef.current?.focus()
    }
  }, [pending])
  function cancelChange() { setPending(null); triggerRef.current?.focus() }
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([loadSummary(token, controller.signal), loadRoles(token, controller.signal)]).then(([stats, options]) => {
      setSummary(stats); setRoles(options)
    }).catch(failure)
    function failure(value: unknown) {
      if (controller.signal.aborted) return
      if (value instanceof ApiError && value.status === 401) logout()
      setError(value instanceof Error ? value.message : 'No pudimos cargar el portal.')
    }
    return () => controller.abort()
  }, [token, revision])
  useEffect(() => {
    const controller = new AbortController()
    loadAccounts(token, search, page, controller.signal).then(setAccounts).catch(value => {
      if (controller.signal.aborted) return
      if (value instanceof ApiError && value.status === 401) logout()
      setError(value instanceof Error ? value.message : 'No pudimos cargar los usuarios.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, search, page, revision])
  function reload() { setLoading(true); setError(''); setPending(null); setRevision(value => value + 1) }
  function submitSearch(event: FormEvent) { event.preventDefault(); setAccounts(null); setLoading(true); setError(''); setPending(null); setSearch(query.trim()); setPage(0); setRevision(value => value + 1) }
  async function save() {
    if (!pending || saving) return
    setSaving(true); setError(''); setNotice('')
    try {
      if (pending.kind === 'role') {
        await assignRole(token, pending.user, pending.role)
        setNotice(`Rol actualizado para ${pending.user.firstName} ${pending.user.lastName}. Sus sesiones anteriores ya no tienen acceso.`)
      } else {
        await updateUserStatus(token, pending.user, pending.active)
        setNotice(pending.active
          ? `Cuenta de ${pending.user.firstName} ${pending.user.lastName} activada. Ya puede iniciar sesión nuevamente.`
          : `Cuenta de ${pending.user.firstName} ${pending.user.lastName} desactivada. Su acceso está bloqueado y sus datos se conservan.`)
      }
      reload()
    } catch (value) {
      if (value instanceof ApiError && value.status === 401) logout()
      setError(value instanceof ApiError && value.status === 409 ? 'Esta cuenta cambió mientras la editabas. Recarga los usuarios antes de continuar.' : value instanceof ApiError && value.status === 400 ? 'No se puede realizar este cambio de rol. Recarga los usuarios e intenta nuevamente.' : value instanceof Error ? value.message : 'No pudimos actualizar la cuenta.')
    } finally { setSaving(false) }
  }
  const count = summary ? summary.guests + summary.hosts + summary.support + summary.administrators : null
  return <div className="staff-app">
    <StaffHeader name={name} admin={admin} /><StaffSidebar admin={admin} />
    <main className="staff-main" id="staff-overview"><div className="staff-title"><div><p className="staff-eyebrow">HOSTEO · OPERACIONES LIMA</p><h1>Panel General</h1><p>Centro de operaciones unificado · Portal de personal Hosteo</p></div><span className="staff-access">{admin ? 'Acceso administrativo' : 'Acceso de consulta'}</span></div>
      <section className="staff-stats" aria-label="Resumen de usuarios"><Stat title="ECOSISTEMA DE USUARIOS" value={count} text="Cuentas registradas en la plataforma" icon="♙" /><Stat title="HUÉSPEDES" value={summary?.guests ?? null} text="Usuarios con rol huésped" icon="⌂" /><Stat title="ANFITRIONES" value={summary?.hosts ?? null} text="Usuarios con rol anfitrión" icon="◇" /><Stat title="SOPORTE" value={summary?.support ?? null} text="Atención y consulta operativa" icon="◇" /><Stat title="ADMINISTRADORES" value={summary?.administrators ?? null} text="Gestión de acceso y permisos" icon="▣" /></section>
      <section className="staff-panel staff-users" id="staff-users"><div className="staff-panel-heading"><div><h2>Asignación de Roles y Cuentas</h2><p>Cuatro roles: Huésped, Anfitrión, Soporte y Administrador.</p></div><form className="staff-search" onSubmit={submitSearch}><label className="staff-sr" htmlFor="staff-search">Buscar por email o nombre</label><input id="staff-search" placeholder="Buscar por email o nombre…" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} disabled={saving} /><button disabled={saving}>Buscar</button></form></div>
        {!admin && <p className="staff-info">Tu rol de soporte permite consultar cuentas. Solo el administrador puede cambiar roles o activar y desactivar cuentas.</p>}
        {notice && <p className="staff-success" role="status">{notice}</p>}
        {error && <div className="staff-error" role="alert"><p>{error}</p><button onClick={reload} disabled={saving}>Recargar usuarios</button></div>}
        {loading ? <p className="staff-empty" role="status">Cargando usuarios…</p> : accounts && <><div className="staff-table-scroll"><table><thead><tr><th>USUARIO</th><th>ROL ACTUAL</th><th>ESTADO</th><th>{admin ? 'REASIGNAR ROL' : 'ACCESO'}</th>{admin && <th>GESTIONAR ACCESO</th>}</tr></thead><tbody>{accounts.items.map(user => <tr key={user.id}><td data-label="Usuario"><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small>{currentId === user.id && <small>Tu cuenta</small>}</td><td data-label="Rol actual"><span className={`staff-badge staff-badge-${user.roleCode}`}>{roleLabels[user.roleCode]}</span></td><td data-label="Estado"><span className={user.active ? 'staff-active' : 'staff-inactive'}>● {user.active ? 'Activo' : 'Inactivo'}</span></td><td data-label={admin ? 'Reasignar rol' : 'Acceso'}>{admin && currentId !== user.id ? <select aria-label={`Rol de ${user.firstName} ${user.lastName}`} value={pending?.kind === 'role' && pending.user.id === user.id ? pending.role : user.roleCode} disabled={saving || roles.length === 0} onChange={event => { triggerRef.current = event.currentTarget; const role = roles.find(role => role === event.target.value); if (role) { setPending(role === user.roleCode ? null : { kind: 'role', user, role }); setNotice('') } }}>{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select> : <span className="staff-muted">{admin ? 'Cuenta protegida' : 'Solo consulta'}</span>}</td>{admin && <td data-label="Gestionar acceso">{currentId !== user.id ? <button className={user.active ? 'staff-status-action staff-danger-outline' : 'staff-status-action staff-green-outline'} disabled={saving} aria-label={`${user.active ? 'Desactivar' : 'Activar'} a ${user.firstName} ${user.lastName}`} onClick={event => { triggerRef.current = event.currentTarget; setPending({ kind: 'status', user, active: !user.active }); setNotice(''); setError('') }}>{user.active ? 'Desactivar' : 'Activar'}</button> : <span className="staff-muted">No puedes desactivarte</span>}</td>}</tr>)}</tbody></table></div>{accounts.items.length === 0 && <p className="staff-empty">No encontramos usuarios con esa búsqueda.</p>}<div className="staff-pagination"><span>{accounts.total} cuentas · Página {accounts.page + 1} de {Math.max(accounts.pages, 1)}</span><div><button disabled={page === 0 || saving} onClick={() => { setLoading(true); setPending(null); setPage(page - 1) }}>Anterior</button><button disabled={page + 1 >= accounts.pages || saving} onClick={() => { setLoading(true); setPending(null); setPage(page + 1) }}>Siguiente</button></div></div></>}
        {pending && <div ref={confirmationRef} tabIndex={-1} role="region" aria-busy={saving} className={`staff-confirm${pending.kind === 'status' && !pending.active ? ' staff-confirm-danger' : ''}`} aria-label={pending.kind === 'role' ? 'Confirmar cambio de rol' : 'Confirmar cambio de acceso'}><div><strong>{pending.kind === 'role' ? 'Confirmar cambio de permisos' : pending.active ? 'Activar cuenta' : 'Desactivar cuenta'}</strong>{pending.kind === 'role' ? <><p>{pending.user.firstName} {pending.user.lastName}: {roleLabels[pending.user.roleCode]} → {roleLabels[pending.role]}.</p><p>La cuenta deberá iniciar sesión nuevamente. {pending.role === 'ADMINISTRATOR' && 'Tendrá permiso para asignar roles a otros usuarios.'}</p></> : <><p>{pending.user.firstName} {pending.user.lastName} · {pending.user.email}</p><p>{pending.active ? 'Podrá volver a iniciar sesión con su rol actual. Las sesiones anteriores permanecerán invalidadas.' : 'No podrá iniciar sesión ni utilizar sus sesiones actuales. Sus datos y registros se conservarán.'}</p></>}</div><div><button disabled={saving} onClick={cancelChange}>Cancelar</button><button className={pending.kind === 'status' && !pending.active ? 'staff-danger' : 'staff-primary'} disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : pending.kind === 'role' ? 'Confirmar cambio' : pending.active ? 'Confirmar activación' : 'Confirmar desactivación'}</button></div></div>}
        <div className="staff-policy">⚿ Los cambios de rol o acceso invalidan las sesiones anteriores. No puedes cambiar tu propio rol ni desactivar tu cuenta.</div>
      </section>
      <div className="staff-upcoming"><section className="staff-panel"><span className="staff-module-icon">⌂</span><h2>Revisión de propiedades</h2>{admin ? <><p>Consulta los alojamientos enviados por anfitriones y su información pendiente de revisión.</p><Link className="staff-review-link" to="/hosteo/properties/pending">Abrir bandeja de validación →</Link></> : <><p>La consulta de propiedades para soporte se habilitará con su respectivo flujo.</p><span className="staff-pending-badge">Pendiente · HU-34</span></>}</section><section className="staff-panel"><span className="staff-module-icon">◇</span><h2>Operación de alojamientos</h2>{admin ? <><p>Gestiona disponibilidad, consulta reservas y registra su seguimiento operativo.</p><Link className="staff-review-link" to="/hosteo/operations">Disponibilidad e indicadores →</Link></> : <><p>Las consultas de soporte se integrarán en sus respectivas historias.</p><span className="staff-pending-badge">Módulos de soporte pendientes</span></>}</section></div>
      <footer className="staff-footer">Hosteo S.A.C. · Lima, Perú <Link to="/profile">Mi perfil →</Link></footer>
    </main></div>
}
function Stat({ title, value, text, icon }: { title: string; value: number | null; text: string; icon: string }) {
  return <article className="staff-stat"><div><h2>{title}</h2><span aria-hidden="true">{icon}</span></div><strong>{value ?? '—'}</strong><p>{text}</p><div className="staff-stat-rule" /></article>
}
