import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, useParams, useSearchParams, useLocation } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession, logout } from '../features/auth/session'
import { homePath } from '../shared/auth/roles'
import { AccountHeader } from '../shared/ui/AccountHeader'
import { ApiError } from '../shared/api/http'
import { PropertyForm } from '../features/properties/components/PropertyForm'
import { loadProperty, loadProperties } from '../features/properties/api'
import { typeLabels, statusLabels, statusDescriptions } from '../features/properties/schemas'
import '../styles/guest-home.css'
import '../styles/properties.css'

function HostPropertyLayout({ children }: { children: ReactNode }) {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== 'HOST') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <div className="property-app"><AccountHeader /><main className="guest-container property-main"><p className="property-breadcrumb"><Link to="/host">Portal del anfitrión</Link><span>/</span>Propiedades</p>{children}</main></div>
}
export function RegisterPropertyPage() {
  const session = useSession()
  return <HostPropertyLayout><header className="property-page-heading"><p className="property-eyebrow">TU ESPACIO EN HOSTEO</p><h1>Registra tu propiedad</h1><p>Completa la información principal de tu alojamiento.</p></header><div className="property-registration"><div>{session?.user.roleCode === 'HOST' && <PropertyForm key={session.accessToken} token={session.accessToken} />}</div><aside className="property-guide"><span className="property-draft">Borrador</span><h2>El primer paso para recibir huéspedes</h2><p>Tu propiedad se guardará en tu cuenta y todavía no aparecerá en el catálogo.</p><ul><li>Describe el espacio con información precisa.</li><li>Revisa la dirección y la capacidad.</li><li>Define la tarifa y su moneda.</li></ul><p>El envío a validación y la publicación se habilitarán en sus próximos flujos.</p></aside></div></HostPropertyLayout>
}
export function PropertyConfirmationPage() {
  const session = useSession()
  return <HostPropertyLayout>{session?.user.roleCode === 'HOST' && <Confirmation key={session.accessToken} token={session.accessToken} />}</HostPropertyLayout>
}
function Confirmation({ token }: { token: string }) {
  const location = useLocation()
  const { id = '' } = useParams()
  const validId = /^[1-9]\d*$/.test(id)
  const query = useQuery({ queryKey: ['host-property', token, id], queryFn: ({ signal }) => loadProperty(token, id, signal), enabled: validId, retry: false })
  useEffect(() => { if (query.error instanceof ApiError && query.error.status === 401) logout() }, [query.error])
  if (!validId || (query.error instanceof ApiError && query.error.status === 404)) return <section className="property-section"><h1>Propiedad no encontrada</h1><p>No encontramos una propiedad de tu cuenta con ese identificador.</p><Link to="/host">Volver al portal</Link></section>
  if (query.isPending) return <p role="status">Consultando tu propiedad…</p>
  if (query.isError) return <section className="property-section"><p className="property-error" role="alert">{query.error.message}</p><button onClick={() => void query.refetch()}>Reintentar</button></section>
  const property = query.data
  return <section className="property-confirmation">{location.state?.propertySaved && <p role="status">Cambios guardados correctamente.</p>}<span className="property-success-icon" aria-hidden="true">✓</span><p className="property-eyebrow">PROPIEDAD REGISTRADA · #{property.id}</p><h1>{property.title}</h1><span className="property-draft">{property.status === 'DRAFT' ? 'Borrador · Sin publicar' : statusLabels[property.status]}</span><p>La información está guardada en tu cuenta de anfitrión.</p><div className="property-confirmation-grid"><div><h2>Información principal</h2><p>{property.description}</p><dl><div><dt>Tipo</dt><dd>{typeLabels[property.type]}</dd></div><div><dt>Dirección</dt><dd>{property.address}</dd></div><div><dt>Ubicación</dt><dd>{property.district}, {property.city}</dd></div></dl></div><div><h2>Distribución y tarifa</h2><dl><div><dt>Huéspedes</dt><dd>{property.capacity}</dd></div><div><dt>Habitaciones</dt><dd>{property.bedrooms}</dd></div><div><dt>Camas / Baños</dt><dd>{property.beds} / {property.bathrooms}</dd></div><div><dt>Por noche</dt><dd>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: property.currency }).format(property.nightlyRate)}</dd></div></dl></div></div><p className="property-confirmation-note">{statusDescriptions[property.status]}</p><div className="property-confirmation-actions"><Link className="property-primary" to={`/host/properties/${property.id}/edit`}>Editar propiedad</Link><Link to="/host/properties">Ver mis propiedades</Link></div></section>
}

