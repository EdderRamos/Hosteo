import { Link } from 'react-router'
import { Brand } from '../../components/Brand'
import { logout, useSession } from '../../features/auth/session'

export function GuestHeader({ onNotice }: { onNotice: (title: string) => void }) {
  const session = useSession()
  const name = session ? `${session.user.firstName} ${session.user.lastName}` : ''
  return <header className="guest-header"><div className="guest-container guest-header-inner"><Brand /><nav aria-label="Navegación principal"><Link to="/guest">Propiedades</Link><Link to="/guest#guest-experience">Experiencia</Link><button type="button" onClick={() => onNotice('Para propietarios')}>Para Propietarios</button></nav><div className="guest-account-actions"><Link className="guest-outline" to="/guest/bookings">Mis Reservas</Link>{session ? <details className="guest-account"><summary><span className="guest-avatar" aria-hidden="true">{session.user.firstName[0]}{session.user.lastName[0]}</span><span><strong>{name}</strong><small>HUÉSPED</small></span><span aria-hidden="true">⌄</span></summary><div><Link to="/profile">Perfil personal</Link><button type="button" onClick={logout}>Cerrar sesión</button></div></details> : <Link className="guest-outline" to="/login">Iniciar sesión</Link>}</div></div></header>
}
