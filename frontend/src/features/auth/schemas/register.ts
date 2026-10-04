import { z } from 'zod'

export const passwordRequirements = [
  { label: 'Mínimo 8 caracteres', check: (value: string) => value.length >= 8 },
  { label: 'Al menos un número', check: (value: string) => /[0-9]/.test(value) },
  { label: 'Al menos una mayúscula', check: (value: string) => /[A-Z]/.test(value) },
]

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa tus nombres').max(100, 'Usa como máximo 100 caracteres'),
  lastName: z.string().trim().min(1, 'Ingresa tus apellidos').max(100, 'Usa como máximo 100 caracteres'),
  email: z.string().trim().min(1, 'Ingresa tu correo electrónico').max(254, 'El correo es demasiado largo').email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'Usa al menos 8 caracteres').max(72, 'La contraseña es demasiado larga')
    .refine(value => new TextEncoder().encode(value).length <= 72, 'La contraseña no debe superar los 72 bytes')
    .regex(/[0-9]/, 'Incluye al menos un número').regex(/[A-Z]/, 'Incluye al menos una mayúscula'),
  confirmation: z.string().min(1, 'Confirma tu contraseña'),
}).superRefine((values, context) => {
  if (values.password !== values.confirmation) context.addIssue({ code: 'custom', path: ['confirmation'], message: 'Las contraseñas no coinciden' })
})

export type RegisterValues = z.infer<typeof registerSchema>
export const registrationFields = ['firstName', 'lastName', 'email', 'password', 'confirmation'] as const
