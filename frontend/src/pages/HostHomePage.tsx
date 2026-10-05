import { Link, Navigate } from 'react-router'
import { useSession } from '../features/auth/session'
import { homePath } from '../shared/auth/roles'
import { AccountHeader } from '../shared/ui/AccountHeader'
import '../styles/guest-home.css'
import '../styles/profile.css'
import '../styles/properties.css'

export function HostHomePage() {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== 'HOST') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <div className="guest-home"><AccountHeader /><main className="guest-container profile-main"><p className="profile-breadcrumb">Portal del anfitrión</p><section className="profile-panel"><h1>Hola, {session.user.firstName}</h1><p>Este es tu espacio como anfitrión. Ya puedes registrar la información principal de tu alojamiento. Calendario, reservas y publicación se habilitarán con sus respectivos flujos.</p><Link to="/profile">Editar mi perfil</Link></section><div className="staff-upcoming"><section className="profile-panel"><h2>Registrar una propiedad</h2><p>Completa la información principal y guarda tu alojamiento como borrador.</p><Link className="property-primary" to="/host/properties/new">Registrar propiedad</Link></section><section className="profile-panel"><h2>Calendario y reservas</h2><p>Disponibilidad, bloqueos y reservas de tus propiedades · HU-16, HU-17 y HU-24</p><span className="staff-pending-badge">Pendiente de implementación</span></section></div></main></div>
}
