import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { login } from '../api/auth'
import { loginSchema, type LoginValues } from '../schemas/login'
import { saveSession } from '../session'

export function LoginForm() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<LoginValues>({ defaultValues: { email: '', password: '', remember: false } })

  async function submit(values: LoginValues) {
    clearErrors()
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      const reported = new Set<string>()
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if ((field === 'email' || field === 'password') && !reported.has(field)) {
          setError(field, { message: issue.message }, { shouldFocus: reported.size === 0 })
          reported.add(field)
        }
      }
      return
    }
    try {
      const response = await login(parsed.data)
      saveSession(response.accessToken, response.user, values.remember)
      navigate('/home', { replace: true })
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'No pudimos iniciar sesión. Intenta nuevamente.' })
    }
  }

  return <form className="login-form" onSubmit={handleSubmit(submit)} noValidate aria-busy={isSubmitting}>
    <div className="login-field">
      <label htmlFor="login-email">Correo electrónico</label>
      <div className="login-input"><span aria-hidden="true">@</span><input id="login-email" type="email" autoComplete="username" placeholder="tu@correo.com" {...register('email', { onChange: () => { clearErrors('email'); clearErrors('root') } })} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} disabled={isSubmitting} /></div>
      {errors.email && <p id="login-email-error" className="login-error" role="alert">{errors.email.message}</p>}
    </div>
    <div className="login-field">
      <div className="login-label"><label htmlFor="login-password">Contraseña</label><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></div>
      <div className="login-input"><svg aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg><input id="login-password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña" {...register('password', { onChange: () => { clearErrors('password'); clearErrors('root') } })} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : undefined} disabled={isSubmitting} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}</svg></button></div>
      {errors.password && <p id="login-password-error" className="login-error" role="alert">{errors.password.message}</p>}
    </div>
    <label className="login-remember"><input type="checkbox" {...register('remember')} disabled={isSubmitting} />Mantener mi sesión activa en este equipo</label>
    {errors.root && <p className="login-error login-error--server" role="alert">{errors.root.message}</p>}
    <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión en Hosteo'}</button>
  </form>
}
