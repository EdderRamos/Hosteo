import { Link } from 'react-router'
import logo from '../assets/hosteo-logo.png'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className={`brand${light ? ' brand--light' : ''}`} to="/" aria-label="Hosteo, ir al inicio">
      <img className="brand__logo" src={logo} width="151" height="40" alt="Hosteo" />
    </Link>
  )
}
