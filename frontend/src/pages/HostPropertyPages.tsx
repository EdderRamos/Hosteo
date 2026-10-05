import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession, logout } from '../features/auth/session'
import { homePath } from '../shared/auth/roles'
import { AccountHeader } from '../shared/ui/AccountHeader'
import { ApiError } from '../shared/api/http'
import { PropertyForm } from '../features/properties/components/PropertyForm'
import { loadProperty } from '../features/properties/api'
import { typeLabels } from '../features/properties/schemas'
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
  const { id = '' } = useParams()
  const validId = /^[1-9]\d*$/.test(id)
  const query = useQuery({ queryKey: ['host-property', token, id], queryFn: ({ signal }) => loadProperty(token, id, signal), enabled: validId, retry: false })
  useEffect(() => { if (query.error instanceof ApiError && query.error.status === 401) logout() }, [query.error])
  if (!validId || (query.error instanceof ApiError && query.error.status === 404)) return <section className="property-section"><h1>Propiedad no encontrada</h1><p>No encontramos una propiedad de tu cuenta con ese identificador.</p><Link to="/host">Volver al portal</Link></section>
  if (query.isPending) return <p role="status">Consultando tu propiedad…</p>
  if (query.isError) return <section className="property-section"><p className="property-error" role="alert">{query.error.message}</p><button onClick={() => void query.refetch()}>Reintentar</button></section>
  const property = query.data
  return <section className="property-confirmation"><span className="property-success-icon" aria-hidden="true">✓</span><p className="property-eyebrow">PROPIEDAD REGISTRADA · #{property.id}</p><h1>{property.title}</h1><span className="property-draft">{property.status === 'DRAFT' ? 'Borrador · Sin publicar' : property.status}</span><p>La información está guardada en tu cuenta de anfitrión.</p><div className="property-confirmation-grid"><div><h2>Información principal</h2><p>{property.description}</p><dl><div><dt>Tipo</dt><dd>{typeLabels[property.type]}</dd></div><div><dt>Dirección</dt><dd>{property.address}</dd></div><div><dt>Ubicación</dt><dd>{property.district}, {property.city}</dd></div></dl></div><div><h2>Distribución y tarifa</h2><dl><div><dt>Huéspedes</dt><dd>{property.capacity}</dd></div><div><dt>Habitaciones</dt><dd>{property.bedrooms}</dd></div><div><dt>Camas / Baños</dt><dd>{property.beds} / {property.bathrooms}</dd></div><div><dt>Por noche</dt><dd>{new Intl.NumberFormat('es-PE', { style: 'currency', currency: property.currency }).format(property.nightlyRate)}</dd></div></dl></div></div><p className="property-confirmation-note">El envío a validación y la publicación todavía no están disponibles. Tu alojamiento no aparece en el catálogo.</p><div className="property-confirmation-actions"><Link className="property-primary" to="/host/properties/new">Registrar otra propiedad</Link><Link to="/host">Volver al portal</Link></div></section>
}
