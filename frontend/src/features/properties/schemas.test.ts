import { expect, test } from 'vitest'
import { propertySchema } from './schemas'
const values = { title: 'Departamento', description: 'Alojamiento luminoso.', type: 'APARTMENT', address: 'Calle 123', city: 'Lima', district: 'Miraflores', capacity: 4, bedrooms: 2, beds: 3, bathrooms: 1, nightlyRate: 180.5, currency: 'PEN' }
test('rejects invalid required fields, capacity and prices', () => {
  for (const overrides of [{ title: ' ' }, { description: '' }, { district: '' }, { capacity: 0 }, { beds: 0 }, { bedrooms: -1 }, { bathrooms: -1 }, { beds: 1.5 }, { nightlyRate: 0 }, { nightlyRate: 20.001 }, { currency: 'EUR' }])
    expect(propertySchema.safeParse({ ...values, ...overrides }).success).toBe(false)
})
test('normalizes principal information and accepts zero bedrooms and bathrooms', () => {
  const parsed = propertySchema.parse({ ...values, title: '  Departamento  ', bedrooms: 0, bathrooms: 0, nightlyRate: 9999999999.99 })
  expect(parsed.title).toBe('Departamento'); expect(parsed.nightlyRate).toBe(9999999999.99)
})
