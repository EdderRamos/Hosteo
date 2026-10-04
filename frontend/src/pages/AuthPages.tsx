import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import propertySanIsidro from '../assets/property-san-isidro.jpg'
import { Brand } from '../components/Brand'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emailError(email: string) {
  if (!email.trim()) return 'Ingresa tu correo electrónico'
  if (!EMAIL_PATTERN.test(email.trim())) return 'Ingresa un correo electrónico válido'
  return ''
}

interface AuthFrameProps {
  image: string
  imageAlt: string
  tagline: string
  children: ReactNode
}

function AuthFrame({ image, imageAlt, tagline, children }: AuthFrameProps) {
  return (
    <main className="auth-layout">
      <aside className="auth-photo">
        <img src={image} alt={imageAlt} />
        <div className="auth-photo__overlay" aria-hidden="true" />
        <div className="auth-photo__brand"><Brand light /></div>
        <blockquote>{tagline}</blockquote>
      </aside>
      <section className="auth-panel">
        <div className="auth-panel__mobile-brand"><Brand /></div>
        <div className="auth-panel__content">{children}</div>
        <Link className="auth-panel__home-link" to="/">Volver al inicio</Link>
      </section>
    </main>
  )
}

function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="auth-heading">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  )
}

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password'
  placeholder?: string
  autoComplete?: string
  error?: string
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return crossed ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.5 10.5 0 0 1 12 4c5.3 0 9.2 4.6 10 7.1.2.6.2 1.2 0 1.8a11.6 11.6 0 0 1-2.1 3.6M6.2 6.2A12 12 0 0 0 2 11.1c-.2.6-.2 1.2 0 1.8C2.8 15.4 6.7 20 12 20c1.4 0 2.7-.3 3.8-.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 11.1C2.8 8.6 6.7 4 12 4s9.2 4.6 10 7.1c.2.6.2 1.2 0 1.8-.8 2.5-4.7 7.1-10 7.1S2.8 15.4 2 12.9a2.8 2.8 0 0 1 0-1.8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder, autoComplete, error }: FormFieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [passwordVisible, setPasswordVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <div className={`form-field__control${isPassword ? ' form-field__control--password' : ''}`}>
        <input
          id={inputId}
          type={isPassword && passwordVisible ? 'text' : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {isPassword && (
          <button
            className="password-toggle"
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <EyeIcon crossed={passwordVisible} />
          </button>
        )}
      </div>
      {error && <p className="field-error" id={errorId} role="alert"><span>!</span>{error}</p>}
    </div>
  )
}

function AuthSubmit({ children }: { children: ReactNode }) {
  return <button className="auth-submit" type="submit">{children}</button>
}

export function ForgotPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextError = emailError(email)
    setError(nextError)
    if (!nextError) setSent(true)
  }

  return (
    <AuthFrame
      image={propertySanIsidro}
      imageAlt="Habitación luminosa de un alojamiento"
      tagline="Estamos aquí para ayudarte a recuperar el acceso."
    >
      {sent ? (
        <div className="recovery-success" aria-live="polite">
          <span className="recovery-success__icon" aria-hidden="true">✓</span>
          <AuthHeading title="Revisa tu correo" description={`Si existe una cuenta asociada a ${email.trim()}, recibirás las instrucciones en unos minutos.`} />
          <p>Revisa también las carpetas de spam o promociones.</p>
          <button className="auth-submit" type="button" onClick={() => setSent(false)}>Intentar nuevamente</button>
        </div>
      ) : (
        <>
          <AuthHeading title="Recupera tu contraseña" description="Ingresa el correo de tu cuenta y te enviaremos instrucciones para recuperar el acceso." />
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-form__fields">
              <FormField
                label="Correo electrónico"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(value) => {
                  setEmail(value)
                  setError('')
                }}
                error={error}
                autoComplete="email"
              />
            </div>
            <AuthSubmit>Enviar instrucciones</AuthSubmit>
          </form>
        </>
      )}
      <p className="auth-switch"><Link to="/login">← Volver a iniciar sesión</Link></p>
    </AuthFrame>
  )
}
