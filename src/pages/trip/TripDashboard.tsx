import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTripsStore } from '../../store/tripsStore'
import { useSettingsStore, useMask } from '../../store/settingsStore'
import { validateItinerary } from '../../utils/validate'
import { differenceInDays, differenceInCalendarDays } from 'date-fns'
import { Plane, Calendar, Building2, Wallet, CheckSquare, AlertTriangle, CheckCircle, Users, Activity } from 'lucide-react'

function formatDate(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

export function TripDashboard() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const trip = useTripsStore(s => s.trips.find(t => t.id === tripId))
  const { privacyMode } = useSettingsStore()
  const mask = useMask()

  if (!trip) return (
    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
      Viaje no encontrado. <button className="text-blue-600 underline" onClick={() => navigate('/')}>Volver</button>
    </div>
  )

  const conflicts = validateItinerary(trip.transports, trip.itinerary)
  const totalDays = trip.startDate && trip.endDate
    ? differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1
    : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntilStart = trip.startDate
    ? differenceInCalendarDays(new Date(trip.startDate + 'T00:00:00'), today)
    : null
  const daysUntilEnd = trip.endDate
    ? differenceInCalendarDays(new Date(trip.endDate + 'T00:00:00'), today)
    : null

  let countdownBadge: React.ReactNode = null
  if (daysUntilStart !== null) {
    if (daysUntilStart > 0) {
      countdownBadge = (
        <div className="mt-3 inline-flex items-baseline gap-2 bg-white/20 rounded-xl px-3 py-2">
          <span className="text-3xl font-extrabold leading-none">{daysUntilStart}</span>
          <span className="text-blue-100 text-sm">días para el viaje</span>
        </div>
      )
    } else if (daysUntilStart === 0) {
      countdownBadge = (
        <div className="mt-3 inline-block bg-white/20 rounded-xl px-3 py-2 text-sm font-semibold">
          ¡Hoy empieza el viaje!
        </div>
      )
    } else if (daysUntilEnd !== null && daysUntilEnd >= 0) {
      countdownBadge = (
        <div className="mt-3 inline-flex items-baseline gap-2 bg-white/20 rounded-xl px-3 py-2">
          <span className="text-sm font-semibold">En curso</span>
          {totalDays && (
            <span className="text-xs text-blue-200">día {Math.abs(daysUntilStart) + 1} de {totalDays}</span>
          )}
        </div>
      )
    } else {
      countdownBadge = (
        <div className="mt-3 inline-block bg-white/20 rounded-xl px-3 py-2 text-sm text-blue-200">
          Viaje finalizado
        </div>
      )
    }
  }

  const totalExpenses = trip.expenses.reduce((s, e) => s + e.price, 0)
  const totalPaid = trip.expenses.reduce((s, e) => s + e.paid, 0)
  const remaining = totalExpenses - totalPaid

  const checkedItems = trip.packingList.flatMap(c => c.items).filter(i => i.checked).length
  const totalItems = trip.packingList.flatMap(c => c.items).length

  const sections = [
    { label: 'Transportes', icon: Plane, to: 'transportes', value: `${trip.transports.length} tramos`, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Itinerario', icon: Calendar, to: 'itinerario', value: `${trip.itinerary.length} días`, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: 'Alojamiento', icon: Building2, to: 'alojamiento', value: `${trip.accommodations.length} lugares`, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Gastos', icon: Wallet, to: 'gastos', value: privacyMode ? '••••' : `$${totalExpenses.toFixed(0)}`, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400' },
    { label: 'Actividades', icon: Activity, to: 'actividades', value: `${trip.activities.length} actividades`, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30 dark:text-pink-400' },
    { label: 'Checklist', icon: CheckSquare, to: 'checklist', value: `${checkedItems}/${totalItems}`, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400' },
  ]

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Trip header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
        <h2 className="text-xl font-bold">{trip.name}</h2>
        {trip.startDate && trip.endDate && (
          <p className="text-blue-200 text-sm mt-1">
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
            {totalDays && <span className="ml-2 bg-blue-500 px-2 py-0.5 rounded-full text-xs">{totalDays} días</span>}
          </p>
        )}
        {trip.travelers.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-blue-200 text-sm">
            <Users size={14} />
            <span>{trip.travelers.map(t => mask.name(t.name)).join(' · ')}</span>
          </div>
        )}

        {countdownBadge}
      </div>

      {/* Validation indicator */}
      <div className={`rounded-2xl p-3 flex items-start gap-3 ${conflicts.length === 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-3">Resumen financiero</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{mask.amount(totalExpenses)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{mask.amount(totalPaid)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pagado</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{mask.amount(remaining)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente</p>
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
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow active:scale-[0.99] text-left"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</p>
            </div>
          </button>
        ))}
      </div>

    </div>
  )
}
