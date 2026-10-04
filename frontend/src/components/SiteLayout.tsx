import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router'
import { Brand } from './Brand'
import { logout, useSession } from '../features/auth/session'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Alojamientos', href: '#alojamientos' },
  { label: 'Destinos', href: '#destinos' },
  { label: 'Nosotros', href: '#nosotros' },
]

function SiteHeader() {
  const session = useSession()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <div className="site-container site-header__inner">
        <Brand />

        <nav className="desktop-navigation" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          {session ? <button className="outline-button outline-button--small" type="button" onClick={logout}>Cerrar sesión</button> : <Link className="outline-button outline-button--small" to="/login">
            Iniciar sesión
          </Link>}
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M8 12h12M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" className="mobile-navigation" aria-label="Navegación móvil">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Brand light />
            <p>Estadías seleccionadas en Lima, Perú.</p>
          </div>

          <div className="footer-column">
            <h2>Explorar</h2>
            <a href="#alojamientos">Alojamientos</a>
            <a href="#destinos">Miraflores</a>
            <a href="#destinos">Barranco</a>
            <a href="#destinos">San Isidro</a>
          </div>

          <div className="footer-column">
            <h2>Cuenta</h2>
            <Link to="/login">Iniciar sesión</Link>
            <Link to="/register">Crear cuenta</Link>
          </div>

          <div className="footer-column">
            <h2>Hosteo</h2>
            <a href="#nosotros">Nosotros</a>
            <a href="mailto:hola@hosteo.pe">Contacto</a>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Hosteo. Todos los derechos reservados.</span>
          <div>
            <span>Privacidad</span>
            <span>Términos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function SiteLayout() {
  return (
    <div className="site-layout">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <SiteHeader />
      <main id="main-content">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
