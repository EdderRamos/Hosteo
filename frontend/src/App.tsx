import { QueryProvider } from './app/QueryProvider'
import { RouterProvider } from 'react-router'
import { useEffect, useState } from 'react'
import { restoreSession } from './features/auth/session'
import { router } from './routes'
import { SessionShimmer } from './shared/ui/SessionShimmer'
import './styles/portal-theme.css'

function App() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    void restoreSession(controller.signal).finally(() => { if (!controller.signal.aborted) setReady(true) })
    const checkSession = () => {
      if (document.visibilityState === 'visible') void restoreSession(controller.signal)
    }
    document.addEventListener('visibilitychange', checkSession)
    window.addEventListener('storage', checkSession)
    return () => {
      controller.abort()
      document.removeEventListener('visibilitychange', checkSession)
      window.removeEventListener('storage', checkSession)
    }
  }, [])
  if (!ready) return <SessionShimmer />
  return <QueryProvider><RouterProvider router={router} /></QueryProvider>
}

export default App
