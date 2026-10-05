import { Navigate } from 'react-router'
import { useSession } from '../features/auth/session'

export function HomeRedirect() {
  const session = useSession()
  return <Navigate to={['ADMINISTRATOR', 'SUPPORT'].includes(session?.user.roleCode ?? '') ? '/hosteo' : '/home'} replace />
}

