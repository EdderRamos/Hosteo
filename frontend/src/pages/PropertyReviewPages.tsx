import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { logout, useSession } from '../features/auth/session'
import { loadPendingProperties, loadPendingProperty } from '../features/properties/review-api'
import { PropertyDecisionPanel } from '../features/properties/components/PropertyDecisionPanel'
import { typeLabels, type HostProperty } from '../features/properties/schemas'
import { ApiError } from '../shared/api/http'
import { homePath } from '../shared/auth/roles'
import { StaffHeader, StaffSidebar } from '../shared/ui/StaffNavigation'
import '../styles/staff.css'
import '../styles/property-review.css'

function ReviewLayout({ children }: { children: ReactNode }) {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== 'ADMINISTRATOR') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <div className="staff-app"><StaffHeader name={`${session.user.firstName} ${session.user.lastName}`} admin /><StaffSidebar admin active="review" /><main className="staff-main review-main">{children}</main></div>
}
function useSessionError(error: Error | null) {
  useEffect(() => { if (error instanceof ApiError && error.status === 401) logout() }, [error])
}
function ErrorPanel({ error, retry }: { error: Error; retry: () => void }) {
  return <div className="staff-error" role="alert"><p>{error instanceof ApiError && error.status === 403 ? 'Tu cuenta no tiene permiso para consultar esta bandeja.' : error.message}</p><button onClick={retry}>Reintentar</button></div>
}
function sentDate(date: string | null | undefined) {
  return date ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : 'Fecha no registrada'
}
function price(value: number, currency: string) { return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(value) }
export function PendingPropertiesPage() {
  const session = useSession()
  return <ReviewLayout>{session?.user.roleCode === 'ADMINISTRATOR' && <PendingList key={session.accessToken} token={session.accessToken} />}</ReviewLayout>
}
function PendingList({ token }: { token: string }) {
  const [params, setParams] = useSearchParams()
  const raw = params.get('page') ?? '0'
  const page = /^\d+$/.test(raw) && Number(raw) <= 100000 ? Number(raw) : 0
  const query = useQuery({ queryKey: ['pending-properties', token, page], queryFn: ({ signal }) => loadPendingProperties(token, page, signal) })
  useSessionError(query.error)
  return <><div className="staff-title"><div><p className="staff-eyebrow">HOSTEO · VALIDACIÓN DE ALOJAMIENTOS</p><h1>Propiedades pendientes de revisión</h1><p>Consulta la información enviada por los anfitriones antes de validar su publicación.</p></div><span className="staff-access">Acceso administrativo</span></div><section className="staff-panel"><div className="staff-panel-heading"><div><h2>Bandeja de Validación de Propiedades</h2><p>Solicitudes más antiguas primero · 10 propiedades por página</p></div><button disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? 'Actualizando…' : 'Actualizar bandeja'}</button></div>
    {query.isPending ? <p role="status" className="staff-empty">Cargando propiedades pendientes…</p> : query.isError ? <ErrorPanel error={query.error} retry={() => void query.refetch()} /> : <>
      {query.data.items.length === 0 ? <div className="staff-empty"><h3>{query.data.total === 0 ? 'No hay propiedades pendientes de revisión' : 'No hay solicitudes en esta página'}</h3><p>{query.data.total === 0 ? 'Las propiedades enviadas por los anfitriones aparecerán aquí.' : 'Consulta las solicitudes desde la primera página.'}</p>{page > 0 && <button onClick={() => setParams({ page: '0' })}>Ir a la primera página</button>}</div> : <div className="staff-table-scroll"><table className="review-table"><thead><tr><th>PROPIEDAD / UNIDAD</th><th>ANFITRIÓN</th><th>DISTRITO</th><th>TARIFA / NOCHE</th><th>ENVIADA</th><th>ESTADO</th><th>INFORMACIÓN</th></tr></thead><tbody>{query.data.items.map(({ property, host }) => <tr key={property.id}><td data-label="Propiedad"><strong>{property.title}</strong><small>#{property.id} · {typeLabels[property.type]}</small><small>{property.bedrooms} hab. · {property.capacity} huéspedes</small></td><td data-label="Anfitrión"><strong>{host.firstName} {host.lastName}</strong><small>{host.email}</small></td><td data-label="Distrito">{property.district}<small>{property.city}</small></td><td data-label="Tarifa por noche">{price(property.nightlyRate, property.currency)}</td><td data-label="Enviada">{sentDate(property.submittedAt)}</td><td data-label="Estado"><span className="review-pending">Pendiente de revisión</span></td><td data-label="Información"><Link className="staff-review-link" to={`/hosteo/properties/pending/${property.id}`} aria-label={`Revisar información de ${property.title}`}>Revisar información →</Link></td></tr>)}</tbody></table></div>}
      <div className="staff-pagination"><span>{query.data.total} solicitudes pendientes{query.data.pages > 0 && page < query.data.pages ? ` · Página ${page + 1} de ${query.data.pages}` : ''}</span>{query.data.pages > 1 && <div><button disabled={page === 0 || query.isFetching} onClick={() => setParams({ page: String(page - 1) })}>Anterior</button><button disabled={page + 1 >= query.data.pages || query.isFetching} onClick={() => setParams({ page: String(page + 1) })}>Siguiente</button></div>}</div>
    </>}
  </section><p className="review-scope-note">Abre un expediente para revisar su información y decidir si se publica o se rechaza.</p></>
}
export function PendingPropertyDetailPage() {
  const { id = '' } = useParams()
  const session = useSession()
  return <ReviewLayout>{session?.user.roleCode === 'ADMINISTRATOR' && <PendingDetail key={`${session.accessToken}-${id}`} token={session.accessToken} />}</ReviewLayout>
}
function PendingDetail({ token }: { token: string }) {
  const [result, setResult] = useState<HostProperty | null>(null)
  const { id = '' } = useParams()
  const validId = /^[1-9]\d*$/.test(id)
  const query = useQuery({ queryKey: ['pending-property', token, id], queryFn: ({ signal }) => loadPendingProperty(token, id, signal), enabled: validId && !result, refetchOnWindowFocus: false, refetchOnReconnect: false })
  useSessionError(query.error)
  const back = <Link className="staff-review-link" to="/hosteo/properties/pending">← Volver a la bandeja</Link>
  if (result) return <section className="staff-panel review-detail"><p className="review-decision-success" role="status">{result.status === 'PUBLISHED' ? 'Propiedad aprobada y publicada.' : 'Propiedad rechazada. El motivo está disponible para el anfitrión.'}</p><h1>{result.title}</h1><p>Decisión registrada: {sentDate(result.reviewedAt)}</p>{result.reviewComment && <p className="review-description">{result.reviewComment}</p>}{back}</section>
  if (!validId || (query.error instanceof ApiError && query.error.status === 404)) return <section className="staff-panel review-detail"><h1>Solicitud no disponible</h1><p>La propiedad no existe o ya no está pendiente de revisión. Actualiza la bandeja para consultar las solicitudes actuales.</p>{back}</section>
  if (query.isPending) return <p className="staff-empty" role="status">Consultando expediente…</p>
  if (query.isError) return <section className="staff-panel review-detail">{back}<ErrorPanel error={query.error} retry={() => void query.refetch()} /></section>
  const { property, host } = query.data
  return <>{back}<div className="staff-title review-detail-title"><div><p className="staff-eyebrow">EXPEDIENTE DE PROPIEDAD #{property.id}</p><h1>{property.title}</h1><p>Enviada a validación: {sentDate(property.submittedAt)}</p></div><span className="review-pending">Pendiente de revisión</span></div><section className="staff-panel review-detail"><div className="review-detail-heading"><h2>Información enviada por el anfitrión</h2><button disabled={query.isFetching} onClick={() => void query.refetch()}>Actualizar información</button></div><p className="review-description">{property.description}</p><div className="review-detail-grid"><div><h3>Información principal y ubicación</h3><dl><div><dt>Tipo</dt><dd>{typeLabels[property.type]}</dd></div><div><dt>Dirección</dt><dd>{property.address}</dd></div><div><dt>Ciudad</dt><dd>{property.city}</dd></div><div><dt>Distrito</dt><dd>{property.district}</dd></div><div><dt>Registrada</dt><dd>{sentDate(property.createdAt)}</dd></div></dl></div><div><h3>Distribución y tarifa</h3><dl><div><dt>Huéspedes</dt><dd>{property.capacity}</dd></div><div><dt>Habitaciones</dt><dd>{property.bedrooms}</dd></div><div><dt>Camas</dt><dd>{property.beds}</dd></div><div><dt>Baños</dt><dd>{property.bathrooms}</dd></div><div><dt>Tarifa por noche</dt><dd>{price(property.nightlyRate, property.currency)}</dd></div></dl></div><div><h3>Anfitrión</h3><dl><div><dt>Nombre</dt><dd>{host.firstName} {host.lastName}</dd></div><div><dt>Email</dt><dd>{host.email}</dd></div><div><dt>ID de cuenta</dt><dd>{host.id}</dd></div></dl></div></div></section><PropertyDecisionPanel key={property.version} token={token} property={property} onDecided={setResult} onReload={() => void query.refetch()} /></>
}
