import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/http'
import { logout } from '../../auth/session'
import { createProperty } from '../api'
import { propertySchema, type PropertyValues, typeLabels } from '../schemas'

const defaults: PropertyValues = { title: '', description: '', type: 'APARTMENT', address: '', city: 'Lima', district: '', capacity: 1, bedrooms: 1, beds: 1, bathrooms: 1, nightlyRate: 0, currency: 'PEN' }
export function PropertyForm({ token }: { token: string }) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const attempt = useRef<{ payload: string; key: string } | null>(null)
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<PropertyValues>({ defaultValues: defaults })
  const mutation = useMutation({ mutationFn: ({ values, key }: { values: PropertyValues; key: string }) => createProperty(token, values, key), retry: false })
  async function submit(values: PropertyValues) {
    clearErrors()
    const parsed = propertySchema.safeParse(values)
    if (!parsed.success) {
      const fields = new Set<string>()
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && field in defaults && !fields.has(field)) {
          setError(field as keyof PropertyValues, { message: issue.code === 'invalid_type' ? 'Ingresa un número válido.' : issue.message }, { shouldFocus: fields.size === 0 }); fields.add(field)
        }
      }
      return
    }
    const payload = JSON.stringify(parsed.data)
    if (!attempt.current || attempt.current.payload !== payload) attempt.current = { payload, key: crypto.randomUUID() }
    try {
      const saved = await mutation.mutateAsync({ values: parsed.data, key: attempt.current.key })
      client.setQueryData(['host-property', token, String(saved.id)], saved)
      navigate(`/host/properties/${saved.id}`, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { logout(); navigate('/login', { replace: true }); return }
      const message = error instanceof ApiError && error.status === 409 ? 'Este intento ya corresponde a otros datos. Revisa la información antes de registrar otra propiedad.' : error instanceof Error ? error.message : 'No pudimos registrar la propiedad. Intenta nuevamente.'
      setError('root', { message })
      if (error instanceof ApiError) for (const [name] of Object.entries(error.fieldErrors)) {
        if (name in defaults) setError(name as keyof PropertyValues, { message: 'Revisa este campo.' })
      }
    }
  }
  function field(name: 'title' | 'address' | 'city' | 'district', label: string, maxLength: number, placeholder?: string) {
    return <div className="property-field"><label htmlFor={`property-${name}`}>{label} <span>*</span></label><input id={`property-${name}`} required maxLength={maxLength} placeholder={placeholder} {...register(name)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} />{errors[name] && <small id={`error-${name}`} role="alert">{errors[name]?.message}</small>}</div>
  }
  function number(name: 'capacity' | 'bedrooms' | 'beds' | 'bathrooms', label: string, min: number) {
    return <div className="property-field"><label htmlFor={`property-${name}`}>{label} <span>*</span></label><input id={`property-${name}`} required type="number" min={min} step="1" {...register(name, { valueAsNumber: true })} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} />{errors[name] && <small id={`error-${name}`} role="alert">{errors[name]?.message}</small>}</div>
  }
  return <form className="property-form" onSubmit={event => { void handleSubmit(submit)(event) }} noValidate aria-busy={isSubmitting}><fieldset disabled={isSubmitting}>
    <section className="property-section"><div className="property-section-heading"><span>01</span><div><h2>Información de la propiedad</h2><p>Describe el alojamiento que quieres ofrecer.</p></div></div><div className="property-fields">{field('title', 'Título del alojamiento', 150, 'Ej. Departamento luminoso en Miraflores')}<div className="property-field"><label htmlFor="property-type">Tipo de propiedad <span>*</span></label><select required id="property-type" {...register('type')}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="property-field property-field-full"><label htmlFor="property-description">Descripción <span>*</span></label><textarea required id="property-description" rows={5} maxLength={5000} placeholder="Cuéntanos cómo es el espacio y qué lo hace especial." {...register('description')} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'error-description' : undefined} />{errors.description && <small id="error-description" role="alert">{errors.description.message}</small>}</div></div></section>
    <section className="property-section"><div className="property-section-heading"><span>02</span><div><h2>Ubicación</h2><p>Indica la dirección real de tu alojamiento.</p></div></div><div className="property-fields"><div className="property-field-full">{field('address', 'Dirección', 255, 'Calle, número y departamento')}</div>{field('city', 'Ciudad', 100)}{field('district', 'Distrito', 100, 'Ej. Miraflores')}</div></section>
    <section className="property-section"><div className="property-section-heading"><span>03</span><div><h2>Distribución y capacidad</h2><p>Ayuda a los huéspedes a conocer el espacio disponible.</p></div></div><div className="property-counts">{number('capacity', 'Huéspedes', 1)}{number('bedrooms', 'Habitaciones', 0)}{number('beds', 'Camas', 1)}{number('bathrooms', 'Baños', 0)}</div></section>
    <section className="property-section"><div className="property-section-heading"><span>04</span><div><h2>Tarifa por noche</h2><p>Elige una moneda y define tu tarifa base.</p></div></div><div className="property-fields"><div className="property-field"><label htmlFor="property-rate">Precio por noche <span>*</span></label><input required id="property-rate" type="number" min="0.01" step="0.01" placeholder="0.00" {...register('nightlyRate', { valueAsNumber: true })} aria-invalid={Boolean(errors.nightlyRate)} aria-describedby={errors.nightlyRate ? 'error-rate' : undefined} />{errors.nightlyRate && <small id="error-rate" role="alert">{errors.nightlyRate.message}</small>}</div><div className="property-field"><label htmlFor="property-currency">Moneda <span>*</span></label><select required id="property-currency" {...register('currency')}><option value="PEN">PEN · Soles</option><option value="USD">USD · Dólares</option></select></div></div></section>
    <div className="property-form-footer"><p>Los campos con * son obligatorios.</p>{errors.root && <p className="property-error" role="alert">{errors.root.message}</p>}<div><Link to="/host" aria-disabled={isSubmitting} onClick={event => { if (isSubmitting) event.preventDefault() }}>Volver al portal</Link><button className="property-primary" disabled={isSubmitting}>{isSubmitting ? 'Registrando…' : 'Registrar propiedad'}</button></div></div>
  </fieldset></form>
}
