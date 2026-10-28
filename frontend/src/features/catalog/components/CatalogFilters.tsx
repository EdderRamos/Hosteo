import { useRef, useState, type FormEvent } from 'react'
import { typeLabels } from '../../properties/schemas'
import { catalogFilterKeys } from '../../operations/api'

export function CatalogFilters({ params, apply, total }: { params: URLSearchParams; apply: (params: URLSearchParams) => void; total?: number }) {
  const [error, setError] = useState('')
  const form = useRef<HTMLFormElement>(null)
  function quick(values: Record<string, string>) {
    if (!form.current) return
    for (const [name, value] of Object.entries(values)) {
      const field = form.current.elements.namedItem(name)
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = value
    }
    form.current.requestSubmit()
  }
  function chip(label: string, selected: boolean, values: Record<string, string>) {
    return <button type="button" className={`catalog-chip${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={() => quick(values)}>{label}</button>
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of catalogFilterKeys) { const value = String(data.get(key) ?? '').trim(); if (value) next.set(key, value) }
    if ((next.has('minPrice') || next.has('maxPrice')) && !next.has('currency')) { setError('Selecciona una moneda para comparar los precios por noche.'); return }
    if (next.has('minPrice') && next.has('maxPrice') && Number(next.get('minPrice')) > Number(next.get('maxPrice'))) { setError('El precio máximo debe ser igual o mayor al mínimo.'); return }
    setError(''); apply(next)
  }
  return <form ref={form} className="catalog-filters" onSubmit={submit} aria-label="Filtrar propiedades">
    <div className="catalog-filter-fields">
      <label className="catalog-destination"><span><FilterIcon kind="search" />Buscar alojamiento</span><input name="query" type="search" maxLength={100} placeholder="Nombre o descripción del alojamiento" defaultValue={params.get('query') ?? ''} /></label>
      <label><span><FilterIcon kind="home" />Tipo de alojamiento</span><select name="type" defaultValue={params.get('type') ?? ''}><option value="">Todos los tipos</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span><FilterIcon kind="price" />Moneda</span><select name="currency" defaultValue={params.get('currency') ?? ''}><option value="">Todas las monedas</option><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></label>
      <label><span><FilterIcon kind="people" />Huéspedes</span><input name="guests" type="number" min="1" max="2147483647" step="1" placeholder="Todos" defaultValue={params.get('guests') ?? ''} /></label>
      <button className="guest-button catalog-search" type="submit" aria-label="Buscar alojamientos"><FilterIcon kind="search" />Buscar</button>
    </div>
    <div className="catalog-filter-toolbar"><div className="catalog-quick-filters"><span className="catalog-filter-caption">FILTRAR POR:</span>
      <button type="button" className={`catalog-chip${!catalogFilterKeys.some(key => params.has(key)) ? ' is-selected' : ''}`} onClick={() => apply(new URLSearchParams())}>Todos</button>
      <span className="catalog-chip-divider" aria-hidden="true" />
      {chip('Hasta $100 / noche', params.get('currency') === 'USD' && params.get('maxPrice') === '100' && !params.get('minPrice'), { currency: 'USD', minPrice: '', maxPrice: '100' })}
      {chip('$100 – $180 / noche', params.get('currency') === 'USD' && params.get('minPrice') === '100' && params.get('maxPrice') === '180', { currency: 'USD', minPrice: '100', maxPrice: '180' })}
      {chip('$180+ / noche', params.get('currency') === 'USD' && params.get('minPrice') === '180' && !params.get('maxPrice'), { currency: 'USD', minPrice: '180', maxPrice: '' })}
      {chip('2+ Huéspedes', params.get('guests') === '2', { guests: '2' })}{chip('3+ Huéspedes', params.get('guests') === '3', { guests: '3' })}
    </div><div className="catalog-filter-summary"><span aria-live="polite">{total === undefined ? 'Consultando alojamientos…' : `${total} ${total === 1 ? 'alojamiento' : 'alojamientos'} verificados`}</span><button className="catalog-clear" type="button" onClick={() => apply(new URLSearchParams())}><span aria-hidden="true">↻</span>Limpiar filtros</button></div></div>
    <details className="catalog-custom-price"><summary>Personalizar rango de precio</summary><div>
      <label>Precio mínimo / noche<input name="minPrice" type="number" min="0" max="9999999999.99" step="0.01" placeholder="Sin mínimo" defaultValue={params.get('minPrice') ?? ''} /></label>
      <label>Precio máximo / noche<input name="maxPrice" type="number" min="0" max="9999999999.99" step="0.01" placeholder="Sin máximo" defaultValue={params.get('maxPrice') ?? ''} /></label>
    </div></details>{error && <p className="catalog-filter-error" role="alert">{error}</p>}
  </form>
}

function FilterIcon({ kind }: { kind: 'pin' | 'home' | 'price' | 'people' | 'search' }) {
  const paths = { pin: 'M12 21s7-6.2 7-13A7 7 0 0 0 5 8c0 6.8 7 13 7 13ZM12 6v4', home: 'm3 10 9-7 9 7v11H3V10Zm6 11v-8h6v8', price: 'M3 5h18v14H3V5Zm9 3v8m3-6c-1-2-6-2-6 0s6 2 6 4-5 2-6 0', people: 'M15 21v-3c0-4-12-4-12 0v3m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7c5 0 5 7 0 7m1 3c4 0 4 3 4 6', search: 'm16 16 5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z' }
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>
}
