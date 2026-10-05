import { createBrowserRouter } from 'react-router'
import { ForgotPage } from './pages/AuthPages'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { HomeRedirect } from './pages/HomeRedirect'
import { StaffHomePage } from './pages/StaffHomePage'
import { HostHomePage } from './pages/HostHomePage'
import { GuestHomePage } from './pages/GuestHomePage'

export const router = createBrowserRouter([
  { path: '/', Component: HomeRedirect },
  { path: '/hosteo', Component: StaffHomePage },
  { path: '/profile', Component: ProfilePage },
  { path: '/home', Component: HomeRedirect },
  { path: '/guest', Component: GuestHomePage },
  { path: '/host', Component: HostHomePage },
  { path: '/host/properties/new', lazy: async () => ({ Component: (await import('./pages/HostPropertyPages')).RegisterPropertyPage }) },
  { path: '/host/properties/:id', lazy: async () => ({ Component: (await import('./pages/HostPropertyPages')).PropertyConfirmationPage }) },
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/forgot-password', Component: ForgotPage },
])
