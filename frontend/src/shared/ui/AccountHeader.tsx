import { Link } from 'react-router'
import { Brand } from '../../components/Brand'
import { logout, useSession } from '../../features/auth/session'
import { homePath, roleLabels } from '../auth/roles'

export function AccountHeader() {
  const session = useSession()
  return <header className="guest-header"><div className="guest-container guest-header-inner"><Brand /><nav aria-label="Navegación de cuenta"><Link to={homePath(session?.user.roleCode)}>Inicio</Link></nav><div className="guest-account-actions">{session ? <details className="guest-account"><summary><span className="guest-avatar" aria-hidden="true">{session.user.firstName[0]}{session.user.lastName[0]}</span><span><strong>{session.user.firstName} {session.user.lastName}</strong><small>{roleLabels[session.user.roleCode]}</small></span><span aria-hidden="true">⌄</span></summary><div><Link to="/profile">Perfil personal</Link><Link to={homePath(session.user.roleCode)}>Mi portal</Link><button type="button" onClick={logout}>Cerrar sesión</button></div></details> : <Link className="guest-outline" to="/login">Iniciar sesión</Link>}</div></div></header>
}
