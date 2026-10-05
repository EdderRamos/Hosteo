import { useEffect, useRef, type ReactNode } from 'react'

export function PreviewDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close() }, [])
  return <dialog ref={ref} className="customer-dialog" aria-labelledby="preview-dialog-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <button className="customer-dialog-close" onClick={onClose} type="button" aria-label="Cerrar ventana">×</button>
    <h2 id="preview-dialog-title">{title}</h2>{children}
    <button className="customer-button" onClick={onClose} type="button">Entendido</button>
  </dialog>
}
