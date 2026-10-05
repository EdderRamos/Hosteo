import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { Brand } from '../components/Brand'
import { logout, useSession } from '../features/auth/session'
import { ApiError } from '../shared/api/http'
import { assignRole, loadAccounts, loadRoles, loadSummary, roleLabels, type RoleCode, type StaffAccount } from '../features/staff/api'
import '../styles/staff.css'

export function StaffHomePage() {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== 'ADMINISTRATOR' && session.user.roleCode !== 'SUPPORT') return <Navigate to="/home" replace />
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
  const [pending, setPending] = useState<{ user: StaffAccount; role: RoleCode } | null>(null)
  const [saving, setSaving] = useState(false)
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
      await assignRole(token, pending.user, pending.role)
      setNotice(`Rol actualizado para ${pending.user.firstName} ${pending.user.lastName}. Sus sesiones anteriores ya no tienen acceso.`)
      reload()
    } catch (value) {
      if (value instanceof ApiError && value.status === 401) logout()
      setError(value instanceof ApiError && value.status === 409 ? 'Esta cuenta cambió mientras la editabas. Recarga los usuarios antes de continuar.' : value instanceof ApiError && value.status === 400 ? 'No se puede realizar este cambio de rol. Recarga los usuarios e intenta nuevamente.' : value instanceof Error ? value.message : 'No pudimos guardar el rol.')
    } finally { setSaving(false) }
  }
  const count = summary ? summary.customers + summary.support + summary.administrators : null
  return <div className="staff-app">
    <header className="staff-header"><Brand /><div className="staff-header-right"><span className="staff-office">▦ Sede Lima Centro & Sur</span><details className="staff-account"><summary><span className="staff-avatar">{name.slice(0, 1)}</span><span><strong>{name}</strong><small>{admin ? 'ADMINISTRADOR' : 'SOPORTE'}</small></span><span aria-hidden="true">⌄</span></summary><button onClick={logout}>Cerrar sesión</button></details></div></header>
    <aside className="staff-sidebar"><p>GESTIÓN LIMA</p><a className="staff-nav-active" href="#staff-overview">▣ Panel General</a><a href="#staff-users">♙ Usuarios y Roles</a>{['Unidades Lima', 'Calendario & Tarifas', 'Check-in / Recepción', 'Liquidaciones'].map(label => <span className="staff-nav-pending" key={label}>{label}<small>Pendiente</small></span>)}<div className="staff-sidebar-bottom">Portal de personal <span>HU-05</span></div></aside>
    <main className="staff-main" id="staff-overview"><div className="staff-title"><div><p className="staff-eyebrow">HOSTEO · OPERACIONES LIMA</p><h1>Panel General</h1><p>Centro de operaciones unificado · Portal de personal Hosteo</p></div><span className="staff-access">{admin ? 'Acceso administrativo' : 'Acceso de consulta'}</span></div>
      <section className="staff-stats" aria-label="Resumen de usuarios"><Stat title="ECOSISTEMA DE USUARIOS" value={count} text="Cuentas registradas en la plataforma" icon="♙" /><Stat title="CUSTOMER" value={summary?.customers ?? null} text="Huéspedes y anfitriones" icon="⌂" /><Stat title="SOPORTE" value={summary?.support ?? null} text="Atención y consulta operativa" icon="◇" /><Stat title="ADMINISTRADORES" value={summary?.administrators ?? null} text="Gestión de acceso y permisos" icon="▣" /></section>
      <section className="staff-panel staff-users" id="staff-users"><div className="staff-panel-heading"><div><h2>Asignación de Roles y Cuentas</h2><p>Control de acceso: Customer (Huésped/Anfitrión), Soporte y Administrador.</p></div><form className="staff-search" onSubmit={submitSearch}><label className="staff-sr" htmlFor="staff-search">Buscar por email o nombre</label><input id="staff-search" placeholder="Buscar por email o nombre…" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} disabled={saving} /><button disabled={saving}>Buscar</button></form></div>
        {!admin && <p className="staff-info">Tu rol de soporte permite consultar cuentas. La asignación de roles corresponde al administrador.</p>}
        {notice && <p className="staff-success" role="status">{notice}</p>}
        {error && <div className="staff-error" role="alert"><p>{error}</p><button onClick={reload} disabled={saving}>Recargar usuarios</button></div>}
        {loading ? <p className="staff-empty" role="status">Cargando usuarios…</p> : accounts && <><div className="staff-table-scroll"><table><thead><tr><th>USUARIO</th><th>ROL ACTUAL</th><th>ESTADO</th><th>{admin ? 'REASIGNAR ROL' : 'ACCESO'}</th></tr></thead><tbody>{accounts.items.map(user => <tr key={user.id}><td data-label="Usuario"><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small>{currentId === user.id && <small>Tu cuenta</small>}</td><td data-label="Rol actual"><span className={`staff-badge staff-badge-${user.roleCode}`}>{roleLabels[user.roleCode]}</span></td><td data-label="Estado"><span className={user.active ? 'staff-active' : 'staff-inactive'}>● {user.active ? 'Activo' : 'Inactivo'}</span></td><td data-label={admin ? 'Reasignar rol' : 'Acceso'}>{admin && currentId !== user.id ? <select aria-label={`Rol de ${user.firstName} ${user.lastName}`} value={pending?.user.id === user.id ? pending.role : user.roleCode} disabled={saving || roles.length === 0} onChange={event => { const role = roles.find(role => role === event.target.value); if (role) { setPending(role === user.roleCode ? null : { user, role }); setNotice('') } }}>{roles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select> : <span className="staff-muted">{admin ? 'Cuenta protegida' : 'Solo consulta'}</span>}</td></tr>)}</tbody></table></div>{accounts.items.length === 0 && <p className="staff-empty">No encontramos usuarios con esa búsqueda.</p>}<div className="staff-pagination"><span>{accounts.total} cuentas · Página {accounts.page + 1} de {Math.max(accounts.pages, 1)}</span><div><button disabled={page === 0 || saving} onClick={() => { setLoading(true); setPending(null); setPage(page - 1) }}>Anterior</button><button disabled={page + 1 >= accounts.pages || saving} onClick={() => { setLoading(true); setPending(null); setPage(page + 1) }}>Siguiente</button></div></div></>}
        {pending && <div className="staff-confirm" aria-label="Confirmar cambio de rol"><div><strong>Confirmar cambio de permisos</strong><p>{pending.user.firstName} {pending.user.lastName}: {roleLabels[pending.user.roleCode]} → {roleLabels[pending.role]}.</p><p>La cuenta deberá iniciar sesión nuevamente. {pending.role === 'ADMINISTRATOR' && 'Tendrá permiso para asignar roles a otros usuarios.'}</p></div><div><button disabled={saving} onClick={() => setPending(null)}>Cancelar</button><button className="staff-primary" disabled={saving} onClick={() => void save()}>{saving ? 'Guardando…' : 'Confirmar cambio'}</button></div></div>}
        <div className="staff-policy">⚿ Cada cambio de rol invalida las sesiones anteriores de la cuenta. No puedes cambiar tu propio rol.</div>
      </section>
      <div className="staff-upcoming"><section className="staff-panel"><span className="staff-module-icon">⌂</span><h2>Revisión de propiedades</h2><p>La bandeja de validación se habilitará al implementar la gestión de propiedades.</p><span className="staff-pending-badge">Pendiente · HU-07 a HU-12</span></section><section className="staff-panel"><span className="staff-module-icon">◇</span><h2>Operación de alojamientos</h2><p>Calendario, reservas y pagos simulados se incorporarán con sus respectivos flujos.</p><span className="staff-pending-badge">Módulos en desarrollo</span></section></div>
      <footer className="staff-footer">Hosteo S.A.C. · Lima, Perú <Link to="/home">Ver portal Customer →</Link></footer>
    </main></div>
}
function Stat({ title, value, text, icon }: { title: string; value: number | null; text: string; icon: string }) {
  return <article className="staff-stat"><div><h2>{title}</h2><span aria-hidden="true">{icon}</span></div><strong>{value ?? '—'}</strong><p>{text}</p><div className="staff-stat-rule" /></article>
}
