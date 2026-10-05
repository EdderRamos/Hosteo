import { Link } from 'react-router'
import { Brand } from '../../components/Brand'
import { logout } from '../../features/auth/session'

export function StaffHeader({ name, admin }: { name: string; admin: boolean }) {
  return <header className="staff-header"><Brand /><div className="staff-header-right"><span className="staff-office">▦ Sede Lima Centro & Sur</span><details className="staff-account"><summary><span className="staff-avatar">{name.slice(0, 1)}</span><span><strong>{name}</strong><small>{admin ? 'ADMINISTRADOR' : 'SOPORTE'}</small></span><span aria-hidden="true">⌄</span></summary><div className="staff-account-menu"><Link to="/profile">Mi perfil</Link><button onClick={logout}>Cerrar sesión</button></div></details></div></header>
}
export function StaffSidebar({ admin, active = 'overview' }: { admin: boolean; active?: 'overview' | 'review' | 'operations' }) {
  return <aside className="staff-sidebar"><p>GESTIÓN LIMA</p><a className={active === 'overview' ? 'staff-nav-active' : undefined} href={active === 'overview' ? '#staff-overview' : '/hosteo#staff-overview'}>▣ Panel General</a><a href={active === 'overview' ? '#staff-users' : '/hosteo#staff-users'}>♙ Usuarios y Roles</a>{admin && <Link className={active === 'review' ? 'staff-nav-active' : undefined} to="/hosteo/properties/pending">⌂ Revisión de propiedades</Link>}{admin && <><Link className={active === 'operations' ? 'staff-nav-active' : undefined} to="/hosteo/operations">◇ Disponibilidad e indicadores</Link><Link to="/hosteo/bookings">▦ Reservas</Link><Link to="/hosteo/payments">Pagos simulados</Link></>}{['Unidades Lima', 'Tarifas de temporada', 'Check-in / Recepción', 'Liquidaciones'].map(label => <span className="staff-nav-pending" key={label}>{label}<small>Pendiente</small></span>)}<div className="staff-sidebar-bottom">Portal de personal <span>Hosteo</span></div></aside>
}
