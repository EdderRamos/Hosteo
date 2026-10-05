import { createBrowserRouter, Navigate } from 'react-router'
import { ForgotPage } from './pages/AuthPages'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { CustomerHomePage } from './pages/CustomerHomePage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/home" replace /> },
  { path: '/home', Component: CustomerHomePage },
  { path: '/login', Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/forgot-password', Component: ForgotPage },
])
