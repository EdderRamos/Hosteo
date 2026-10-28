import { Link, useRouteError } from 'react-router'
export function RouteErrorPage() {
 const error = useRouteError()
 const missing = !error || typeof error === 'object' && error !== null && 'status' in error && error.status === 404
 return <main className="route-error-page"><h1>{missing ? 'Página no encontrada' : 'No pudimos mostrar esta página'}</h1><p>{missing ? 'Comprueba la dirección o vuelve al inicio para encontrar la sección.' : 'Vuelve a cargar la página. Si el problema continúa, regresa al inicio e inténtalo nuevamente.'}</p><button onClick={() => window.location.reload()}>Volver a cargar</button><p><Link to="/">Ir al inicio</Link></p></main>
}
