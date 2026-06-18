import { useParams } from 'react-router-dom'
import { useTripsStore } from '../../store/tripsStore'

export function Notes() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, setNotes } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)

  if (!trip) return null

  return (
    <div className="p-4 pb-28">
      <textarea
        className="w-full min-h-[65vh] border border-gray-200 dark:border-gray-700 rounded-2xl
                   px-4 py-3 text-sm text-gray-800 dark:text-white
                   bg-white dark:bg-gray-800 resize-none
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   placeholder-gray-400 dark:placeholder-gray-500"
        placeholder="Anotá aquí todo lo importante del viaje: direcciones, teléfonos, contraseñas de wifi, tips..."
        value={trip.notes}
        onChange={e => setNotes(tripId!, e.target.value)}
      />
    </div>
  )
}
