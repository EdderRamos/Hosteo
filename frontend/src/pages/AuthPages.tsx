import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import propertyBarranco from '../assets/property-barranco.jpg'
import propertyMiraflores from '../assets/property-miraflores.jpg'
import propertySanIsidro from '../assets/property-san-isidro.jpg'
import { Brand } from '../components/Brand'

type FormErrors = Record<string, string>

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

function FormStatus({ children }: { children: string }) {
  return children ? <p className="form-status" role="status">✓ {children}</p> : null
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      email: emailError(email),
      password: password ? '' : 'Ingresa tu contraseña',
    }
    const visibleErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message))
    setErrors(visibleErrors)
    setStatus(Object.keys(visibleErrors).length ? '' : 'Datos verificados correctamente.')
  }

  return (
    <AuthFrame
      image={propertyMiraflores}
      imageAlt="Sala de un alojamiento contemporáneo"
      tagline="Tu próximo lugar favorito te está esperando."
    >
      <AuthHeading title="Bienvenido de nuevo" description="Continúa donde lo dejaste y gestiona tus reservas." />
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__fields">
          <FormField
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(value) => {
              setEmail(value)
              setErrors((current) => ({ ...current, email: '' }))
              setStatus('')
            }}
            error={errors.email}
            autoComplete="email"
          />
          <FormField
            label="Contraseña"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(value) => {
              setPassword(value)
              setErrors((current) => ({ ...current, password: '' }))
              setStatus('')
            }}
            error={errors.password}
            autoComplete="current-password"
          />
        </div>
        <div className="auth-form__options">
          <label className="checkbox-field">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            <span>Recordarme</span>
          </label>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>
        <FormStatus>{status}</FormStatus>
        <AuthSubmit>Iniciar sesión</AuthSubmit>
      </form>
      <p className="auth-switch">¿Aún no tienes una cuenta? <Link to="/register">Crear cuenta</Link></p>
    </AuthFrame>
  )
}

export function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState('')

  function updateField(field: string, value: string, setter: (nextValue: string) => void) {
    setter(value)
    setErrors((current) => ({ ...current, [field]: '' }))
    setStatus('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = {
      name: name.trim() ? '' : 'Ingresa tu nombre completo',
      email: emailError(email),
      password: !password ? 'Crea una contraseña' : password.length < 8 ? 'Usa al menos 8 caracteres' : '',
      confirmation: !confirmation ? 'Confirma tu contraseña' : confirmation !== password ? 'Las contraseñas no coinciden' : '',
      terms: terms ? '' : 'Debes aceptar los términos para continuar',
    }
    const visibleErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message))
    setErrors(visibleErrors)
    setStatus(Object.keys(visibleErrors).length ? '' : 'Datos verificados correctamente.')
  }

  return (
    <AuthFrame
      image={propertyBarranco}
      imageAlt="Dormitorio cálido de un alojamiento"
      tagline="Alojamientos cuidados para viajeros que aprecian los detalles."
    >
      <AuthHeading title="Crea tu cuenta" description="Únete a Hosteo y organiza tu próxima estadía en Lima." />
      <form className="auth-form auth-form--register" onSubmit={handleSubmit} noValidate>
        <div className="auth-form__fields auth-form__fields--compact">
          <FormField label="Nombre completo" placeholder="María García" value={name} onChange={(value) => updateField('name', value, setName)} error={errors.name} autoComplete="name" />
          <FormField label="Correo electrónico" type="email" placeholder="tu@correo.com" value={email} onChange={(value) => updateField('email', value, setEmail)} error={errors.email} autoComplete="email" />
          <FormField label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(value) => updateField('password', value, setPassword)} error={errors.password} autoComplete="new-password" />
          <FormField label="Confirmar contraseña" type="password" placeholder="Repite tu contraseña" value={confirmation} onChange={(value) => updateField('confirmation', value, setConfirmation)} error={errors.confirmation} autoComplete="new-password" />
        </div>
        <div className="terms-field">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => {
                setTerms(event.target.checked)
                setErrors((current) => ({ ...current, terms: '' }))
                setStatus('')
              }}
              aria-invalid={Boolean(errors.terms)}
              aria-describedby={errors.terms ? 'terms-error' : undefined}
            />
            <span>Acepto los términos de servicio y la política de privacidad.</span>
          </label>
          {errors.terms && <p className="field-error field-error--terms" id="terms-error" role="alert"><span>!</span>{errors.terms}</p>}
        </div>
        <FormStatus>{status}</FormStatus>
        <AuthSubmit>Crear cuenta</AuthSubmit>
      </form>
      <p className="auth-switch">¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link></p>
    </AuthFrame>
  )
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
