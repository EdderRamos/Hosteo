import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo electrónico').max(254, 'El correo es demasiado largo').email('Ingresa un correo electrónico válido'),
  password: z.string().min(1, 'Ingresa tu contraseña').max(72, 'La contraseña no debe superar los 72 caracteres'),
  remember: z.boolean(),
})
export type LoginValues = z.infer<typeof loginSchema>
export const userSchema = z.object({ id: z.number(), email: z.string(), firstName: z.string(), lastName: z.string(), roleId: z.number() })
export const loginResponseSchema = z.object({ accessToken: z.string().min(1), user: userSchema })
export type AuthUser = z.infer<typeof userSchema>
