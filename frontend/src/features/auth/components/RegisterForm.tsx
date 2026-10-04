import { useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { registerGuest } from '../api/auth'
import { passwordRequirements, registrationFields, registerSchema, type RegisterValues } from '../schemas/register'
import { ApiError } from '../../../shared/api/http'
import { PasswordInput } from '../../../shared/ui/PasswordInput'

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const submitting = useRef(false)
  const { register, handleSubmit, setError, clearErrors, control, resetField, formState: { errors, isSubmitting } } = useForm<RegisterValues>({
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmation: '' },
  })
  const password = useWatch({ control, name: 'password' })

  async function submit(values: RegisterValues) {
    if (submitting.current) return
    clearErrors()
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) {
      const reported = new Set<string>()
      for (const issue of parsed.error.issues) {
        const field = registrationFields.find(field => field === issue.path[0])
        if (field && !reported.has(field)) { setError(field, { message: issue.message }, { shouldFocus: reported.size === 0 }); reported.add(field) }
      }
      return
    }
    submitting.current = true
    try {
      await registerGuest(parsed.data)
      resetField('password'); resetField('confirmation')
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_EXISTS') setError('email', { message: 'Este correo ya está registrado. Inicia sesión o utiliza otro.' }, { shouldFocus: true })
      else {
        if (error instanceof ApiError) for (const field of registrationFields) {
          if (field in error.fieldErrors) setError(field, { message: 'Revisa este dato. El servidor no lo aceptó.' })
        }
        setError('root', { message: error instanceof Error ? error.message : 'No pudimos crear tu cuenta. Intenta nuevamente.' })
      }
    } finally { submitting.current = false }
  }

  function options(field: keyof RegisterValues) {
    return { onChange: () => { clearErrors(field); clearErrors('root'); if (field === 'password') clearErrors('confirmation') } }
  }
  function error(field: keyof RegisterValues) {
    return errors[field] ? <p className="register-error" id={`register-${field}-error`} role="alert">{errors[field]?.message}</p> : null
  }
  function accessibility(field: keyof RegisterValues) {
    return { 'aria-invalid': Boolean(errors[field]), 'aria-describedby': errors[field] ? `register-${field}-error` : undefined }
  }

  return <form className="register-form" onSubmit={event => { void handleSubmit(submit)(event) }} noValidate aria-busy={isSubmitting}>
    <div className="register-row">
      {([{ name: 'firstName', label: 'Nombres', placeholder: 'Ej. Camila', complete: 'given-name' }, { name: 'lastName', label: 'Apellidos', placeholder: 'Ej. Salazar', complete: 'family-name' }] as const).map(field => <div className="register-field" key={field.name}>
        <label htmlFor={`register-${field.name}`}>{field.label}<span>Obligatorio</span></label>
        <input id={`register-${field.name}`} placeholder={field.placeholder} autoComplete={field.complete} {...register(field.name, options(field.name))} {...accessibility(field.name)} disabled={isSubmitting} />{error(field.name)}
      </div>)}
    </div>
    <div className="register-field"><label htmlFor="register-email">Correo electrónico<span>Obligatorio</span></label><input id="register-email" type="email" autoComplete="email" placeholder="ejemplo@correo.com" {...register('email', options('email'))} {...accessibility('email')} disabled={isSubmitting} />{error('email')}</div>
    <div className="register-field"><label htmlFor="register-password">Contraseña<span>Segura</span></label><PasswordInput id="register-password" autoComplete="new-password" placeholder="Crea una contraseña" {...register('password', options('password'))} {...accessibility('password')} aria-describedby={[errors.password ? 'register-password-error' : '', 'register-password-requirements'].filter(Boolean).join(' ')} disabled={isSubmitting} />{error('password')}<ul className="register-password-requirements" id="register-password-requirements">{passwordRequirements.map(rule => <li key={rule.label} className={rule.check(password) ? 'is-met' : ''}><span aria-hidden="true">{rule.check(password) ? '✓' : '○'}</span>{rule.label}<span className="visually-hidden">{rule.check(password) ? ', cumplido' : ', pendiente'}</span></li>)}</ul></div>
    <div className="register-field"><label htmlFor="register-confirmation">Confirmar contraseña<span>Obligatorio</span></label><PasswordInput id="register-confirmation" autoComplete="new-password" placeholder="Repite tu contraseña" {...register('confirmation', options('confirmation'))} {...accessibility('confirmation')} disabled={isSubmitting} />{error('confirmation')}</div>
    {errors.root && <p className="register-error register-error--server" role="alert">{errors.root.message}</p>}
    <button className="register-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</button>
  </form>
}
