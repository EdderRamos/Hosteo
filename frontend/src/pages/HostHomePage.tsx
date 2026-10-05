import { Link, Navigate } from 'react-router'
import { useSession } from '../features/auth/session'
import { homePath } from '../shared/auth/roles'
import { AccountHeader } from '../shared/ui/AccountHeader'
import '../styles/guest-home.css'
import '../styles/profile.css'

export function HostHomePage() {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== 'HOST') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <div className="guest-home"><AccountHeader /><main className="guest-container profile-main"><p className="profile-breadcrumb">Portal del anfitrión</p><section className="profile-panel"><h1>Hola, {session.user.firstName}</h1><p>Este es tu espacio como anfitrión. La gestión de tus propiedades, calendario y reservas se habilitará al implementar sus respectivas historias de usuario.</p><Link to="/profile">Editar mi perfil</Link></section><div className="staff-upcoming">{[{ title: 'Mis propiedades', text: 'Registro, edición y envío a validación · HU-07 a HU-10' }, { title: 'Calendario y reservas', text: 'Disponibilidad, bloqueos y reservas de tus propiedades · HU-16, HU-17 y HU-24' }].map(module => <section className="profile-panel" key={module.title}><h2>{module.title}</h2><p>{module.text}</p><span className="staff-pending-badge">Pendiente de implementación</span></section>)}</div></main></div>
}
