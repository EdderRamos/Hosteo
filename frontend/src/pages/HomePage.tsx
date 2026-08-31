import { useState, type FormEvent, type ReactNode } from 'react'
import destinationBarranco from '../assets/destination-barranco.jpg'
import destinationMiraflores from '../assets/destination-miraflores.jpg'
import destinationSanIsidro from '../assets/destination-san-isidro.jpg'
import homeHero from '../assets/home-hero.jpg'
import propertyBarranco from '../assets/property-barranco.jpg'
import propertyMiraflores from '../assets/property-miraflores.jpg'
import propertySanIsidro from '../assets/property-san-isidro.jpg'

interface Property {
  photo: string
  district: string
  name: string
  rating: number
  reviews: number
  guests: number
  bedrooms: number
  price: number
}

const PROPERTIES: Property[] = [
  {
    photo: propertyMiraflores,
    district: 'Miraflores',
    name: 'Departamento contemporáneo cerca del malecón',
    rating: 4.9,
    reviews: 48,
    guests: 4,
    bedrooms: 2,
    price: 280,
  },
  {
    photo: propertyBarranco,
    district: 'Barranco',
    name: 'Loft de diseño en el corazón de Barranco',
    rating: 4.8,
    reviews: 35,
    guests: 2,
    bedrooms: 1,
    price: 240,
  },
  {
    photo: propertySanIsidro,
    district: 'San Isidro',
    name: 'Departamento luminoso frente al parque',
    rating: 4.9,
    reviews: 62,
    guests: 3,
    bedrooms: 2,
    price: 310,
  },
]

const FEATURES = [
  {
    title: 'Alojamientos seleccionados',
    description: 'Espacios revisados pensando en comodidad, ubicación y experiencia real.',
  },
  {
    title: 'Check-in sencillo',
    description: 'Una llegada clara y sin complicaciones para disfrutar desde el primer momento.',
  },
  {
    title: 'Atención durante tu estadía',
    description: 'Ayuda cercana cuando realmente la necesitas, sin respuestas genéricas.',
  },
  {
    title: 'Ubicaciones que importan',
    description: 'Propiedades en zonas estratégicas de Lima, cerca de lo que buscas.',
  },
]

