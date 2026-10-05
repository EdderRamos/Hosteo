import { useState } from 'react'
import { CustomerHeader } from '../shared/ui/CustomerHeader'
import { Brand } from '../components/Brand'
import { CustomerCatalog } from '../features/catalog/components/CustomerCatalog'
import { PreviewDialog } from '../shared/ui/PreviewDialog'
import '../styles/customer-home.css'

export function CustomerHomePage() {
  const [notice, setNotice] = useState<string | null>(null)
  return <div className="customer-home">
    <a className="skip-link" href="#customer-content">Saltar al contenido</a>
    <CustomerHeader onNotice={setNotice} />
    <main className="customer-container customer-main" id="customer-content"><section className="customer-intro"><p>RESIDENCIAS DE COLECCIÓN · LIMA</p><h1>Estancias singulares en los distritos más vibrantes.</h1><p>Curaduría meticulosa de departamentos en Miraflores, San Isidro y Barranco.<br />Selección arquitectónica con atención presencial personalizada.</p></section><CustomerCatalog /><aside className="customer-sandbox"><span aria-hidden="true">ⓘ</span><p>Entorno de demostración Hosteo S.A.C. No se realizan reservas ni cargos reales en tarjetas ni pasarelas financieras.</p><strong>Vista de ejemplo</strong></aside></main>
    <footer className="customer-footer" id="customer-experience"><div className="customer-container"><div className="customer-footer-grid"><div><Brand /><p>Colección selecta de departamentos y residencias boutique en Miraflores, San Isidro y Barranco.</p></div><div><h2>DESTINOS</h2><p>Miraflores<br />Barranco Art District<br />San Isidro Financiero</p></div><div><h2>HOSPITALIDAD</h2><p>Conserjería Personal<br />Estándar de Calidad<br />Gestión de Activos</p></div><div><h2>CONTACTO</h2><p>Lima, Perú</p><p>Información de contacto por confirmar.</p></div></div><div className="customer-footer-bottom"><span>© {new Date().getFullYear()} Hosteo S.A.C. Todos los derechos reservados.</span><span>Miraflores <b>•</b> Barranco <b>•</b> San Isidro</span></div></div></footer>
    {notice && <PreviewDialog title={notice} onClose={() => setNotice(null)}><p>Esta sección estará disponible cuando se implemente su flujo. Por ahora estás explorando la vista de ejemplo de Hosteo.</p></PreviewDialog>}
  </div>
}
