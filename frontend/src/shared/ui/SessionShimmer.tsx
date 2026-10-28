import logo from '../../assets/hosteo-logo.png'
import '../../styles/session-shimmer.css'

export function SessionShimmer() {
  return <div className="session-shimmer" role="status" aria-label="Cargando tu sesión" aria-busy="true"><div aria-hidden="true"><header className="session-shimmer-header"><img src={logo} width="151" height="40" alt="" /><div className="shimmer-block shimmer-nav" /><div className="shimmer-block shimmer-account" /></header><div className="session-shimmer-content"><div className="shimmer-block shimmer-eyebrow" /><div className="shimmer-block shimmer-heading" /><div className="shimmer-block shimmer-copy" /><div className="shimmer-block shimmer-search" /><div className="session-shimmer-grid">{[0, 1, 2].map(value => <div className="shimmer-card" key={value}><div className="shimmer-block shimmer-picture" /><div className="shimmer-card-body"><div className="shimmer-block shimmer-line" /><div className="shimmer-block shimmer-line-short" /><div className="shimmer-block shimmer-button" /></div></div>)}</div></div></div></div>
}
