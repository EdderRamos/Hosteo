import type { PropertyPreview } from '../mocks/properties'

export function PropertyPreviewCard({ property, onPreview }: { property: PropertyPreview; onPreview: (property: PropertyPreview) => void }) {
  return <article className="customer-property">
    <div className="customer-property-image"><img src={property.photo} alt={property.name} loading="lazy" /><span className="customer-verified">◉ Verificado</span><span className="customer-district">{property.district}</span></div>
    <div className="customer-property-body"><h2>{property.name}</h2><p className="customer-property-meta"><span aria-hidden="true">♧</span> {property.guests} huéspedes <span>•</span> <span aria-hidden="true">▯</span> {property.bedrooms} dormitorio{property.bedrooms > 1 ? 's' : ''}</p>
      <div className="customer-property-bottom"><p><small>POR NOCHE</small><strong>${property.price}</strong> <span>USD</span></p><button className="customer-button" onClick={() => onPreview(property)} type="button">Ver disponibilidad</button></div>
    </div>
  </article>
}
