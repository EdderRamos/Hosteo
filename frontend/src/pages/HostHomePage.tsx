import { Link, Navigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../features/auth/session'
import { homePath } from '../shared/auth/roles'
import { AccountHeader } from '../shared/ui/AccountHeader'
import { PageLoading } from '../shared/ui/PageLoading'
import { bookings, managedProperties, summary, money, bookingLabels, type Booking } from '../features/operations/api'
import { statusLabels, statusDescriptions, typeLabels, type HostProperty } from '../features/properties/schemas'
import '../styles/guest-home.css'
import '../styles/host-dashboard.css'

export function HostHomePage() {
  const session = useSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.user.roleCode !== 'HOST') return <Navigate to={homePath(session.user.roleCode)} replace />
  return <div className="guest-home host-home"><AccountHeader navigation={<><Link to="/host/properties">Mis propiedades</Link><Link to="/host/bookings">Reservas</Link></>} /><HostDashboard key={session.accessToken} token={session.accessToken} name={`${session.user.firstName} ${session.user.lastName}`} /></div>
}
function HostDashboard({ token, name }: { token: string; name: string }) {
  const stats = useQuery({ queryKey: ['operations', 'HOST', token, 'summary'], queryFn: ({ signal }) => summary(token, 'host', signal) })
  const properties = useQuery({ queryKey: ['operations', 'HOST', token, 'properties', 0], queryFn: ({ signal }) => managedProperties(token, 'host', 0, signal) })
  const stays = useQuery({ queryKey: ['operations', 'HOST', token, 'bookings', 0], queryFn: ({ signal }) => bookings(token, 'host', 0, signal) })
  return <main className="guest-container host-dashboard">
    <section className="host-welcome"><div><p className="host-eyebrow">Portal del anfitrión <span>/</span> RESUMEN DE GESTIÓN</p><h1>Bienvenido, <em>{name}</em></h1><p>Un espacio para tus alojamientos y las estadías que están por venir.<br />Gestiona tus propiedades, revisa sus estados y prepara tu próxima llegada.</p><Link className="host-profile-link" to="/profile">Editar mi perfil</Link></div><div className="host-welcome-actions"><Link className="host-secondary" to="/host/operations"><HostIcon name="calendar" />Resumen y disponibilidad</Link><Link className="host-primary" to="/host/properties/new"><HostIcon name="add" />Registrar propiedad</Link></div></section>
    <section aria-label="Resumen de mis alojamientos" className="host-summary">{stats.isPending ? <PageLoading label="Consultando el resumen de tus alojamientos…" /> : stats.isError ? <HostError error={stats.error} retry={() => void stats.refetch()} /> : <>
      <HostStat label="MIS PROPIEDADES" value={stats.data.properties} icon="home" note={`${stats.data.propertiesByStatus.PUBLISHED ?? 0} publicadas · ${stats.data.propertiesByStatus.PENDING_REVIEW ?? 0} en revisión`} />
      <HostStat label="RESERVAS REGISTRADAS" value={stats.data.bookings} icon="booking" note="Todas las estadías de tus propiedades" />
      <HostStat label="PRÓXIMAS LLEGADAS" value={stats.data.upcomingBookings} icon="calendar" note="Reservas confirmadas desde hoy" />
      <HostStat label="BLOQUEOS ACTIVOS" value={stats.data.activeBlocks} icon="lock" note="Bloqueos que siguen activos" />
    </>}</section>
    <div className="host-dashboard-columns"><section aria-labelledby="host-properties-title"><div className="host-section-heading"><div><p className="host-eyebrow">TUS ESPACIOS</p><h2 id="host-properties-title">Mis propiedades</h2><p>Sus datos, su estado y todo lo que sigue.</p></div><Link to="/host/properties">Ver todas <span aria-hidden="true">↗</span></Link></div>
      {properties.isPending ? <PageLoading label="Consultando tus propiedades…" /> : properties.isError ? <HostError error={properties.error} retry={() => void properties.refetch()} /> : properties.data.items.length ? <><div className="host-property-list">{properties.data.items.slice(0, 3).map((property, index) => <HostPropertyCard key={property.id} property={property} index={index} />)}</div><p className="host-list-note">Mostrando {Math.min(properties.data.items.length, 3)} de {properties.data.total} propiedades · Las más recientes primero.</p></> : <div className="host-empty"><span className="host-empty-icon"><HostIcon name="home" /></span><h3>Tu primer alojamiento comienza aquí</h3><p>Registra la información de tu propiedad y envíala a validación cuando esté lista.</p><Link className="host-primary" to="/host/properties/new">Registrar mi primera propiedad</Link></div>}
    </section><aside className="host-stays" aria-labelledby="host-stays-title"><div className="host-section-heading"><div><p className="host-eyebrow">TUS HUÉSPEDES</p><h2 id="host-stays-title">Reservas recientes</h2><p>Las últimas estadías registradas.</p></div><span className="host-section-icon"><HostIcon name="booking" /></span></div><div className="host-stays-panel">{stays.isPending ? <PageLoading label="Consultando reservas de tus propiedades…" /> : stays.isError ? <HostError error={stays.error} retry={() => void stays.refetch()} /> : stays.data.items.length ? <><div className="host-stay-list">{stays.data.items.slice(0, 3).map(booking => <HostStayCard key={booking.id} booking={booking} />)}</div><p className="host-list-note">{stays.data.total} reservas registradas en total.</p></> : <div className="host-stays-empty"><HostIcon name="booking" /><h3>Todo listo para recibir</h3><p>Las reservas de tus propiedades aparecerán aquí cuando se registren.</p></div>}<Link className="host-stays-all" to="/host/bookings">Consultar reservas →</Link></div><div className="host-calendar-note"><HostIcon name="calendar" /><div><h3>Tu calendario, bajo control</h3><p>Consulta fechas ocupadas y bloquea los días que necesites desde cada propiedad.</p><Link to="/host/operations">Gestionar disponibilidad <span aria-hidden="true">↗</span></Link></div></div></aside></div>
    <section className="host-bottom-banner"><span><HostIcon name="home" /></span><div><p className="host-eyebrow">CADA DETALLE CUENTA</p><h2>Tus alojamientos, siempre al día.</h2><p>Revisa el estado de tus propiedades y mantén actualizada su información antes de recibir nuevas estadías.</p></div><Link to="/host/properties">Ver mis propiedades <span aria-hidden="true">↗</span></Link></section>
    <footer className="host-dashboard-footer"><span>Hosteo · Tu espacio como anfitrión</span><Link to="/host/operations">Consultar resumen completo →</Link></footer>
  </main>
}
function HostStat({ label, value, icon, note }: { label: string; value: number; icon: IconName; note: string }) {
  return <article className={`host-stat host-stat-${icon}`}><div><h2>{label}</h2><span><HostIcon name={icon} /></span></div><strong>{String(value).padStart(2, '0')}</strong><p>{note}</p></article>
}
function HostPropertyCard({ property: p, index }: { property: HostProperty; index: number }) {
  return <article className="host-property-card"><div className={`host-property-art host-property-art-${index % 3}`}><HostPropertyArt /><span className="host-property-location">{p.district}</span><small>Ilustración referencial</small></div><div className="host-property-information"><div className="host-property-top"><span className={`host-state host-state-${p.status.toLowerCase()}`}><i aria-hidden="true" />{statusLabels[p.status]}</span><span>#{p.id}</span></div><p className="host-property-type">{typeLabels[p.type]} · {p.city}</p><h3>{p.title}</h3><p className="host-property-description">{p.description}</p><p className="host-property-capacity">{p.capacity} huéspedes <span>·</span> {p.bedrooms} {p.bedrooms === 1 ? 'habitación' : 'habitaciones'}</p><div className="host-property-actions"><div><small>POR NOCHE</small><strong>{money(p.nightlyRate, p.currency)}</strong></div><Link to={`/host/properties/${p.id}`}>{p.status === 'PUBLISHED' ? 'Gestionar' : 'Ver estado'} <span aria-hidden="true">↗</span></Link></div><p className="host-property-footnote">{statusDescriptions[p.status]}</p></div></article>
}
function HostStayCard({ booking: b }: { booking: Booking }) {
  const initials = b.guest.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('')
  const date = (value: string) => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
  return <article className="host-stay-card"><div className="host-stay-heading"><span className="host-stay-avatar" aria-hidden="true">{initials}</span><div><h3>{b.guest.name}</h3><p>{b.guestCount} {b.guestCount === 1 ? 'huésped' : 'huéspedes'}</p></div><span className={`host-state host-state-${b.status.toLowerCase()}`}>{bookingLabels[b.status]}</span></div><p className="host-stay-property">{b.propertyTitle}</p><p className="host-stay-dates"><HostIcon name="calendar" />{date(b.checkIn)} → {date(b.checkOut)}</p><div className="host-stay-footer"><span>Reserva #{b.id}</span><Link to={`/host/bookings/${b.id}`}>Ver detalle <span aria-hidden="true">↗</span></Link></div></article>
}
function HostError({ error, retry }: { error: Error; retry: () => void }) {
  return <div className="host-error" role="alert"><p>{error.message}</p><button onClick={retry}>Reintentar</button></div>
}
type IconName = 'home' | 'booking' | 'calendar' | 'lock' | 'add'
function HostIcon({ name }: { name: IconName }) {
  const paths = { home: 'm3 10 9-7 9 7v11H3V10Zm6 11v-8h6v8', booking: 'M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h3', calendar: 'M4 5h16v16H4V5Zm3-3v6m10-6v6M4 11h16m-12 4h2m4 0h2', lock: 'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4m-4 5v2', add: 'm3 10 9-7 9 7v11H3V10Zm6 5h6m-3-3v6' }
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
function HostPropertyArt() {
  return <svg viewBox="0 0 240 320" fill="none" aria-hidden="true"><path fill="var(--art-sky)" d="M0 0h240v320H0z" /><circle cx="184" cy="57" r="34" fill="#f1dfb8" /><path d="M0 252 65 200l76 52 99-80v148H0Z" fill="var(--art-land)" /><path d="M35 116h167v177H35z" fill="#fbf9ed" /><path d="M51 72h135v45H51z" fill="var(--art-wall)" /><path d="M30 115h178M47 72h143" stroke="var(--art-ink)" strokeWidth="6" strokeLinecap="round" /><path d="M57 140h45v50H57zm78 0h45v50h-45zM57 215h45v47H57z" fill="var(--art-glass)" /><path d="M131 212h52v81h-52z" fill="var(--art-wall)" /><path d="M79 140v50m-22-25h45m55-25v50m-22-25h45m-56-56v183" stroke="var(--art-ink)" opacity=".35" strokeWidth="2" /><path d="M15 293h210" stroke="var(--art-ink)" strokeWidth="2" opacity=".4" /><path d="M211 290v-46m0 20c-33-7-34-41-21-42 11-1 18 16 21 22 0-20 12-32 22-25 14 10 3 37-22 45Z" fill="var(--art-wall)" stroke="var(--art-ink)" strokeWidth="2" /></svg>
}
