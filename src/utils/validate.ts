import type { Transport, ItineraryDay, ItineraryConflict } from '../types'

function normalize(city: string): string {
  return city.trim().toLowerCase()
}

export function validateItinerary(
  transports: Transport[],
  itinerary: ItineraryDay[]
): ItineraryConflict[] {
  const conflicts: ItineraryConflict[] = []
  const dayMap = new Map<string, string>()
  for (const day of itinerary) {
    dayMap.set(day.date, day.city)
  }

  for (const t of transports) {
    if (!t.origin || !t.destination) continue

    const depCity = dayMap.get(t.departureDate)
    if (depCity && normalize(depCity) !== normalize(t.origin)) {
      conflicts.push({
        date: t.departureDate,
        message: `${t.departureDate}: itinerario dice "${depCity}" pero el ${t.type} sale desde "${t.origin}"`,
      })
    }

    const arrCity = dayMap.get(t.arrivalDate)
    if (arrCity && normalize(arrCity) !== normalize(t.destination)) {
      conflicts.push({
        date: t.arrivalDate,
        message: `${t.arrivalDate}: itinerario dice "${arrCity}" pero el ${t.type} llega a "${t.destination}"`,
      })
    }
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
