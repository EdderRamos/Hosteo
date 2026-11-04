import type { ReactNode } from 'react'
import './admin-review-notification.css'

export function InAppNotice({ title, label, eyebrow = 'HOSTEO · NOTIFICACIONES', unavailable = false, onClose, children }: {
  title: string; label: string; eyebrow?: string; unavailable?: boolean; onClose: () => void; children: ReactNode
}) {
  return <aside className={`admin-review-notice${unavailable ? ' admin-review-notice-unavailable' : ''}`} role="status" aria-live="polite" aria-atomic="true" aria-label={label}>
    <span className="admin-review-notice-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1" /></svg></span>
    <div className="admin-review-notice-content"><p className="admin-review-notice-eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</div>
    <button className="admin-review-notice-close" type="button" onClick={onClose} aria-label="Cerrar notificación"><svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
  </aside>
}