function SectionIntro({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return (
    <header className="section-intro">
      <span className="section-label">{label}</span>
      <h2>{title}</h2>
      {children}
    </header>
  )
}

function HeroSection() {
  return (
    <section className="home-hero" id="inicio">
      <img className="home-hero__image" src={homeHero} alt="Departamento moderno y luminoso en Lima" />
      <div className="home-hero__overlay" aria-hidden="true" />
      <div className="site-container home-hero__content">
        <div className="home-hero__copy">
          <span className="section-label section-label--light">Estadías seleccionadas en Lima</span>
          <h1>
            Tu próxima estadía, <em>elegida con criterio.</em>
          </h1>
          <p>
            Departamentos seleccionados para disfrutar Lima con comodidad, diseño y una experiencia que se siente propia.
          </p>
          <div className="home-hero__actions">
            <a className="light-button" href="#alojamientos">
              Explorar alojamientos
            </a>
            <a className="ghost-button" href="#nosotros">
              Conocer Hosteo
            </a>
          </div>
        </div>
      </div>
      <a className="scroll-hint" href="#buscador" aria-label="Ir al buscador">
        <span>Explorar</span>
        <i aria-hidden="true" />
      </a>
    </section>
  )
}

function BookingSearch() {
  const [destination, setDestination] = useState('Miraflores, Lima')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [guests, setGuests] = useState('2')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    document.getElementById('alojamientos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="booking-section" id="buscador" aria-label="Buscar alojamiento">
      <div className="site-container">
        <form className="booking-search" onSubmit={handleSubmit}>
          <div className="booking-field booking-field--destination">
            <label htmlFor="destination">Destino</label>
            <input
              id="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="¿A dónde vas?"
            />
          </div>
          <div className="booking-field">
            <label htmlFor="arrival">Llegada</label>
            <input id="arrival" type="date" value={arrival} onChange={(event) => setArrival(event.target.value)} />
          </div>
          <div className="booking-field">
            <label htmlFor="departure">Salida</label>
            <input
              id="departure"
              type="date"
              value={departure}
              min={arrival || undefined}
              onChange={(event) => setDeparture(event.target.value)}
            />
          </div>
          <div className="booking-field">
            <label htmlFor="guests">Huéspedes</label>
            <select id="guests" value={guests} onChange={(event) => setGuests(event.target.value)}>
              <option value="1">1 huésped</option>
              <option value="2">2 huéspedes</option>
              <option value="3">3 huéspedes</option>
              <option value="4">4 huéspedes</option>
              <option value="5">5+ huéspedes</option>
            </select>
          </div>
          <button className="solid-button booking-search__button" type="submit">
            Buscar alojamiento
          </button>
        </form>
      </div>
    </section>
  )
}

function PropertyCard({ property }: { property: Property }) {
  const [favorite, setFavorite] = useState(false)

  return (
    <article className="property-card">
      <div className="property-card__media">
        <img src={property.photo} alt={property.name} loading="lazy" />
        <span className="property-card__district">{property.district}</span>
        <button
          className={`favorite-button${favorite ? ' favorite-button--active' : ''}`}
          type="button"
          onClick={() => setFavorite((current) => !current)}
          aria-pressed={favorite}
          aria-label={favorite ? `Quitar ${property.name} de favoritos` : `Guardar ${property.name} en favoritos`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1.1-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
          </svg>
        </button>
      </div>
      <div className="property-card__body">
        <div className="property-card__rating">
          <span className="stars" aria-label={`${property.rating} de 5 estrellas`}>★★★★★</span>
          <span>{property.rating.toFixed(1)} ({property.reviews} reseñas)</span>
        </div>
        <h3>{property.name}</h3>
        <div className="property-card__details">
          <span>{property.guests} huéspedes</span>
          <span>{property.bedrooms} dormitorio{property.bedrooms === 1 ? '' : 's'}</span>
        </div>
        <div className="property-card__footer">
          <p><strong>S/ {property.price}</strong> / noche</p>
          <button className="outline-button" type="button">Ver alojamiento</button>
        </div>
      </div>
    </article>
  )
}

function FeaturedProperties() {
  return (
    <section className="content-section properties-section" id="alojamientos">
      <div className="site-container">
        <SectionIntro label="Nuestros alojamientos" title="Estadías que vale la pena recordar">
          <p>Espacios seleccionados en los mejores distritos de Lima, listos para una experiencia sin complicaciones.</p>
        </SectionIntro>
        <div className="properties-grid">
          {PROPERTIES.map((property) => <PropertyCard key={property.name} property={property} />)}
        </div>
        <div className="section-action">
          <button className="outline-button outline-button--wide" type="button">Ver todos los alojamientos</button>
        </div>
      </div>
    </section>
  )
}

function DestinationCard({ photo, name, count }: { photo: string; name: string; count: number }) {
  return (
    <a className="destination-card" href="#alojamientos">
      <img src={photo} alt={`Vista de ${name}`} loading="lazy" />
      <span className="destination-card__overlay" aria-hidden="true" />
      <span className="destination-card__content">
        <small>{count} alojamientos</small>
        <strong>{name}</strong>
      </span>
    </a>
  )
}

function DestinationsSection() {
  return (
    <section className="content-section destinations-section" id="destinos">
      <div className="site-container">
        <div className="destinations-section__header">
          <SectionIntro label="Destinos" title="Descubre Lima a tu manera" />
          <a className="outline-button" href="#alojamientos">Explorar alojamientos</a>
        </div>
        <div className="destinations-grid">
          <DestinationCard photo={destinationMiraflores} name="Miraflores" count={14} />
          <DestinationCard photo={destinationBarranco} name="Barranco" count={9} />
          <DestinationCard photo={destinationSanIsidro} name="San Isidro" count={11} />
        </div>
      </div>
    </section>
  )
}

function WhyHosteo() {
  return (
    <section className="content-section why-section" id="nosotros">
      <div className="site-container why-section__grid">
        <div className="why-section__intro">
          <SectionIntro label="Por qué Hosteo" title="Una estadía bien elegida cambia el viaje">
            <p>No somos un directorio de propiedades. Seleccionamos, verificamos y acompañamos cada estadía.</p>
          </SectionIntro>
          <p className="experience-note"><span aria-hidden="true">+</span> 6 años seleccionando estadías en Lima</p>
        </div>
        <ol className="features-list">
          {FEATURES.map((feature, index) => (
            <li key={feature.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function CallToAction() {
  return (
    <section className="home-cta">
      <span>Listo para reservar</span>
      <h2>Encuentra un lugar que se sienta tuyo.</h2>
      <p>Más de 34 departamentos seleccionados en los mejores distritos de Lima esperan por ti.</p>
      <a className="light-button" href="#alojamientos">Ver alojamientos</a>
    </section>
  )
}

export function HomePage() {
  return (
    <>
      <HeroSection />
      <BookingSearch />
      <FeaturedProperties />
      <DestinationsSection />
      <WhyHosteo />
      <CallToAction />
    </>
  )
}