export function HostPropertiesPage() {
  const session = useSession()
  return <HostPropertyLayout>{session?.user.roleCode === 'HOST' && <PropertyList key={session.accessToken} token={session.accessToken} />}</HostPropertyLayout>
}
function PropertyList({ token }: { token: string }) {
  const [params, setParams] = useSearchParams()
  const raw = params.get('page') ?? '0'
  const page = /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) <= 2147483647 ? Number(raw) : 0
  const query = useQuery({ queryKey: ['host-properties', token, page], queryFn: ({ signal }) => loadProperties(token, page, signal) })
  useEffect(() => { if (query.error instanceof ApiError && query.error.status === 401) logout() }, [query.error])
  return <><header className="property-list-heading property-page-heading"><div><p className="property-eyebrow">TU ESPACIO EN HOSTEO</p><h1>Mis propiedades</h1><p>Consulta tus alojamientos registrados y su estado actual.</p></div><Link className="property-primary" to="/host/properties/new">Registrar propiedad</Link></header>
    {query.isPending ? <p role="status">Consultando tus propiedades…</p> : query.isError ? <section className="property-section"><p className="property-error" role="alert">{query.error.message}</p><button onClick={() => void query.refetch()}>Reintentar</button></section> : <>
      <div className="property-list-toolbar"><p>{query.data.total} {query.data.total === 1 ? 'propiedad registrada' : 'propiedades registradas'}</p><button disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? 'Actualizando…' : 'Actualizar estados'}</button></div>
      {query.data.items.length === 0 ? <section className="property-section property-list-empty"><h2>{query.data.total === 0 ? 'Aún no tienes propiedades registradas' : 'No hay propiedades en esta página'}</h2><p>{query.data.total === 0 ? 'Registra tu primer alojamiento para consultar su estado aquí.' : 'Vuelve a la primera página para consultar tus alojamientos.'}</p>{page > 0 && <button onClick={() => setParams({ page: '0' })}>Ir a la primera página</button>}</section> : <div className="property-list-grid">{query.data.items.map(property => <article className="property-list-card" key={property.id}><div className="property-list-card-top"><span className="property-eyebrow">PROPIEDAD #{property.id}</span><span className={`property-status property-status-${property.status.toLowerCase()}`}>{statusLabels[property.status]}</span></div><h2>{property.title}</h2><p>{typeLabels[property.type]} · {property.district}, {property.city}</p><p className="property-list-state">{statusDescriptions[property.status]}</p><dl><div><dt>Capacidad</dt><dd>{property.capacity} huéspedes</dd></div><div><dt>Por noche</dt><dd>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: property.currency }).format(property.nightlyRate)}</dd></div><div><dt>Registrada</dt><dd>{new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(property.createdAt))}</dd></div></dl><Link to={`/host/properties/${property.id}/edit`} aria-label={`Editar ${property.title}`}>Editar propiedad</Link> · <Link to={`/host/properties/${property.id}`} aria-label={`Ver información de ${property.title}`}>Ver información →</Link></article>)}</div>}
      {query.data.pages > 1 && <nav className="property-list-pagination" aria-label="Páginas de propiedades"><button disabled={page === 0 || query.isFetching} onClick={() => setParams({ page: String(page - 1) })}>Anterior</button><span>Página {page + 1} de {query.data.pages}</span><button disabled={page >= query.data.pages - 1 || query.isFetching} onClick={() => setParams({ page: String(page + 1) })}>Siguiente</button></nav>}
    </>}
  </>
}

export function EditPropertyPage() {
  const session = useSession()
  return <HostPropertyLayout>{session?.user.roleCode === 'HOST' && <EditProperty key={session.accessToken} token={session.accessToken} />}</HostPropertyLayout>
}
function EditProperty({ token }: { token: string }) {
  const { id = '' } = useParams()
  const validId = /^[1-9]\d*$/.test(id)
  const query = useQuery({ queryKey: ['host-property', token, id], queryFn: ({ signal }) => loadProperty(token, id, signal), enabled: validId, refetchOnWindowFocus: false, refetchOnReconnect: false })
  useEffect(() => { if (query.error instanceof ApiError && query.error.status === 401) logout() }, [query.error])
  if (!validId || (query.error instanceof ApiError && query.error.status === 404)) return <section className="property-section"><h1>Propiedad no encontrada</h1><p>No encontramos una propiedad de tu cuenta con ese identificador.</p><Link to="/host/properties">Ver mis propiedades</Link></section>
  if (query.isPending) return <p role="status">Cargando información para editar…</p>
  if (query.isError) return <section className="property-section"><p className="property-error" role="alert">{query.error.message}</p><button onClick={() => void query.refetch()}>Reintentar</button></section>
  return <><header className="property-page-heading"><p className="property-eyebrow">PROPIEDAD #{query.data.id}</p><h1>Editar propiedad</h1><p>Actualiza la información de tu alojamiento. Estado actual: {statusLabels[query.data.status]}.</p></header><PropertyForm key={`${id}-${query.data.version}-${query.dataUpdatedAt}`} token={token} property={query.data} onReload={() => void query.refetch()} /></>
}
