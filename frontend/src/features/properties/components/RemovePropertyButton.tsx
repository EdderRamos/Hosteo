import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../shared/api/http'
import { logout } from '../../auth/session'
import { previewPropertyRemoval, removeProperty, type RemovalPreview } from '../api'
import type { HostProperty } from '../schemas'
import '../../../styles/property-removal.css'

export function RemovePropertyButton({ token, property }: { token: string; property: HostProperty }) {
  const [open, setOpen] = useState(false)
  if (property.status === 'ARCHIVED') return null
  return <div className="property-removal"><button className="property-remove-trigger" type="button" onClick={() => setOpen(true)}>{property.status === 'DRAFT' ? 'Eliminar propiedad' : 'Archivar propiedad'}</button>{open && <RemovalDialog token={token} property={property} close={() => setOpen(false)} />}</div>
}
function RemovalDialog({ token, property, close }: { token: string; property: HostProperty; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const client = useQueryClient(); const navigate = useNavigate()
  const preview = useQuery({ queryKey: ['property-removal', token, property.id, property.version], queryFn: ({ signal }) => previewPropertyRemoval(token, property.id, signal), retry: false, refetchOnWindowFocus: false })
  const mutation = useMutation({ mutationFn: (value: RemovalPreview) => removeProperty(token, value), retry: false })
  useEffect(() => { const previous = document.activeElement; const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus() } }, [])
  async function confirm() {
    if (!preview.data || preview.data.version !== property.version || mutation.isPending) return
    try {
      const result = await mutation.mutateAsync(preview.data)
      navigate('/host/properties', { replace: true, state: { propertyRemoved: result.mode } })
      void Promise.all(['host-property', 'host-properties', 'host-review-results', 'operations', 'pending-properties'].map(key => client.invalidateQueries({ queryKey: [key] })))
      close()
    } catch (error) { if (error instanceof ApiError && error.status === 401) logout() }
  }
  const stale = preview.data && preview.data.version !== property.version
  const deleting = preview.data?.mode === 'DELETE'
  return <dialog className="property-removal-dialog" ref={ref} aria-labelledby="property-removal-title" aria-busy={mutation.isPending} onCancel={event => { event.preventDefault(); if (!mutation.isPending) close() }}>
    <p className="property-eyebrow">GESTIÓN DE TU PROPIEDAD</p><h2 id="property-removal-title">{preview.isSuccess ? deleting ? 'Eliminar definitivamente' : 'Archivar propiedad' : 'Retirar propiedad'}</h2><p className="property-removal-title">{property.title}</p>
    {preview.isPending ? <p role="status">Comprobando reservas e historial…</p> : preview.isError ? <div role="alert"><p>{preview.error.message}</p><button onClick={() => void preview.refetch()}>Reintentar</button></div> : stale ? <p role="alert">La propiedad cambió. Cierra esta ventana y actualiza sus datos antes de continuar.</p> : <><p>{deleting ? 'Este borrador no tiene reservas, bloqueos ni revisiones. Se eliminará definitivamente y no podrás recuperarlo.' : 'La propiedad se retirará del catálogo y de la bandeja de revisión. Su información, reservas, pagos y demás historial se conservarán.'}</p>{preview.data.hasBookings && <p className="property-removal-warning">Sus reservas existentes seguirán vigentes. Archivar no cancela estadías ni pagos.</p>}</>}
    {mutation.isError && <p className="property-error" role="alert">{mutation.error instanceof ApiError && mutation.error.status === 409 ? 'La propiedad o su historial cambiaron. Cierra esta ventana y actualiza los datos; no se aplicó la operación.' : mutation.error.message}</p>}
    <div className="property-removal-actions"><button disabled={mutation.isPending} onClick={() => { close(); void client.invalidateQueries({ queryKey: ['host-properties', token] }); void client.invalidateQueries({ queryKey: ['host-property', token] }) }}>Cancelar</button>{preview.isSuccess && !stale && <button className="property-remove-confirm" disabled={mutation.isPending || mutation.isError} onClick={() => void confirm()}>{mutation.isPending ? 'Guardando…' : deleting ? 'Eliminar definitivamente' : 'Confirmar archivado'}</button>}</div>
  </dialog>
}
