import { expect, test } from 'vitest'
import { registerSchema } from './register'

const valid = { firstName: 'Camila', lastName: 'Salazar', email: 'guest@hosteo.pe', password: 'Hosteo2026*', confirmation: 'Hosteo2026*' }
test('trims names without requiring document data', () => {
  const parsed = registerSchema.parse({ ...valid, firstName: ' Camila ', lastName: ' Salazar ' })
  expect(parsed.firstName).toBe('Camila')
})
test('enforces BCrypt UTF-8 byte limit for multibyte passwords', () => {
  const password = 'A1' + 'é'.repeat(36)
  const parsed = registerSchema.safeParse({ ...valid, password, confirmation: password })
  expect(parsed.success).toBe(false)
  if (!parsed.success) expect(parsed.error.issues.some(issue => issue.message.includes('72 bytes'))).toBe(true)
})
test.each(['abcdefghi', 'abcdef123', 'ABCDEFGHI'])('rejects passwords missing design requirements: %s', password => {
  expect(registerSchema.safeParse({ ...valid, password, confirmation: password }).success).toBe(false)
})
