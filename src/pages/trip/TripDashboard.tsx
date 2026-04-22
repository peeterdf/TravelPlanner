import { useParams, useNavigate } from 'react-router-dom'
import { useTripsStore } from '../../store/tripsStore'
import { validateItinerary } from '../../utils/validate'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plane, Calendar, Building2, Wallet, CheckSquare, AlertTriangle, CheckCircle, Users, Activity, ArrowRight, Share2 } from 'lucide-react'

function shareTrip(trip: ReturnType<typeof useTripsStore.getState>['trips'][0]) {
  const json = JSON.stringify(trip, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const file = new File([blob], `${trip.name.replace(/\s+/g, '_')}.json`, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file], title: trip.name }).catch(() => {})
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }
}

function formatDate(d: string) {
  try { return format(new Date(d + 'T00:00:00'), 'd MMM', { locale: es }) } catch { return d }
}

export function TripDashboard() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const trip = useTripsStore(s => s.trips.find(t => t.id === tripId))

  if (!trip) return (
    <div className="p-6 text-center text-gray-500">
      Viaje no encontrado. <button className="text-blue-600 underline" onClick={() => navigate('/')}>Volver</button>
    </div>
  )

  const conflicts = validateItinerary(trip.transports, trip.itinerary)
  const totalDays = trip.startDate && trip.endDate
    ? differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1
    : null

  const totalExpenses = trip.expenses.reduce((s, e) => s + e.price, 0)
  const totalPaid = trip.expenses.reduce((s, e) => s + e.paid, 0)
  const remaining = totalExpenses - totalPaid

  const checkedItems = trip.packingList.flatMap(c => c.items).filter(i => i.checked).length
  const totalItems = trip.packingList.flatMap(c => c.items).length

  const sections = [
    { label: 'Transportes', icon: Plane, to: 'transportes', value: `${trip.transports.length} tramos`, color: 'text-blue-600 bg-blue-50' },
    { label: 'Itinerario', icon: Calendar, to: 'itinerario', value: `${trip.itinerary.length} días`, color: 'text-purple-600 bg-purple-50' },
    { label: 'Alojamiento', icon: Building2, to: 'alojamiento', value: `${trip.accommodations.length} lugares`, color: 'text-green-600 bg-green-50' },
    { label: 'Gastos', icon: Wallet, to: 'gastos', value: `$${totalExpenses.toFixed(0)}`, color: 'text-orange-600 bg-orange-50' },
    { label: 'Actividades', icon: Activity, to: 'actividades', value: `${trip.activities.length} actividades`, color: 'text-pink-600 bg-pink-50' },
    { label: 'Checklist', icon: CheckSquare, to: 'checklist', value: `${checkedItems}/${totalItems}`, color: 'text-teal-600 bg-teal-50' },
  ]

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Trip header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold">{trip.name}</h2>
          <button
            onClick={() => shareTrip(trip)}
            className="shrink-0 p-2 bg-blue-500/40 hover:bg-blue-500/60 rounded-xl transition-colors"
            aria-label="Compartir viaje"
          >
            <Share2 size={18} />
          </button>
        </div>
        {trip.startDate && trip.endDate && (
          <p className="text-blue-200 text-sm mt-1">
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
            {totalDays && <span className="ml-2 bg-blue-500 px-2 py-0.5 rounded-full text-xs">{totalDays} días</span>}
          </p>
        )}
        {trip.travelers.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-blue-200 text-sm">
            <Users size={14} />
            <span>{trip.travelers.map(t => t.name).join(' · ')}</span>
          </div>
        )}
      </div>

      {/* Validation indicator */}
      <div className={`rounded-2xl p-3 flex items-start gap-3 ${conflicts.length === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
        {conflicts.length === 0
          ? <><CheckCircle size={18} className="shrink-0 mt-0.5" /><span className="text-sm font-medium">Itinerario consistente con los transportes</span></>
          : (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="text-sm font-semibold">{conflicts.length} inconsistencia{conflicts.length > 1 ? 's' : ''} detectada{conflicts.length > 1 ? 's' : ''}</span>
              </div>
              <ul className="space-y-1">
                {conflicts.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-xs">{c.message}</li>
                ))}
                {conflicts.length > 3 && <li className="text-xs">y {conflicts.length - 3} más...</li>}
              </ul>
            </div>
          )
        }
      </div>

      {/* Finance summary */}
      {totalExpenses > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Resumen financiero</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">${totalExpenses.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">${totalPaid.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Pagado</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>${remaining.toFixed(0)}</p>
              <p className="text-xs text-gray-500">Pendiente</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick access grid */}
      <div className="grid grid-cols-2 gap-3">
        {sections.map(({ label, icon: Icon, to, value, color }) => (
          <button
            key={to}
            onClick={() => navigate(`/viaje/${tripId}/${to}`)}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.99] text-left"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Splits shortcut */}
      <button
        onClick={() => navigate(`/viaje/${tripId}/splits`)}
        className="w-full bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500">División de gastos</p>
            <p className="text-sm font-semibold text-gray-900">{trip.expenseSplits.length} registros</p>
          </div>
        </div>
        <ArrowRight size={16} className="text-gray-400" />
      </button>
    </div>
  )
}
