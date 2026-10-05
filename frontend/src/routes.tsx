import { createBrowserRouter } from 'react-router'
import { ForgotPage } from './pages/AuthPages'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { HomeRedirect } from './pages/HomeRedirect'
import { StaffHomePage } from './pages/StaffHomePage'
import { CustomerHomePage } from './pages/CustomerHomePage'

export const router = createBrowserRouter([
  { path: '/', Component: HomeRedirect },
  { path: '/hosteo', Component: StaffHomePage },
  { path: '/profile', Component: ProfilePage },
  { path: '/home', Component: CustomerHomePage },
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/forgot-password', Component: ForgotPage },
])
