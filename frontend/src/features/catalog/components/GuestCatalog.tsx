import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { catalog, money } from '../../operations/api'
import { typeLabels } from '../../properties/schemas'
export function GuestCatalog() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('page') ?? '0'
  const page = /^\d+$/.test(raw) && Number(raw) <= 100000 ? Number(raw) : 0
  const query = useQuery({ queryKey: ['operations', 'catalog', page], queryFn: ({ signal }) => catalog(page, signal) })
  if (query.isPending) return <p role="status">Consultando alojamientos publicados…</p>
  if (query.isError) return <div className="guest-empty" role="alert"><p>{query.error.message}</p><button className="guest-button" onClick={() => void query.refetch()}>Reintentar</button></div>
  return <><div className="guest-filters"><p>{query.data.total} alojamientos publicados</p><button className="guest-clear" disabled={query.isFetching} onClick={() => void query.refetch()}>Actualizar alojamientos</button></div><div className="guest-property-grid">{query.data.items.map(property => <article className="guest-property" key={property.id}><div className="guest-property-image guest-property-placeholder"><span aria-hidden="true">⌂</span><span className="guest-district">{property.district}</span></div><div className="guest-property-body"><h2>{property.title}</h2><p className="guest-property-meta">{typeLabels[property.type]} · {property.capacity} huéspedes · {property.bedrooms} habitaciones</p><div className="guest-property-bottom"><p><small>POR NOCHE</small><strong>{money(property.nightlyRate, property.currency)}</strong></p><Link className="guest-button" to={`/guest/properties/${property.id}`}>Ver disponibilidad</Link></div></div></article>)}</div>{query.data.items.length === 0 && <div className="guest-empty"><h2>{query.data.total === 0 ? 'Aún no hay alojamientos publicados' : 'No hay alojamientos en esta página'}</h2><p>Solo aparecen propiedades aprobadas por el administrador.</p>{page > 0 && <button onClick={() => setParams({ page: '0' })}>Volver a la primera página</button>}</div>}{query.data.pages > 1 && <nav className="ops-pagination" aria-label="Páginas de alojamientos"><button disabled={page === 0 || query.isFetching} onClick={() => setParams({ page: String(page - 1) })}>Anterior</button><span>Página {page + 1} de {query.data.pages}</span><button disabled={page + 1 >= query.data.pages || query.isFetching} onClick={() => setParams({ page: String(page + 1) })}>Siguiente</button></nav>}</>
}
