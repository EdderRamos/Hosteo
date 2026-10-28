import { Link, useLocation } from 'react-router'
import { Brand } from '../../components/Brand'
import { logout } from '../../features/auth/session'

const iconPaths = {
  dashboard: 'M3 3h7v7H3zm11 0h7v11h-7zM3 14h7v7H3zm11 4h7v3h-7z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-14a4 4 0 0 1 0 8m6 6v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  property: 'm3 10 9-7 9 7v11H3V10Zm6 11v-8h6v8',
  calendar: 'M4 5h16v16H4V5Zm3-3v6m10-6v6M4 11h16m-12 4h2m4 0h2',
  booking: 'M7 3h10v4H7V3Zm-2 2H3v16h18V5h-2M7 12h10M7 16h7',
  payment: 'M2 5h20v14H2V5Zm0 5h20M6 15h3',
  report: 'M4 3h11l5 5v13H4V3Zm10 0v6h6M8 17v-3m4 3v-6m4 6v-4',
  building: 'M3 21V7h11v14M14 11h7v10M1 21h22M6 10h2m2 0h1m-5 4h2m2 0h1m-5 4h2m2 0h1M17 14h1m-1 4h1',
} as const
function StaffIcon({ name }: { name: keyof typeof iconPaths }) {
  return <svg className="staff-nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={iconPaths[name]} /></svg>
}
export function StaffHeader({ name, admin }: { name: string; admin: boolean }) {
  return <header className="staff-header"><Brand /><div className="staff-header-right"><span className="staff-office"><StaffIcon name="building" /> Sede Lima Centro & Sur</span><details className="staff-account"><summary><span className="staff-avatar">{name.slice(0, 1)}</span><span><strong>{name}</strong><small>{admin ? 'ADMINISTRADOR' : 'SOPORTE'}</small></span><span aria-hidden="true">⌄</span></summary><div className="staff-account-menu"><Link to="/profile">Mi perfil</Link><button onClick={logout}>Cerrar sesión</button></div></details></div></header>
}
type SidebarItem = { label: string; to: string; icon: keyof typeof iconPaths }
export function StaffSidebar({ admin }: { admin: boolean; active?: 'overview' | 'review' | 'operations' | 'support' }) {
  const { pathname, hash } = useLocation()
  const groups: { title: string; items: SidebarItem[] }[] = admin ? [
    { title: 'Administración', items: [{ label: 'Usuarios y roles', to: '/hosteo#staff-users', icon: 'users' }] },
    { title: 'Alojamientos', items: [
      { label: 'Revisión de propiedades', to: '/hosteo/properties/pending', icon: 'property' },
      { label: 'Disponibilidad e indicadores', to: '/hosteo/operations', icon: 'calendar' },
    ] },
    { title: 'Reservas y pagos', items: [
      { label: 'Reservas', to: '/hosteo/bookings', icon: 'booking' },
      { label: 'Pagos simulados', to: '/hosteo/payments', icon: 'payment' },
    ] },
    { title: 'Reportes', items: [{ label: 'Reportes de reservas', to: '/hosteo/reports/bookings', icon: 'report' }] },
  ] : [
    { title: 'Cuentas', items: [{ label: 'Consultar cuentas', to: '/hosteo#staff-users', icon: 'users' }] },
    { title: 'Atención al usuario', items: [
      { label: 'Usuarios y propiedades', to: '/support/users', icon: 'users' },
      { label: 'Reservas y pagos', to: '/support/bookings', icon: 'booking' },
    ] },
    { title: 'Operación', items: [{ label: 'Información operativa', to: '/support/operations', icon: 'dashboard' }] },
  ]
  function item({ label, to, icon }: SidebarItem) {
    const selected = to.includes('#') ? pathname === '/hosteo' && hash === '#staff-users'
      : to === '/hosteo' ? pathname === '/hosteo' && hash !== '#staff-users'
      : pathname === to || pathname.startsWith(`${to}/`) || (to === '/hosteo/operations' && /^\/hosteo\/properties\/[^/]+\/calendar$/.test(pathname))
    return <Link to={to} className={selected ? 'staff-nav-active' : undefined} aria-current={selected ? 'page' : undefined}><StaffIcon name={icon} /><span>{label}</span>{selected && <span className="staff-nav-current" aria-hidden="true" />}</Link>
  }
  return <aside className="staff-sidebar"><p>PORTAL HOSTEO</p><nav className="staff-menu" aria-label={admin ? 'Administración de Hosteo' : 'Consultas de soporte'}>
    <div className="staff-menu-overview">{item({ label: 'Panel general', to: '/hosteo', icon: 'dashboard' })}</div>
    {groups.map(group => <section className="staff-menu-group" key={group.title} aria-label={group.title}><h2>{group.title}</h2><ul>{group.items.map(link => <li key={link.to}>{item(link)}</li>)}</ul></section>)}
  </nav><div className="staff-sidebar-bottom">Portal de personal <span>Hosteo</span></div></aside>
}
