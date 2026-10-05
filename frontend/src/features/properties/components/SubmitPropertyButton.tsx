import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../shared/api/http'
import { logout } from '../../auth/session'
import { submitProperty } from '../api'
import type { HostProperty } from '../schemas'

export function SubmitPropertyButton({ token, property }: { token: string; property: HostProperty }) {
  const client = useQueryClient()
  const trigger = useRef<HTMLButtonElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [conflict, setConflict] = useState(false)
  const [sentVersion, setSentVersion] = useState<number | null>(null)
  const mutation = useMutation({ mutationFn: () => submitProperty(token, property.id, property.version), retry: false })
  useEffect(() => { if (open) confirm.current?.focus() }, [open])
  const allowed = property.status === 'DRAFT' || property.status === 'REJECTED'
  function close() { if (!mutation.isPending) { setOpen(false); trigger.current?.focus() } }
  async function submit() {
    if (mutation.isPending || conflict) return
    setMessage('')
    try {
      const saved = await mutation.mutateAsync()
      setSentVersion(property.version); setOpen(false)
      client.setQueryData(['host-property', token, String(saved.id)], saved)
      await client.invalidateQueries({ queryKey: ['host-properties', token] })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { logout(); return }
      if (error instanceof ApiError && error.status === 409) {
        setConflict(true)
        setMessage('La propiedad cambió o ya no admite el envío. Actualiza su estado antes de continuar.')
      } else if (error instanceof ApiError && error.status === 400) {
        setMessage('Completa la información principal de la propiedad antes de enviarla a validación.')
      } else if (error instanceof ApiError && error.status === 404) {
        setConflict(true); setMessage('No encontramos esta propiedad en tu cuenta. Actualiza el listado.')
      } else setMessage(error instanceof Error ? error.message : 'No pudimos enviar la propiedad. Intenta nuevamente.')
    }
  }
  async function refresh() {
    await Promise.all([client.invalidateQueries({ queryKey: ['host-property', token, String(property.id)] }), client.invalidateQueries({ queryKey: ['host-properties', token] })])
    setOpen(false); setMessage(''); setConflict(false)
  }
  return <div className="property-submission">
    {sentVersion !== null && property.status === 'PENDING_REVIEW' && <p role="status" className="property-submission-success">Solicitud enviada. Tu propiedad está pendiente de revisión; todavía no está publicada.</p>}
    {allowed && sentVersion !== property.version && <button className="property-primary" ref={trigger} disabled={mutation.isPending} onClick={() => { setOpen(true); setMessage('') }}>Enviar a validación</button>}
    {open && allowed && <section className="property-submit-confirmation" role="region" aria-label={`Confirmar envío de ${property.title}`} onKeyDown={event => { if (event.key === 'Escape') close() }}>
      <h3>¿Enviar a validación?</h3><p><strong>{property.title}</strong> pasará a revisión del administrador. El envío solicita su publicación; todavía no aparecerá en el catálogo.</p><p>No podrás editarla mientras esté pendiente de revisión.</p>
      {message && <p className="property-error" role="alert">{message}</p>}
      <div><button disabled={mutation.isPending} onClick={close}>Cancelar</button>{conflict ? <button onClick={() => void refresh()}>Actualizar estado</button> : <button className="property-primary" ref={confirm} disabled={mutation.isPending} onClick={() => void submit()}>{mutation.isPending ? 'Enviando…' : 'Confirmar envío'}</button>}</div>
    </section>}
  </div>
}
