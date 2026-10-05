import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { loadProfile, saveProfile, type Profile, type ProfileUpdate } from '../features/profile/api'
import { logout, updateSessionUser, useSession } from '../features/auth/session'
import { ApiError } from '../shared/api/http'
import { CustomerHeader } from '../shared/ui/CustomerHeader'
import { PreviewDialog } from '../shared/ui/PreviewDialog'
import '../styles/customer-home.css'
import '../styles/profile.css'

export function ProfilePage() {
  const session = useSession()
  const token = session?.accessToken
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    loadProfile(token, controller.signal).then(value => { setProfile(value); setError('') }).catch(error => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && error.status === 401) logout()
      setError(error instanceof Error ? error.message : 'No pudimos cargar tu perfil.')
    })
    return () => controller.abort()
  }, [token, retry])
  return <div className="customer-home"><CustomerHeader onNotice={setNotice} /><main className="customer-container profile-main"><p className="profile-breadcrumb"><Link to="/home">Inicio</Link> / <strong>Perfil personal</strong></p>{!session ? <section className="profile-panel"><h1>Perfil personal</h1><p>Inicia sesión para consultar y actualizar tus datos.</p><Link to="/login">Iniciar sesión</Link></section> : error ? <section className="profile-panel"><p role="alert">{error}</p><button onClick={() => setRetry(retry + 1)}>Reintentar</button></section> : profile && profile.id === session.user.id ? <ProfileEditor key={token} profile={profile} token={session.accessToken} onSaved={setProfile} /> : <p role="status">Cargando perfil…</p>}</main>{notice && <PreviewDialog title={notice} onClose={() => setNotice(null)}><p>Esta función aún no está disponible.</p></PreviewDialog>}</div>
}

