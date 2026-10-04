import { createBrowserRouter } from 'react-router'
import { SiteLayout } from './components/SiteLayout'
import { ForgotPage, RegisterPage } from './pages/AuthPages'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: SiteLayout,
    children: [{ index: true, Component: HomePage }],
  },
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/forgot-password', Component: ForgotPage },
])
