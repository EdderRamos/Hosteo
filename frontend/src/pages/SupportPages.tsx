import { PageLoading } from '../shared/ui/PageLoading'
import { Link, Navigate, useParams, useSearchParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../features/auth/session'
import { homePath, roleLabels } from '../shared/auth/roles'
import { StaffHeader, StaffSidebar } from '../shared/ui/StaffNavigation'
import { Heading, ErrorBox, Pagination } from '../features/operations/ui'
import { statusLabels, typeLabels } from '../features/properties/schemas'
import { money } from '../features/operations/api'
import * as api from '../features/support/api'
import type { ReactNode } from 'react'
export function SupportLayout({ children }: { children: (token: string) => ReactNode }) {
 const session = useSession()
 if (!session) return <Navigate to="/login" replace />
 if (session.user.roleCode !== 'SUPPORT') return <Navigate to={homePath(session.user.roleCode)} replace />
 return <div className="staff-app"><StaffHeader name={`${session.user.firstName} ${session.user.lastName}`} admin={false} /><StaffSidebar admin={false} active="support" /><main className="staff-main ops-main"><nav className="ops-nav" aria-label="Atención de soporte"><Link to="/support/users">Usuarios y propiedades</Link><Link to="/support/bookings">Consultar reservas y pagos</Link><Link to="/support/operations">Información operativa</Link></nav><div key={session.accessToken}>{children(session.accessToken)}</div></main></div>
}
function usePage() { const [params, setParams] = useSearchParams(); const value = params.get('page') ?? '0'; return { params, setParams, page: /^\d+$/.test(value) && Number(value) <= 100000 ? Number(value) : 0 } }
export function SupportUsersPage() { return <SupportLayout>{token => <Users token={token} />}</SupportLayout> }
function Users({ token }: { token: string }) {
 const { params, setParams, page } = usePage(); const queryText = (params.get('query') ?? '').slice(0, 100)
 const { register, handleSubmit } = useForm({ values: { query: queryText } })
 const query = useQuery({ queryKey: ['support', token, 'users', queryText, page], queryFn: ({ signal }) => api.searchUsers(token, queryText, page, signal) })
 return <><Heading text="Atención de usuarios" note="Busca por nombres, apellidos o email para consultar una cuenta y sus propiedades. Acceso de solo lectura." /><section className="ops-panel"><form className="ops-form ops-inline" onSubmit={handleSubmit(values => setParams({ query: values.query.trim(), page: '0' }))}><label>Buscar usuario<input maxLength={100} placeholder="Nombre, apellido o email" {...register('query')} /></label><button className="ops-primary">Buscar</button></form></section>{query.isPending ? <PageLoading label="Buscando usuarios…" /> : query.isError ? <ErrorBox error={query.error} retry={() => void query.refetch()} /> : <><p>{query.data.total} cuentas encontradas</p>{!query.data.items.length && <section className="ops-panel"><h2>No encontramos usuarios</h2><p>Prueba otro nombre o correo.</p>{page > 0 && <button onClick={() => setParams({ query: queryText, page: '0' })}>Ir a la primera página</button>}</section>}<div className="ops-grid">{query.data.items.map(user => <article className="ops-panel" key={user.id}><h2>{user.firstName} {user.lastName}</h2><p>{user.email}</p><p>{roleLabels[user.roleCode]} · {user.active ? 'Activo' : 'Inactivo'}</p><Link to={`/support/users/${user.id}`}>Consultar usuario y propiedades #{user.id} →</Link></article>)}</div><Pagination page={page} pages={query.data.pages} change={value => setParams({ query: queryText, page: String(value) })} busy={query.isFetching} /></>}</>
}
export function SupportUserPage() { const { id } = useParams(); return <SupportLayout>{token => <UserProperties key={id} token={token} />}</SupportLayout> }
function UserProperties({ token }: { token: string }) {
 const { id = '' } = useParams(); const { page, setParams } = usePage(); const client = useQueryClient()
 const user = useQuery({ queryKey: ['support', token, 'user', id], queryFn: ({ signal }) => api.loadUser(token, id, signal) })
 const properties = useQuery({ queryKey: ['support', token, 'properties', id, page], queryFn: ({ signal }) => api.loadProperties(token, id, page, signal), enabled: user.isSuccess })
 return <><Link to="/support/users">← Buscar usuarios</Link>{user.isPending ? <PageLoading label="Consultando cuenta…" /> : user.isError ? <ErrorBox error={user.error} retry={() => void user.refetch()} /> : <><Heading text={`${user.data.firstName} ${user.data.lastName}`} note={`${user.data.email} · ${roleLabels[user.data.roleCode]} · ${user.data.active ? 'Activo' : 'Inactivo'}`} /><button disabled={user.isFetching || properties.isFetching} onClick={() => void client.invalidateQueries({ queryKey: ['support', token] })}>Actualizar información</button><h2>Propiedades asociadas</h2>{properties.isPending ? <PageLoading label="Consultando propiedades…" /> : properties.isError ? <ErrorBox error={properties.error} retry={() => void properties.refetch()} /> : <><p>{properties.data.total} propiedades registradas por esta cuenta</p>{!properties.data.items.length && <section className="ops-panel"><p>No hay propiedades asociadas en esta página.</p>{page > 0 && <button onClick={() => setParams({ page: '0' })}>Ir a la primera página</button>}</section>}<div className="ops-grid">{properties.data.items.map(p => <article className="ops-panel" key={p.id}><span className="ops-status">{statusLabels[p.status]}</span><h2>{p.title}</h2><p>{p.district}, {p.city} · {p.capacity} huéspedes</p><p>{money(p.nightlyRate, p.currency)} / noche</p><Link to={`/support/users/${id}/properties/${p.id}`}>Consultar propiedad #{p.id} →</Link></article>)}</div><Pagination page={page} pages={properties.data.pages} change={value => setParams({ page: String(value) })} busy={properties.isFetching} /></>}</>}</>
}
export function SupportPropertyPage() { return <SupportLayout>{token => <Property token={token} />}</SupportLayout> }
function Property({ token }: { token: string }) {
 const { id = '', propertyId = '' } = useParams()
 const query = useQuery({ queryKey: ['support', token, 'property', id, propertyId], queryFn: ({ signal }) => api.loadProperty(token, id, propertyId, signal) })
 if (query.isPending) return <PageLoading label="Consultando propiedad…" />
 if (query.isError) return <><Link to={`/support/users/${id}`}>Volver al usuario</Link><ErrorBox error={query.error} retry={() => void query.refetch()} /></>
 const p = query.data
 return <><Link to={`/support/users/${id}`}>← Propiedades del usuario #{id}</Link><Heading text={p.title} note={`Propiedad #${p.id} · ${statusLabels[p.status]} · Solo consulta`} /><section className="ops-panel"><p className="ops-description">{p.description}</p><dl className="ops-details"><div><dt>Tipo</dt><dd>{typeLabels[p.type]}</dd></div><div><dt>Dirección</dt><dd>{p.address}, {p.district}, {p.city}</dd></div><div><dt>Huéspedes</dt><dd>{p.capacity}</dd></div><div><dt>Habitaciones / camas / baños</dt><dd>{p.bedrooms} / {p.beds} / {p.bathrooms}</dd></div><div><dt>Tarifa por noche</dt><dd>{money(p.nightlyRate, p.currency)}</dd></div><div><dt>Registrada</dt><dd>{new Date(p.createdAt).toLocaleDateString('es-PE')}</dd></div></dl>{p.reviewComment && <><h3>Comentario de validación</h3><p>{p.reviewComment}</p></>}<button disabled={query.isFetching} onClick={() => void query.refetch()}>Actualizar propiedad</button></section></>
}
