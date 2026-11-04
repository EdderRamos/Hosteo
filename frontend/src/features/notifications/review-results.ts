import { loadProperties } from '../properties/api'
import type { HostProperty } from '../properties/schemas'

export async function loadReviewResults(token: string, signal?: AbortSignal) {
  const first = await loadProperties(token, 0, signal)
  const reviewed: HostProperty[] = []
  function collect(items: HostProperty[]) { reviewed.push(...items.filter(p => !!p.reviewedAt && (p.status === 'PUBLISHED' || p.status === 'REJECTED'))) }
  collect(first.items)
  // A reviewed property can be older than the first page of registrations.
  for (let page = 1; page < first.pages; page++) collect((await loadProperties(token, page, signal)).items)
  return reviewed.sort((a, b) => Date.parse(b.reviewedAt!) - Date.parse(a.reviewedAt!) || b.id - a.id)
}