function ProfileEditor({ profile, token, onSaved }: { profile: Profile; token: string; onSaved: (profile: Profile) => void }) {
  const { register, handleSubmit, reset, control, setValue, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileUpdate>({ defaultValues: profile })
  const [message, setMessage] = useState('')
  const [active, setActive] = useState('basic')
  const [code, setCode] = useState('es')
  const [level, setLevel] = useState<ProfileUpdate['languages'][number]['proficiency']>('NATIVE')
  const [interest, setInterest] = useState('')
  const biography = useWatch({ control, name: 'biography' }) ?? ''
  const languages = useWatch({ control, name: 'languages' })
  const interests = useWatch({ control, name: 'interests' })
  async function submit(values: ProfileUpdate) {
    setMessage('')
    const optional = (value: string | null) => value?.trim() || null
    const payload: ProfileUpdate = { firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim(), phone: optional(values.phone), gender: values.gender || null, dateOfBirth: optional(values.dateOfBirth), biography: optional(values.biography), occupation: optional(values.occupation), location: optional(values.location), languages: values.languages, interests: values.interests, version: values.version }
    try {
      const saved = await saveProfile(token, payload)
      onSaved(saved); reset(saved); updateSessionUser(saved, token); setMessage('Tus cambios se guardaron correctamente.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { logout(); return }
      const text = error instanceof ApiError && error.code === 'PROFILE_CONFLICT' ? 'Tu perfil cambió en otra sesión. Recarga la página para obtener la última versión antes de guardar.' : error instanceof Error ? error.message : 'No pudimos guardar los cambios.'
      setError('root', { message: text })
      if (error instanceof ApiError) for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field in payload) setError(field as keyof ProfileUpdate, { message })
      }
    }
  }
  const field = (name: 'firstName' | 'lastName' | 'email' | 'phone' | 'occupation' | 'location' | 'dateOfBirth', label: string, maxLength?: number, type = 'text') => <div className="profile-field"><label htmlFor={`profile-${name}`}>{label}</label><input id={`profile-${name}`} type={type} maxLength={maxLength} {...register(name, { required: ['firstName', 'lastName', 'email'].includes(name) ? 'Completa este campo.' : false, validate: value => name === 'dateOfBirth' && value && value >= new Date().toISOString().slice(0, 10) ? 'La fecha debe ser anterior a hoy.' : true })} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `error-${name}` : undefined} />{errors[name] && <small id={`error-${name}`} role="alert">{errors[name]?.message}</small>}</div>
  const languageNames = new Intl.DisplayNames(['es'], { type: 'language' })
  const levels = { BASIC: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado', NATIVE: 'Nativo' }
  return <div className="profile-layout"><aside><section className="profile-panel profile-identity">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Tu foto de perfil" /> : <div className="profile-avatar">{profile.firstName[0]}{profile.lastName[0]}</div>}<h1>{profile.firstName} {profile.lastName}</h1><strong>MI CUENTA</strong><button type="button" className="profile-photo-disabled" disabled aria-label="Cambiar foto (no disponible)" title="Cambiar foto no está disponible por ahora"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h4l2-2h4l2 2h4v14H4Z"/><circle cx="12" cy="13" r="4"/></svg></button><dl><div><dt>Miembro desde</dt><dd>{profile.memberSince ? new Date(profile.memberSince).toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'Sin información'}</dd></div><div><dt>Ubicación</dt><dd>{profile.location || 'Sin especificar'}</dd></div></dl></section><section className="profile-privacy"><strong>Privacidad protegida</strong><p>Comparte solo la información que quieras incluir en tu perfil.</p></section></aside><div><nav className="profile-tabs" aria-label="Secciones del perfil">{[['basic', 'Información básica'], ['about', 'Sobre mí'], ['contact', 'Contacto & Verificación']].map(([id, title]) => <a className={active === id ? 'is-active' : ''} key={id} href={`#${id}`} onClick={() => setActive(id)}>{title}</a>)}</nav><form onSubmit={handleSubmit(submit)} aria-busy={isSubmitting}><fieldset disabled={isSubmitting}><section className="profile-panel" id="basic"><h2>Información Personal Básica</h2><p>Actualiza tus datos personales.</p><div className="profile-fields">{field('firstName', 'Nombre legal', 100)}{field('lastName', 'Apellidos legales', 100)}<div className="profile-field"><label htmlFor="profile-gender">Género</label><select id="profile-gender" {...register('gender')}><option value="">Sin especificar</option><option value="FEMALE">Femenino</option><option value="MALE">Masculino</option><option value="NON_BINARY">No binario</option><option value="OTHER">Otro</option><option value="PREFER_NOT_TO_SAY">Prefiero no decirlo</option></select></div>{field('dateOfBirth', 'Fecha de nacimiento', undefined, 'date')}</div></section><section className="profile-panel" id="about"><h2>Acerca de ti</h2><p>Cuenta a los anfitriones sobre tu estilo de viaje.</p><div className="profile-field"><label htmlFor="profile-bio">Biografía personal <span>{biography.length} / 500 caracteres</span></label><textarea id="profile-bio" maxLength={500} {...register('biography')} /></div><div className="profile-fields">{field('occupation', 'Profesión u ocupación', 150)}{field('location', 'Dónde vives actualmente', 150)}</div><div className="profile-field"><label>Idiomas que hablas con fluidez</label><div className="profile-chips">{languages.map(language => <button type="button" key={language.code} aria-label={`Quitar idioma ${language.code}`} onClick={() => setValue('languages', languages.filter(item => item.code !== language.code), { shouldDirty: true })}>{languageNames.of(language.code) || language.code} ({levels[language.proficiency]}) ×</button>)}</div><details className="profile-options"><summary>+ Agregar idioma</summary><div className="profile-add"><select aria-label="Idioma" value={code} onChange={event => setCode(event.target.value)}><option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option><option value="fr">Francés</option><option value="de">Alemán</option><option value="it">Italiano</option><option value="ja">Japonés</option><option value="zh">Chino</option></select><select aria-label="Nivel de idioma" value={level} onChange={event => setLevel(event.target.value as typeof level)}>{Object.entries(levels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" disabled={languages.length >= 20 || !/^[a-z]{2,3}(-[A-Z]{2})?$/.test(code) || languages.some(item => item.code === code)} onClick={() => setValue('languages', [...languages, { code, proficiency: level }], { shouldDirty: true })}>Agregar</button></div></details></div><div className="profile-field"><label>Intereses y estilo de estancia</label><div className="profile-chips">{interests.map(value => <button type="button" key={value} aria-label={`Quitar interés ${value}`} onClick={() => setValue('interests', interests.filter(item => item !== value), { shouldDirty: true })}>{value} ×</button>)}</div><details className="profile-options"><summary>+ Personalizar intereses</summary><div className="profile-add"><input aria-label="Nuevo interés" maxLength={100} value={interest} onChange={event => setInterest(event.target.value)} /><button type="button" disabled={interests.length >= 30 || !interest.trim() || interests.some(item => item.toLowerCase() === interest.trim().toLowerCase())} onClick={() => { setValue('interests', [...interests, interest.trim()], { shouldDirty: true }); setInterest('') }}>Agregar</button></div></details></div></section><section className="profile-panel" id="contact"><h2>Contacto y Seguridad</h2><p>Información de contacto de tu cuenta.</p><div className="profile-fields">{field('email', 'Correo electrónico', 254, 'email')}{field('phone', 'Teléfono móvil', 30, 'tel')}</div></section><section className="profile-panel profile-save"><p aria-live="polite">{isDirty ? 'Tienes cambios sin guardar.' : message || 'Tu información está actualizada.'}</p>{errors.root && <p role="alert">{errors.root.message}</p>}<button type="button" className="customer-outline" onClick={() => { reset(profile); setMessage('') }}>Descartar</button><button type="submit" disabled={!isDirty || isSubmitting}>{isSubmitting ? 'Guardando…' : 'Guardar cambios'}</button></section></fieldset></form></div></div>
}
