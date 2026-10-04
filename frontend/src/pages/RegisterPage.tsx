import { useState } from 'react'
import { Link } from 'react-router'
import { Brand } from '../components/Brand'
import { RegisterForm } from '../features/auth/components/RegisterForm'
import residence from '../assets/register-residence.png'
import '../styles/register.css'

export function RegisterPage() {
  const [created, setCreated] = useState(false)
  return <main className="register-page">
    <div className="register-card">
      <section className="register-panel" aria-labelledby="register-title">
        <Brand />
        <header className="register-heading"><h1 id="register-title">{created ? 'Tu cuenta está lista' : 'Crear una cuenta'}</h1><p>{created ? 'Ya puedes iniciar sesión con el correo y la contraseña que registraste.' : 'Regístrate para reservar estancias boutique en Lima.'}</p></header>
        {created ? <div className="register-success"><p role="status">Tu cuenta de huésped se creó correctamente.</p><Link className="register-submit" to="/login">Iniciar sesión</Link></div> : <RegisterForm onSuccess={() => setCreated(true)} />}
        <footer className="register-panel-footer">{!created && <p>¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link></p>}<p className="register-security"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>Tu cuenta y tus datos, en un solo lugar.</p><Link className="register-home" to="/">Volver al inicio</Link></footer>
      </section>
      <aside className="register-editorial">
        <img src={residence} alt="Sala de una residencia con plantas y balcón en Lima" />
        <span className="register-collection"><i />Colección Residencial Lima</span>
        <div className="register-editorial-card"><p>ESTANCIAS Y GESTIÓN PREMIUM</p><blockquote>“Espacios curados para estancias memorables y administración sin fricciones en Lima.”</blockquote><div><strong>HOSTEO S.A.C.</strong><span>Barranco • Miraflores • San Isidro</span></div></div>
      </aside>
    </div>
    <p className="register-mobile-footnote">Hosteo S.A.C. • Barranco &amp; Miraflores</p>
  </main>
}
