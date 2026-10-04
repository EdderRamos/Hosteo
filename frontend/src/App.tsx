import { RouterProvider } from 'react-router'
import { useEffect } from 'react'
import { restoreSession } from './features/auth/session'
import { router } from './routes'

function App() {
  useEffect(() => {
    const controller = new AbortController()
    void restoreSession(controller.signal)
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
  return <RouterProvider router={router} />
}

export default App
