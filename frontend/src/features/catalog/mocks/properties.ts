import miraflores from '../../../assets/property-miraflores.jpg'
import barranco from '../../../assets/property-barranco.jpg'
import sanIsidro from '../../../assets/property-san-isidro.jpg'
import sunset from '../../../assets/home-hero.jpg'
import atelier from '../../../assets/register-residence.png'
import suite from '../../../assets/login-architecture.png'

export type District = 'Miraflores' | 'San Isidro' | 'Barranco'
export interface PropertyPreview { id: string; name: string; district: District; guests: number; bedrooms: number; price: number; photo: string }
// Datos de presentación: no representan inventario ni disponibilidad real.
export const properties: PropertyPreview[] = [
  { id: 'malecon', name: 'Penthouse Malecón con vista al Pacífico', district: 'Miraflores', guests: 4, bedrooms: 2, price: 145, photo: miraflores },
  { id: 'bohemio', name: 'Loft Bohemio frente al Puente de los Suspiros', district: 'Barranco', guests: 2, bedrooms: 1, price: 92, photo: barranco },
  { id: 'olivar', name: 'Residencia Olivar Clásica con Terraza', district: 'San Isidro', guests: 6, bedrooms: 3, price: 210, photo: sanIsidro },
  { id: 'sunset', name: 'Apartamento Larcomar Sunset', district: 'Miraflores', guests: 3, bedrooms: 2, price: 120, photo: sunset },
  { id: 'atelier', name: 'Atelier de Arte y Jardín Interior', district: 'Barranco', guests: 2, bedrooms: 1, price: 85, photo: atelier },
  { id: 'golf', name: 'Executive Suite Golf Club', district: 'San Isidro', guests: 2, bedrooms: 1, price: 160, photo: suite },
]
