import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTripsStore } from '../../store/tripsStore'
import { validateItinerary } from '../../utils/validate'
import { Modal } from '../../components/ui/Modal'
import { format, eachDayOfInterval, startOfWeek, parseISO, addDays } from 'date-fns'
import { Calendar, AlertTriangle, Moon } from 'lucide-react'

const DAY_COLORS = [
  'bg-blue-50 border-blue-200',
  'bg-green-50 border-green-200',
  'bg-orange-50 border-orange-200',
  'bg-purple-50 border-purple-200',
  'bg-yellow-50 border-yellow-200',
  'bg-pink-50 border-pink-200',
  'bg-red-50 border-red-200',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function Itinerary() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, setItineraryDay } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [editDate, setEditDate] = useState<string | null>(null)
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')

  if (!trip) return null

  const conflicts = validateItinerary(trip.transports, trip.itinerary)
  const conflictDates = new Set(conflicts.map(c => c.date))

  const dayMap = useMemo(() => {
    const m = new Map<string, { city: string; notes: string }>()
    for (const d of trip.itinerary) m.set(d.date, { city: d.city, notes: d.notes })
    return m
  }, [trip.itinerary])

  // City count summary
  const cityNights = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of trip.itinerary) {
      if (d.city) map.set(d.city, (map.get(d.city) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [trip.itinerary])

  const weeks = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return []
    const start = parseISO(trip.startDate)
    const end = parseISO(trip.endDate)
    const allDays = eachDayOfInterval({ start, end })
    const weekSet = new Set<string>()
    const result: Date[][] = []
    for (const day of allDays) {
      const wKey = format(startOfWeek(day, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      if (!weekSet.has(wKey)) {
        weekSet.add(wKey)
        const weekStart = startOfWeek(day, { weekStartsOn: 1 })
        result.push(Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)))
      }
    }
    return result
  }, [trip.startDate, trip.endDate])

  const openEdit = (date: string) => {
    const existing = dayMap.get(date)
    setCity(existing?.city ?? '')
    setNotes(existing?.notes ?? '')
    setEditDate(date)
  }

  const handleSave = () => {
    if (!editDate) return
    setItineraryDay(tripId!, { date: editDate, city, notes })
    setEditDate(null)
  }

  const tripStart = trip.startDate ? parseISO(trip.startDate) : null
  const tripEnd = trip.endDate ? parseISO(trip.endDate) : null

  const isInRange = (d: Date) => {
    if (!tripStart || !tripEnd) return false
    return d >= tripStart && d <= tripEnd
  }

  return (
    <div className="pb-28">
      {/* City summary */}
      {cityNights.length > 0 && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2">
            {cityNights.map(([city, nights]) => (
              <div key={city} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <Moon size={12} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-800">{city}</span>
                <span className="text-xs text-gray-500">{nights}n</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="px-4 pt-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-amber-700 mb-2">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">Inconsistencias con transportes</span>
            </div>
            {conflicts.slice(0, 5).map((c, i) => (
              <p key={i} className="text-xs text-amber-600 mb-1">{c.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* No dates set */}
      {weeks.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium">Definí las fechas del viaje</p>
          <p className="text-sm mt-1">Editá el viaje desde el inicio para agregar fechas.</p>
        </div>
      )}

      {/* Weekly calendars */}
      {weeks.map((week, wi) => (
        <div key={wi} className="px-4 pt-4">
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 pb-1">{d}</div>
            ))}
            {week.map((day, di) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const inRange = isInRange(day)
              const data = dayMap.get(dateStr)
              const hasConflict = conflictDates.has(dateStr)
              return (
                <button
                  key={di}
                  onClick={() => inRange && openEdit(dateStr)}
                  disabled={!inRange}
                  className={`rounded-xl border p-1.5 text-left min-h-[72px] transition-all ${
                    inRange
                      ? `${DAY_COLORS[di]} cursor-pointer hover:shadow-sm active:scale-95 ${hasConflict ? 'ring-2 ring-red-400' : ''}`
                      : 'bg-gray-50 border-gray-100 opacity-30 cursor-default'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-700">{format(day, 'd')}</p>
                  {data?.city && (
                    <p className="text-xs font-medium text-gray-800 mt-0.5 leading-tight line-clamp-2">{data.city}</p>
                  )}
                  {data?.notes && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-1">{data.notes}</p>
                  )}
                  {hasConflict && <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {editDate && (
        <Modal title={`Editar día ${editDate}`} onClose={() => setEditDate(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                placeholder="Ej: Barcelona"
                value={city}
                onChange={e => setCity(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota del día</label>
              <textarea
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="Ej: Llegada al aeropuerto, check-in hotel"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
