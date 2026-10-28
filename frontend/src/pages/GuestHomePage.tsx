import { Navigate } from 'react-router'
import { useSession } from '../features/auth/session'
import { homePath } from '../shared/auth/roles'
import { useState } from 'react'
import { GuestHeader } from '../shared/ui/GuestHeader'
import { Brand } from '../components/Brand'
import { GuestCatalog } from '../features/catalog/components/GuestCatalog'
import { PreviewDialog } from '../shared/ui/PreviewDialog'
import '../styles/guest-home.css'
import '../styles/operations.css'
import '../styles/guest-refresh.css'

export function GuestHomePage() {
  const [notice, setNotice] = useState<string | null>(null)
  const session = useSession()
  if (session && session.user.roleCode !== 'GUEST') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <div className="guest-home">
    <a className="skip-link" href="#guest-content">Saltar al contenido</a>
    <GuestHeader onNotice={setNotice} />
    <main className="guest-container guest-main" id="guest-content"><section className="guest-intro"><p>HOSTEO · ESTADÍAS GLOBAL</p><h1>Tu próxima estadía,<br /><em>en un lugar especial.</em></h1><p>Descubre alojamientos y encuentra el espacio para tu próximo viaje. Consulta las fechas disponibles antes de reservar.</p></section><GuestCatalog /><aside className="guest-sandbox"><span aria-hidden="true">ⓘ</span><p>Las reservas se registran en la plataforma. Los pagos son exclusivamente simulados: no se realizan cargos bancarios.</p><strong>Pagos simulados</strong></aside></main>
    <footer className="guest-footer" id="guest-experience"><div className="guest-container"><div className="guest-footer-grid"><div><Brand /><p>Encuentra departamentos y residencias para tu próxima estadía.</p></div><div><h2>ALOJAMIENTOS</h2><p>Departamentos<br />Casas<br />Habitaciones</p></div><div><h2>TU ESTADÍA</h2><p>Alojamientos publicados<br />Consulta de disponibilidad<br />Reservas en la plataforma</p></div><div><h2>CONTACTO</h2><p>Lima, Perú</p><p>Información de contacto por confirmar.</p></div></div><div className="guest-footer-bottom"><span>© {new Date().getFullYear()} Hosteo S.A.C. Todos los derechos reservados.</span><span>Hosteo · Estadías global</span></div></div></footer>
    {notice && <PreviewDialog title={`${notice}: próximamente`} onClose={() => setNotice(null)}><p>Esta sección todavía no está disponible. Mientras tanto, puedes explorar los alojamientos publicados o consultar tus reservas.</p></PreviewDialog>}
  </div>
}
