import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../shared/api/http'
import { logout } from '../../auth/session'
import { decideProperty } from '../review-api'
import { reviewDecisionSchema, type ReviewDecisionValues, type HostProperty } from '../schemas'

export function PropertyDecisionPanel({ token, property, onDecided, onReload }: { token: string; property: HostProperty; onDecided: (saved: HostProperty) => void; onReload: () => void }) {
  const [decision, setDecision] = useState<ReviewDecisionValues['decision'] | null>(null)
  const approve = useRef<HTMLButtonElement>(null)
  const reject = useRef<HTMLButtonElement>(null)
  const lastDecision = useRef<ReviewDecisionValues['decision'] | null>(null)
  useEffect(() => { if (!decision && lastDecision.current) (lastDecision.current === 'APPROVED' ? approve.current : reject.current)?.focus() }, [decision])
  return <section className="staff-panel review-decision-panel"><h2>Decisión de publicación</h2><p>Aprueba la información para publicar el alojamiento o indica por qué se rechaza.</p>{!decision ? <div className="review-decision-actions"><button className="staff-primary" ref={approve} onClick={() => { lastDecision.current = 'APPROVED'; setDecision('APPROVED') }}>Aprobar propiedad</button><button className="staff-danger" ref={reject} onClick={() => { lastDecision.current = 'REJECTED'; setDecision('REJECTED') }}>Rechazar propiedad</button></div> : <DecisionForm token={token} property={property} decision={decision} onDecided={onDecided} onReload={onReload} cancel={() => setDecision(null)} />}</section>
}
function DecisionForm({ token, property, decision, onDecided, onReload, cancel }: { token: string; property: HostProperty; decision: ReviewDecisionValues['decision']; onDecided: (saved: HostProperty) => void; onReload: () => void; cancel: () => void }) {
  const focus = useRef<HTMLDivElement>(null)
  const client = useQueryClient()
  const [conflict, setConflict] = useState(false)
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<{ comment: string }>({ defaultValues: { comment: '' } })
  const mutation = useMutation({ mutationFn: (values: ReviewDecisionValues) => decideProperty(token, property.id, property.version, values), retry: false })
  useEffect(() => { focus.current?.focus() }, [])
  async function submit(input: { comment: string }) {
    if (conflict) return
    clearErrors()
    const parsed = reviewDecisionSchema.safeParse({ ...input, decision })
    if (!parsed.success) { setError('comment', { message: parsed.error.issues[0].message }, { shouldFocus: true }); return }
    try {
      const saved = await mutation.mutateAsync(parsed.data)
      onDecided(saved)
      await Promise.all([client.invalidateQueries({ queryKey: ['pending-properties', token] }), client.invalidateQueries({ queryKey: ['host-properties'] }), client.invalidateQueries({ queryKey: ['host-property'] })])
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { logout(); return }
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) setConflict(true)
      setError('root', { message: error instanceof ApiError && error.status === 409 ? 'Otra sesión cambió esta propiedad o ya tomó una decisión. Actualiza el expediente antes de continuar.' : error instanceof ApiError && error.status === 404 ? 'La propiedad ya no está disponible. Actualiza el expediente.' : error instanceof ApiError && error.status === 403 ? 'Tu cuenta ya no tiene permiso para decidir sobre esta propiedad.' : error instanceof ApiError && error.status === 400 ? 'Revisa el motivo y la información del expediente antes de continuar.' : error instanceof Error ? error.message : 'No pudimos registrar la decisión.' })
    }
  }
  return <div className="review-decision-confirmation" ref={focus} tabIndex={-1} role="region" aria-label="Confirmar decisión de publicación" onKeyDown={event => { if (event.key === 'Escape' && !isSubmitting) cancel() }}><h3>{decision === 'APPROVED' ? 'Confirmar aprobación' : 'Confirmar rechazo'}</h3><p><strong>{property.title}</strong>: {decision === 'APPROVED' ? 'el alojamiento quedará publicado.' : 'el alojamiento no se publicará y el anfitrión podrá corregirlo y enviarlo nuevamente.'}</p><form noValidate onSubmit={handleSubmit(submit)} aria-busy={isSubmitting}><fieldset disabled={isSubmitting}><label htmlFor="review-comment">{decision === 'REJECTED' ? 'Motivo del rechazo' : 'Comentario para el anfitrión (opcional)'}</label><textarea id="review-comment" rows={4} maxLength={1000} required={decision === 'REJECTED'} {...register('comment')} aria-invalid={Boolean(errors.comment)} aria-describedby={errors.comment ? 'review-comment-error' : undefined} />{errors.comment && <p className="review-field-error" role="alert" id="review-comment-error">{errors.comment.message}</p>}{errors.root && <p className="review-field-error" role="alert">{errors.root.message}</p>}<div className="review-decision-actions"><button type="button" onClick={cancel}>Cancelar</button>{conflict ? <button type="button" onClick={onReload}>Actualizar expediente</button> : <button className={decision === 'APPROVED' ? 'staff-primary' : 'staff-danger'} disabled={isSubmitting}>{isSubmitting ? 'Guardando decisión…' : decision === 'APPROVED' ? 'Confirmar aprobación' : 'Confirmar rechazo'}</button>}</div></fieldset></form></div>
}
