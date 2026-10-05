import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import * as api from './api'
import { time, usePage } from './hooks'
import { Heading, ErrorBox, Pagination } from './ui'
export function PaymentList({ token }: { token: string }) {
  const { page, change } = usePage()
  const query = useQuery({ queryKey: ['operations', 'payments', token, page], queryFn: ({ signal }) => api.payments(token, page, signal) })
  return <><Heading text="Pagos registrados" note="Pagos exclusivamente simulados, sin cargos ni información bancaria." /><button disabled={query.isFetching} onClick={() => void query.refetch()}>Actualizar pagos</button>{query.isPending ? <p role="status">Consultando pagos…</p> : query.isError ? <ErrorBox error={query.error} retry={() => void query.refetch()} /> : <><p>{query.data.total} pagos simulados</p>{!query.data.items.length && <section className="ops-panel"><p>No hay pagos registrados en esta página.</p>{page > 0 && <button onClick={() => change(0)}>Ir a la primera página</button>}</section>}<div className="ops-grid">{query.data.items.map(item => <article className="ops-panel" key={item.payment.id}><h2>{item.propertyTitle}</h2><p>{item.guest.name} · {item.guest.email}</p><p className="ops-success">{api.paymentLabels[item.payment.status]} · {api.money(item.payment.amount, item.payment.currency)}</p><p>Registrado: {time(item.payment.processedAt)}</p><p className="ops-confirmation-code">Referencia: {item.payment.reference}</p><Link to={`/hosteo/bookings/${item.payment.bookingId}`}>Ver reserva #{item.payment.bookingId} →</Link></article>)}</div><Pagination page={page} pages={query.data.pages} change={change} busy={query.isFetching} /></>}</>
}
