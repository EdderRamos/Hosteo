import { lazy, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useSession } from '../features/auth/session'

const AdminReviewNotification = lazy(() => import('../features/notifications/AdminReviewNotification').then(module => ({ default: module.AdminReviewNotification })))

const HostReviewNotification = lazy(() => import('../features/notifications/HostReviewNotification').then(module => ({ default: module.HostReviewNotification })))

export function ApplicationLayout() {
  const session = useSession()
  const { pathname } = useLocation()
  return <><Outlet />{session?.user.roleCode === 'ADMINISTRATOR' && pathname.startsWith('/hosteo') && <Suspense fallback={null}><AdminReviewNotification /></Suspense>}{session?.user.roleCode === 'HOST' && (pathname === '/host' || pathname.startsWith('/host/')) && <Suspense fallback={null}><HostReviewNotification /></Suspense>}</>
}
