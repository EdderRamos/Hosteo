import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../auth/session'
import { loadReviewResults } from './review-results'
import { InAppNotice } from './InAppNotice'

export function HostReviewNotification() {
  const session = useSession()
  if (session?.user.roleCode !== 'HOST') return null
  return <HostReviewResults key={session.accessToken} token={session.accessToken} />
}
function HostReviewResults({ token }: { token: string }) {
  const [dismissed, setDismissed] = useState<string | null>(null)
  const query = useQuery({ queryKey: ['host-review-results', token], queryFn: ({ signal }) => loadReviewResults(token, signal), retry: false, refetchOnWindowFocus: false })
  const snapshot = query.data ? JSON.stringify(query.data.map(p => [p.id, p.status, p.reviewedAt, p.reviewComment])) : 'unavailable'
  if (query.isPending || dismissed === snapshot || (query.isSuccess && query.data.length === 0)) return null
  const unavailable = query.isError
  return <InAppNotice title={unavailable ? 'No pudimos consultar tus revisiones' : 'Hay resultados de tus propiedades'} label="Notificación de resultados de revisión" eyebrow="TUS PROPIEDADES" unavailable={unavailable} onClose={() => setDismissed(snapshot)}>
    {unavailable ? <><p>Vuelve a consultar para conocer si tus propiedades fueron aprobadas o requieren correcciones.</p><button className="admin-review-notice-action" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? 'Consultando…' : 'Volver a consultar'}</button></> : <>
      <p>Consulta las decisiones del administrador sobre tus propiedades.</p>
      <ul className="review-result-list">{query.data.slice(0, 2).map(p => <li key={p.id}><strong>{p.title}</strong><span className={p.status === 'REJECTED' ? 'review-result-rejected' : 'review-result-published'}>{p.status === 'PUBLISHED' ? 'Aprobada y publicada' : 'Rechazada · Requiere corrección'}</span>{p.status === 'REJECTED' && p.reviewComment && <p>{p.reviewComment.length > 140 ? `${p.reviewComment.slice(0, 140)}…` : p.reviewComment}</p>}<Link to={`/host/properties/${p.id}`} onClick={() => setDismissed(snapshot)}>{p.status === 'REJECTED' ? 'Ver motivo y corregir' : 'Consultar propiedad'} <span aria-hidden="true">↗</span></Link></li>)}</ul>
      {query.data.length > 2 && <p>Hay {query.data.length} propiedades con una decisión de revisión.</p>}
      <Link className="admin-review-notice-action" to="/host/properties" onClick={() => setDismissed(snapshot)}>Ver mis propiedades <span aria-hidden="true">↗</span></Link>
    </>}
  </InAppNotice>
}
