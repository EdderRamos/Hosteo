import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useSession } from '../auth/session'
import { loadPendingProperties } from '../properties/review-api'
import { InAppNotice } from './InAppNotice'

export function AdminReviewNotification() {
  const session = useSession()
  const { pathname } = useLocation()
  if (session?.user.roleCode !== 'ADMINISTRATOR' || !pathname.startsWith('/hosteo')) return null
  return <PendingReviewNotice key={session.accessToken} token={session.accessToken} />
}
function PendingReviewNotice({ token }: { token: string }) {
  const [dismissed, setDismissed] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['pending-properties', token, 0],
    queryFn: ({ signal }) => loadPendingProperties(token, 0, signal),
    refetchOnWindowFocus: false,
    retry: false,
  })
  // Dismissal applies to this snapshot, not to future requests or another login.
  const snapshot = query.data ? JSON.stringify([query.data.total, query.data.items.map(({ property }) => [property.id, property.version, property.submittedAt])]) : 'unavailable'
  if (query.isPending || dismissed === snapshot) return null
  const unavailable = query.isError
  if (!unavailable && !query.data.total) return null
  function dismiss() { setDismissed(snapshot) }
  return <InAppNotice title={unavailable ? 'No pudimos consultar las solicitudes' : 'Tienes propiedades por revisar'} label="Notificación de revisión de propiedades" eyebrow="CENTRO DE REVISIÓN" unavailable={unavailable} onClose={dismiss}>
    <p>{unavailable ? 'Intenta nuevamente para comprobar si hay propiedades pendientes de validación.' : query.data.total === 1 ? 'Hay 1 propiedad pendiente de validación. Revisa su información para decidir su publicación.' : `Hay ${query.data.total} propiedades pendientes de validación. Revisa su información para decidir su publicación.`}</p>
      {unavailable ? <button className="admin-review-notice-action" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? 'Consultando…' : 'Volver a consultar'}</button> : <Link className="admin-review-notice-action" to="/hosteo/properties/pending" onClick={dismiss}>Revisar solicitudes <span aria-hidden="true">↗</span></Link>}
  </InAppNotice>
}
