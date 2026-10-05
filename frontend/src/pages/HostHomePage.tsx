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
  return <div className="guest-home"><AccountHeader /><main className="guest-container profile-main"><p className="profile-breadcrumb">Portal del anfitrión</p><section className="profile-panel"><h1>Hola, {session.user.firstName}</h1><p>Este es tu espacio como anfitrión. Puedes registrar tus alojamientos y consultar el estado de tus propiedades. Consulta tus reservas, gestiona bloqueos y revisa el resumen de tus alojamientos.</p><Link to="/profile">Editar mi perfil</Link></section><div className="staff-upcoming"><section className="profile-panel"><h2>Mis propiedades</h2><p>Consulta la información y el estado actual de tus alojamientos registrados.</p><Link className="property-primary" to="/host/properties">Ver mis propiedades</Link></section><section className="profile-panel"><h2>Registrar una propiedad</h2><p>Completa la información principal y guarda tu alojamiento como borrador.</p><Link className="property-primary" to="/host/properties/new">Registrar propiedad</Link></section><section className="profile-panel"><h2>Calendario y reservas</h2><p>Gestiona las fechas disponibles y conoce las estadías de tus alojamientos.</p><p><Link to="/host/operations">Resumen y disponibilidad →</Link></p><Link to="/host/bookings">Consultar reservas →</Link></section></div></main></div>
}
