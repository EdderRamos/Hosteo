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

export function GuestHomePage() {
  const [notice, setNotice] = useState<string | null>(null)
  const session = useSession()
  if (session && session.user.roleCode !== 'GUEST') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <div className="guest-home">
    <a className="skip-link" href="#guest-content">Saltar al contenido</a>
    <GuestHeader onNotice={setNotice} />
    <main className="guest-container guest-main" id="guest-content"><section className="guest-intro"><p>RESIDENCIAS DE COLECCIÓN · LIMA</p><h1>Estancias singulares en los distritos más vibrantes.</h1><p>Consulta alojamientos aprobados y verifica sus fechas disponibles antes de reservar.</p></section><GuestCatalog /><aside className="guest-sandbox"><span aria-hidden="true">ⓘ</span><p>Las reservas se registran en la plataforma. Los pagos son exclusivamente simulados: no se realizan cargos bancarios.</p><strong>Pagos simulados</strong></aside></main>
    <footer className="guest-footer" id="guest-experience"><div className="guest-container"><div className="guest-footer-grid"><div><Brand /><p>Colección selecta de departamentos y residencias boutique en Miraflores, San Isidro y Barranco.</p></div><div><h2>DESTINOS</h2><p>Miraflores<br />Barranco Art District<br />San Isidro Financiero</p></div><div><h2>HOSPITALIDAD</h2><p>Conserjería Personal<br />Estándar de Calidad<br />Gestión de Activos</p></div><div><h2>CONTACTO</h2><p>Lima, Perú</p><p>Información de contacto por confirmar.</p></div></div><div className="guest-footer-bottom"><span>© {new Date().getFullYear()} Hosteo S.A.C. Todos los derechos reservados.</span><span>Miraflores <b>•</b> Barranco <b>•</b> San Isidro</span></div></div></footer>
    {notice && <PreviewDialog title={notice} onClose={() => setNotice(null)}><p>Esta sección todavía no está disponible. Puedes consultar alojamientos publicados y tus reservas desde la navegación.</p></PreviewDialog>}
  </div>
}
