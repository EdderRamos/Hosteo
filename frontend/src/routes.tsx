import { createBrowserRouter } from 'react-router'
import { ForgotPage } from './pages/AuthPages'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { HomeRedirect } from './pages/HomeRedirect'
import { StaffHomePage } from './pages/StaffHomePage'
import { HostHomePage } from './pages/HostHomePage'

export const router = createBrowserRouter([
  { path: '/guest/properties/:id', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).GuestPropertyBookingPage }) },
  { path: '/guest/bookings', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).GuestBookingsPage }) },
  { path: '/guest/bookings/:id', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).GuestBookingDetailPage }) },
  { path: '/host/bookings', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).HostBookingsPage }) },
  { path: '/host/bookings/:id', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).HostBookingDetailPage }) },
  { path: '/host/operations', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).HostOperationsPage }) },
  { path: '/host/properties/:id/calendar', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).HostCalendarPage }) },
  { path: '/hosteo/bookings', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).AdminBookingsPage }) },
  { path: '/hosteo/bookings/:id', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).AdminBookingDetailPage }) },
  { path: '/hosteo/operations', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).AdminOperationsPage }) },
  { path: '/hosteo/properties/:id/calendar', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).AdminCalendarPage }) },
  { path: '/hosteo/payments', lazy: async () => ({ Component: (await import('./pages/OperationsPages')).AdminPaymentsPage }) },
  { path: '/', Component: HomeRedirect },
  { path: '/hosteo/properties/pending', lazy: async () => ({ Component: (await import('./pages/PropertyReviewPages')).PendingPropertiesPage }) },
  { path: '/hosteo/properties/pending/:id', lazy: async () => ({ Component: (await import('./pages/PropertyReviewPages')).PendingPropertyDetailPage }) },
  { path: '/hosteo', Component: StaffHomePage },
  { path: '/profile', Component: ProfilePage },
  { path: '/home', Component: HomeRedirect },
  { path: '/guest', lazy: async () => ({ Component: (await import('./pages/GuestHomePage')).GuestHomePage }) },
  { path: '/host', Component: HostHomePage },
  { path: '/host/properties', lazy: async () => ({ Component: (await import('./pages/HostPropertyPages')).HostPropertiesPage }) },
  { path: '/host/properties/new', lazy: async () => ({ Component: (await import('./pages/HostPropertyPages')).RegisterPropertyPage }) },
  { path: '/host/properties/:id/edit', lazy: async () => ({ Component: (await import('./pages/HostPropertyPages')).EditPropertyPage }) },
  { path: '/host/properties/:id', lazy: async () => ({ Component: (await import('./pages/HostPropertyPages')).PropertyConfirmationPage }) },
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/forgot-password', Component: ForgotPage },
])
