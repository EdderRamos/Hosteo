import { homePath } from '../shared/auth/roles'
import { Navigate } from 'react-router'
import { useSession } from '../features/auth/session'

export function HomeRedirect() {
  const session = useSession()
  return <Navigate to={homePath(session?.user.roleCode)} replace />
}

