import { useState, type FormEvent } from 'react'
import { typeLabels } from '../../properties/schemas'
import { catalogFilterKeys } from '../../operations/api'

export function CatalogFilters({ params, apply }: { params: URLSearchParams; apply: (params: URLSearchParams) => void }) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of catalogFilterKeys) { const value = String(data.get(key) ?? '').trim(); if (value) next.set(key, value) }
    if ((next.has('minPrice') || next.has('maxPrice')) && !next.has('currency')) { setError('Selecciona una moneda para comparar los precios por noche.'); return }
    if (next.has('minPrice') && next.has('maxPrice') && Number(next.get('minPrice')) > Number(next.get('maxPrice'))) { setError('El precio máximo debe ser igual o mayor al mínimo.'); return }
    setError(''); apply(next)
  }
  const active = catalogFilterKeys.some(key => params.has(key))
  return <form className="catalog-filters" onSubmit={submit} aria-label="Filtrar propiedades">
    <div className="catalog-filter-title"><div><h2>Encuentra tu alojamiento</h2><p>Filtra según tu destino, grupo y presupuesto.</p></div>{active && <button className="catalog-clear" type="button" onClick={() => apply(new URLSearchParams())}>Limpiar filtros</button>}</div>
    <div className="catalog-filter-fields">
      <label>Distrito<input name="district" maxLength={100} placeholder="Ej. Miraflores" defaultValue={params.get('district') ?? ''} /></label>
      <label>Tipo de alojamiento<select name="type" defaultValue={params.get('type') ?? ''}><option value="">Todos los tipos</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Huéspedes<input name="guests" type="number" min="1" max="2147483647" step="1" placeholder="Cualquier capacidad" defaultValue={params.get('guests') ?? ''} /></label>
      <label>Moneda<select name="currency" defaultValue={params.get('currency') ?? ''}><option value="">Todas las monedas</option><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></label>
      <label>Precio mínimo / noche<input name="minPrice" type="number" min="0" max="9999999999.99" step="0.01" placeholder="Sin mínimo" defaultValue={params.get('minPrice') ?? ''} /></label>
      <label>Precio máximo / noche<input name="maxPrice" type="number" min="0" max="9999999999.99" step="0.01" placeholder="Sin máximo" defaultValue={params.get('maxPrice') ?? ''} /></label>
      <button className="guest-button catalog-search" type="submit">Buscar alojamientos <span aria-hidden="true">↗</span></button>
    </div>{error && <p className="catalog-filter-error" role="alert">{error}</p>}
  </form>
}
