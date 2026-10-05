import { useState, type FormEvent } from 'react'
import { properties, type PropertyPreview } from '../mocks/properties'
import { PropertyPreviewCard } from './PropertyPreviewCard'
import { PreviewDialog } from '../../../shared/ui/PreviewDialog'

type PriceFilter = 'all' | 'low' | 'middle' | 'high'
type CapacityFilter = 'all' | 'small' | 'large'
const districts = ['Todos', 'Miraflores', 'San Isidro', 'Barranco'] as const
export function GuestCatalog() {
  const [destination, setDestination] = useState('Todos')
  const [district, setDistrict] = useState('Todos')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [guests, setGuests] = useState('2')
  const [requestedGuests, setRequestedGuests] = useState(0)
  const [price, setPrice] = useState<PriceFilter>('all')
  const [capacity, setCapacity] = useState<CapacityFilter>('all')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<PropertyPreview | null>(null)
  const visible = properties.filter(property => (district === 'Todos' || property.district === district)
    && (price === 'all' || (price === 'low' && property.price <= 100) || (price === 'middle' && property.price > 100 && property.price <= 180) || (price === 'high' && property.price > 180))
    && (capacity === 'all' || (capacity === 'small' && property.guests <= 2) || (capacity === 'large' && property.guests >= 3)) && property.guests >= requestedGuests)

  function clear() { setDistrict('Todos'); setDestination('Todos'); setPrice('all'); setCapacity('all'); setRequestedGuests(0); setGuests('2'); setArrival(''); setDeparture(''); setFeedback(''); setError('') }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if ((arrival && !departure) || (!arrival && departure)) { setError('Selecciona las fechas de llegada y salida.'); return }
    if (arrival && departure <= arrival) { setError('La salida debe ser posterior a la llegada.'); return }
    setDistrict(destination); setRequestedGuests(Number(guests))
    setFeedback(arrival ? 'Filtros aplicados. La disponibilidad para estas fechas todavía no está conectada.' : 'Filtros aplicados a los alojamientos de ejemplo.')
  }
  return <>
    <form className="guest-search" onSubmit={search} noValidate>
      <div><label htmlFor="guest-destination">⌖ Destino en Lima</label><select id="guest-destination" value={destination} onChange={event => setDestination(event.target.value)}><option value="Todos">Todos los distritos principales</option>{districts.slice(1).map(value => <option key={value}>{value}</option>)}</select></div>
      <div><label htmlFor="guest-arrival">▦ Llegada</label><input id="guest-arrival" type="date" value={arrival} onChange={event => { setArrival(event.target.value); setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'guest-search-error' : undefined} /></div>
      <div><label htmlFor="guest-departure">▦ Salida</label><input id="guest-departure" type="date" value={departure} min={arrival || undefined} onChange={event => { setDeparture(event.target.value); setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'guest-search-error' : undefined} /></div>
      <div><label htmlFor="guest-guests">♧ Huéspedes</label><select id="guest-guests" value={guests} onChange={event => setGuests(event.target.value)}>{[1,2,3,4,5,6].map(count => <option key={count} value={count}>{count} Huésped{count > 1 ? 'es' : ''}</option>)}</select></div>
      <button className="guest-button guest-search-button" type="submit"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></svg>Buscar</button>
      {error && <p id="guest-search-error" className="guest-search-error" role="alert">{error}</p>}
    </form>
    <div className="guest-filters"><div className="guest-filter-buttons"><span>FILTRAR POR:</span>{districts.map(value => <button key={value} type="button" aria-pressed={district === value} onClick={() => { setDistrict(value); setDestination(value) }}>{value}</button>)}<i aria-hidden="true" />
      {([{ value: 'low', label: 'Hasta $100 / noche' }, { value: 'middle', label: '$100 - $180 / noche' }, { value: 'high', label: '$180+ / noche' }] as const).map(item => <button key={item.value} type="button" aria-pressed={price === item.value} onClick={() => setPrice(price === item.value ? 'all' : item.value)}>{item.label}</button>)}
      {([{ value: 'small', label: '1-2 Huéspedes' }, { value: 'large', label: '3+ Huéspedes' }] as const).map(item => <button key={item.value} type="button" aria-pressed={capacity === item.value} onClick={() => setCapacity(capacity === item.value ? 'all' : item.value)}>{item.label}</button>)}
    </div><p aria-live="polite">{visible.length} alojamiento{visible.length !== 1 ? 's' : ''}<br />de ejemplo</p><button className="guest-clear" type="button" onClick={clear}><span aria-hidden="true">↻</span> <span>Limpiar filtros</span></button></div>
    {feedback && <p className="guest-feedback" role="status">{feedback}</p>}
    <div className="guest-property-grid" id="guest-properties">{visible.map(property => <PropertyPreviewCard key={property.id} property={property} onPreview={setSelected} />)}</div>
    {!visible.length && <div className="guest-empty"><h2>No encontramos alojamientos con esos filtros</h2><p>Prueba otro distrito, rango de precio o número de huéspedes.</p><button className="guest-button" type="button" onClick={clear}>Mostrar todos</button></div>}
    {selected && <PreviewDialog title={selected.name} onClose={() => setSelected(null)}><img src={selected.photo} alt={selected.name} /><p>{selected.district} · {selected.guests} huéspedes · ${selected.price} USD por noche</p><p>Esta es una vista de ejemplo. La disponibilidad y las reservas todavía no están conectadas; no se ha creado ninguna reserva.</p>{arrival && departure && <p>Fechas seleccionadas: {arrival} → {departure}</p>}</PreviewDialog>}
  </>
}
