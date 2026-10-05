import type { PropertyPreview } from '../mocks/properties'

export function PropertyPreviewCard({ property, onPreview }: { property: PropertyPreview; onPreview: (property: PropertyPreview) => void }) {
  return <article className="guest-property">
    <div className="guest-property-image"><img src={property.photo} alt={property.name} loading="lazy" /><span className="guest-verified">◉ Verificado</span><span className="guest-district">{property.district}</span></div>
    <div className="guest-property-body"><h2>{property.name}</h2><p className="guest-property-meta"><span aria-hidden="true">♧</span> {property.guests} huéspedes <span>•</span> <span aria-hidden="true">▯</span> {property.bedrooms} dormitorio{property.bedrooms > 1 ? 's' : ''}</p>
      <div className="guest-property-bottom"><p><small>POR NOCHE</small><strong>${property.price}</strong> <span>USD</span></p><button className="guest-button" onClick={() => onPreview(property)} type="button">Ver disponibilidad</button></div>
    </div>
  </article>
}
