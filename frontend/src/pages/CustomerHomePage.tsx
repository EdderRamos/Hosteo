import { useState } from 'react'
import { Link } from 'react-router'
import { Brand } from '../components/Brand'
import { CustomerCatalog } from '../features/catalog/components/CustomerCatalog'
import { PreviewDialog } from '../shared/ui/PreviewDialog'
import '../styles/customer-home.css'

export function CustomerHomePage() {
  const [notice, setNotice] = useState<string | null>(null)
  return <div className="customer-home">
    <a className="skip-link" href="#customer-content">Saltar al contenido</a>
    <header className="customer-header"><div className="customer-container customer-header-inner"><Brand /><nav aria-label="Navegación principal"><a className="is-active" href="#customer-content">Propiedades</a><a href="#customer-experience">Experiencia</a><button type="button" onClick={() => setNotice('Para propietarios')}>Para Propietarios</button></nav><div className="customer-account-actions"><button className="customer-outline" type="button" onClick={() => setNotice('Mis reservas')}>Mis Reservas</button><details className="customer-account"><summary><span className="customer-avatar" aria-hidden="true">CV</span><span><strong>Camila Vega</strong><small>CLIENTE · DEMO</small></span><span aria-hidden="true">⌄</span></summary><div><button type="button" onClick={() => setNotice('Perfil personal')}>Perfil personal</button><Link to="/login">Iniciar sesión</Link></div></details></div></div></header>
    <main className="customer-container customer-main" id="customer-content"><section className="customer-intro"><p>RESIDENCIAS DE COLECCIÓN · LIMA</p><h1>Estancias singulares en los distritos más vibrantes.</h1><p>Curaduría meticulosa de departamentos en Miraflores, San Isidro y Barranco.<br />Selección arquitectónica con atención presencial personalizada.</p></section><CustomerCatalog /><aside className="customer-sandbox"><span aria-hidden="true">ⓘ</span><p>Entorno de demostración Hosteo S.A.C. No se realizan reservas ni cargos reales en tarjetas ni pasarelas financieras.</p><strong>Vista de ejemplo</strong></aside></main>
    <footer className="customer-footer" id="customer-experience"><div className="customer-container"><div className="customer-footer-grid"><div><Brand /><p>Colección selecta de departamentos y residencias boutique en Miraflores, San Isidro y Barranco.</p></div><div><h2>DESTINOS</h2><p>Miraflores<br />Barranco Art District<br />San Isidro Financiero</p></div><div><h2>HOSPITALIDAD</h2><p>Conserjería Personal<br />Estándar de Calidad<br />Gestión de Activos</p></div><div><h2>CONTACTO</h2><p>Lima, Perú</p><p>Información de contacto por confirmar.</p></div></div><div className="customer-footer-bottom"><span>© {new Date().getFullYear()} Hosteo S.A.C. Todos los derechos reservados.</span><span>Miraflores <b>•</b> Barranco <b>•</b> San Isidro</span></div></div></footer>
    {notice && <PreviewDialog title={notice} onClose={() => setNotice(null)}><p>Esta sección estará disponible cuando se implemente su flujo. Por ahora estás explorando la vista de ejemplo de Hosteo.</p></PreviewDialog>}
  </div>
}
