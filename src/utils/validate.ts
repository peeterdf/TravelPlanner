import type { Transport, ItineraryDay, ItineraryConflict } from '../types'

function normalize(city: string): string {
  return city.trim().toLowerCase()
}

export function validateItinerary(
  transports: Transport[],
  itinerary: ItineraryDay[]
): ItineraryConflict[] {
  const dayCity = new Map<string, string>()
  for (const d of itinerary) {
    if (d.city) dayCity.set(d.date, d.city)
  }

  const validCities = new Map<string, Set<string>>()
  const addValid = (date: string, city: string) => {
    if (!date || !city) return
    if (!validCities.has(date)) validCities.set(date, new Set())
    validCities.get(date)!.add(normalize(city))
  }
  for (const t of transports) {
    addValid(t.departureDate, t.origin)
    addValid(t.arrivalDate, t.destination)
  }

  const conflicts: ItineraryConflict[] = []
  for (const [date, city] of dayCity) {
    const valid = validCities.get(date)
    if (!valid || valid.has(normalize(city))) continue
    const validList = [...valid].join('" / "')
    const [, m, d] = date.split('-')
    conflicts.push({
      date,
      message: `${d}/${m}: itinerario dice "${city}" pero los transportes pasan por "${validList}"`,
    })
  }

  return conflicts
}

export function DEFAULT_PACKING_CATEGORIES() {
  return [
    {
      id: 'ropa',
      name: 'Ropa',
      items: [
        'Pantalones', 'Camisetas', 'Sudaderas/Jerseys', 'Chaquetas/Abrigos',
        'Ropa interior', 'Pijama', 'Cinturón', 'Calzado', 'Chubasquero',
        'Antifaz', 'Bufanda/pañuelos', 'Gorra', 'Guantes',
      ].map((n, i) => ({ id: `ropa-${i}`, name: n, checked: false })),
    },
    {
      id: 'botiquin',
      name: 'Botiquín',
      items: [
        'Gafas de sol', 'Gafas/lentillas', 'Medicación habitual', 'Tiritas',
        'Betadine (yodo)', 'Gasas', 'Ibuprofeno', 'Paracetamol',
        'Pastillas para la diarrea', 'Protector estomacal', 'Repelente de mosquitos',
      ].map((n, i) => ({ id: `bot-${i}`, name: n, checked: false })),
    },
    {
      id: 'neceser',
      name: 'Neceser',
      items: [
        'Cepillo de dientes + pasta', 'Champú', 'Gel', 'Crema solar + protector labios',
        'Crema hidratante', 'Peine', 'Espejo', 'Secador de pelo', 'Kit menstruación',
        'Gomas de pelo', 'Desodorante', 'Colonia', 'Pañuelos', 'Toallitas',
        'Tijeras pequeñas', 'Tapones para los oídos',
      ].map((n, i) => ({ id: `nec-${i}`, name: n, checked: false })),
    },
    {
      id: 'tecnologia',
      name: 'Tecnología/Ocio',
      items: [
        'Móvil', 'Cámara fotos', 'Cargadores', 'Adaptadores/transformadores',
        'Baterías', 'Tarjetas de memoria', 'Trípode', 'Auriculares',
        'Portátil/tablet', 'Disco duro', 'Música',
      ].map((n, i) => ({ id: `tec-${i}`, name: n, checked: false })),
    },
    {
      id: 'documentacion',
      name: 'Documentación',
      items: [
        'DNI', 'Pasaporte', 'Dinero en moneda local destino', 'Carné de conducir',
        'Reservas de vuelos', 'Reservas de alojamiento', 'Tarjeta sanitaria/seguro de viaje',
        'Cartilla de vacunas (si se necesita)', 'Tarjetas de crédito', 'Guía del destino',
        'Bloc de notas', 'Bolígrafo',
      ].map((n, i) => ({ id: `doc-${i}`, name: n, checked: false })),
    },
    {
      id: 'monte',
      name: 'Monte',
      items: [
        'Mochila', 'Cantimplora', 'GPS/brújula', 'Prismáticos',
        'Tienda de campaña', 'Saco de dormir',
      ].map((n, i) => ({ id: `mon-${i}`, name: n, checked: false })),
    },
    {
      id: 'playa',
      name: 'Playa',
      items: [
        'Chanclas', 'Bañador', 'Toalla', 'Balón, frisby, palas...',
        'Gafas de buceo', 'Aletas',
      ].map((n, i) => ({ id: `pla-${i}`, name: n, checked: false })),
    },
  ]
}
