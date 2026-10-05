import { Link } from 'react-router'
import { Brand } from '../../components/Brand'
import { logout, useSession } from '../../features/auth/session'

export function CustomerHeader({ onNotice }: { onNotice: (title: string) => void }) {
  const session = useSession()
  const name = session ? `${session.user.firstName} ${session.user.lastName}` : ''
  return <header className="customer-header"><div className="customer-container customer-header-inner"><Brand /><nav aria-label="Navegación principal"><Link to="/home">Propiedades</Link><Link to="/home#customer-experience">Experiencia</Link><button type="button" onClick={() => onNotice('Para propietarios')}>Para Propietarios</button></nav><div className="customer-account-actions"><button className="customer-outline" type="button" onClick={() => onNotice('Mis reservas')}>Mis Reservas</button>{session ? <details className="customer-account"><summary><span className="customer-avatar" aria-hidden="true">{session.user.firstName[0]}{session.user.lastName[0]}</span><span><strong>{name}</strong><small>MI CUENTA</small></span><span aria-hidden="true">⌄</span></summary><div>{['ADMINISTRATOR', 'SUPPORT'].includes(session.user.roleCode) ? <Link to="/hosteo">Portal Hosteo</Link> : <Link to="/profile">Perfil personal</Link>}<button type="button" onClick={logout}>Cerrar sesión</button></div></details> : <Link className="customer-outline" to="/login">Iniciar sesión</Link>}</div></div></header>
}
