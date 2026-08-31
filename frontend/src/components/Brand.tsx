import { Link } from 'react-router'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className={`brand${light ? ' brand--light' : ''}`} to="/" aria-label="Hosteo, ir al inicio">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      </span>
      <span>Hosteo</span>
    </Link>
  )
}
