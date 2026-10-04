import { Link } from 'react-router'
import architecture from '../assets/login-architecture.png'
import { LoginForm } from '../features/auth/components/LoginForm'
import { logout, useSession } from '../features/auth/session'
import '../styles/login.css'

export function LoginPage() {
  const session = useSession()
  return <div className="login-page">
    <header className="login-header"><Link to="/" aria-label="Hosteo, ir al inicio"><span>Hosteo</span><small>S.A.C.</small></Link></header>
    <main className="login-main">
      <div className="login-card">
        <aside className="login-editorial">
          <img className="login-editorial__photo" src={architecture} alt="Sala con ventanales y vista a la ciudad de Lima" />
          <div className="login-editorial__content">
            <div><div className="login-badges"><span><i /> HOSTEO BOUTIQUE S.A.C.</span><span>Lima • PE</span></div><p>Curaduría de estancias de autor y administración patrimonial en las zonas residenciales más codiciadas de la capital.</p></div>
            <blockquote>“Hospitalidad calculada con precisión arquitectónica.”</blockquote>
            <div className="login-districts">MIRAFLORES <b>•</b> SAN ISIDRO <b>•</b> BARRANCO<small>Estancias seleccionadas en Lima</small></div>
          </div>
        </aside>
        <section className="login-panel" aria-labelledby="login-title">
          <header className="login-heading"><p>ACCESO A LA PLATAFORMA</p><h1 id="login-title">{session ? `Bienvenido, ${session.user.firstName}` : 'Bienvenido de nuevo'}</h1><p>{session ? 'Tu sesión está activa. Ya puedes continuar en Hosteo.' : 'Ingresa tus credenciales para administrar tus reservas activas o monitorear el rendimiento de tus residencias.'}</p></header>
          {session ? <div className="login-success"><p role="status">Has iniciado sesión correctamente.</p><Link className="login-submit" to="/">Continuar al inicio</Link><button className="login-secondary" onClick={logout}>Cerrar sesión</button></div> : <><LoginForm /><div className="login-divider"><span>NUEVAS MEMBRESÍAS</span></div><div className="login-memberships"><p>¿Aún no tienes una cuenta registrada en la plataforma?</p><Link className="login-secondary" to="/register">Crear cuenta en Hosteo</Link></div></>}
          <p className="login-security"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg> Tus credenciales se verifican de forma segura.<br />La sesión está sujeta a su tiempo de expiración.</p>
        </section>
      </div>
    </main>
    <footer className="login-footer"><span>© {new Date().getFullYear()} Hosteo S.A.C. <b>•</b> San Isidro, Lima - Perú</span><Link to="/">Volver al inicio</Link></footer>
  </div>
}
