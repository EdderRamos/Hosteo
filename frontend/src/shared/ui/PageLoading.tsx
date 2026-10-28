export function PageLoading({ label }: { label: string }) {
  return <div className="page-loading" role="status" aria-busy="true"><div className="page-loading-lines" aria-hidden="true">{[0, 1, 2, 3].map(line => <span className="page-loading-line" key={line} />)}</div><span className="page-loading-label">{label}</span></div>
}
