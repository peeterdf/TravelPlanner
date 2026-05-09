import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTripsStore } from '../../store/tripsStore'
import { validateItinerary } from '../../utils/validate'
import { Modal } from '../../components/ui/Modal'
import { format, eachDayOfInterval, startOfWeek, parseISO, addDays } from 'date-fns'
import { Calendar, AlertTriangle, Moon, ChevronRight } from 'lucide-react'

const DAY_COLORS = [
  'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
  'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
  'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-800',
  'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const LEFT_BORDER_COLORS = [
  'border-l-blue-400', 'border-l-green-400', 'border-l-orange-400',
  'border-l-purple-400', 'border-l-yellow-400', 'border-l-pink-400', 'border-l-red-400',
]

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'

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

  const cityColorMap = useMemo(() => {
    const map = new Map<string, number>()
    const sorted = [...trip.itinerary].sort((a, b) => a.date.localeCompare(b.date))
    for (const d of sorted) {
      if (d.city && !map.has(d.city)) map.set(d.city, map.size % DAY_COLORS.length)
    }
    return map
  }, [trip.itinerary])

  const cityNights = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of trip.itinerary) {
      if (d.city) map.set(d.city, (map.get(d.city) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [trip.itinerary])

  const tripDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return []
    return eachDayOfInterval({ start: parseISO(trip.startDate), end: parseISO(trip.endDate) })
  }, [trip.startDate, trip.endDate])

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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-3 flex flex-wrap gap-2">
            {cityNights.map(([city, nights]) => (
              <div key={city} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg px-2.5 py-1.5">
                <Moon size={12} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{city}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{nights}n</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="px-4 pt-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">Inconsistencias con transportes</span>
            </div>
            {conflicts.slice(0, 5).map((c, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400 mb-1">{c.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* No dates set */}
      {weeks.length === 0 && (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="font-medium">Definí las fechas del viaje</p>
          <p className="text-sm mt-1">Editá el viaje desde el inicio para agregar fechas.</p>
        </div>
      )}

      {/* Mobile: vertical list */}
      {tripDays.length > 0 && (
        <div className="block sm:hidden px-4 pt-4 space-y-2">
          {tripDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const data = dayMap.get(dateStr)
            const hasConflict = conflictDates.has(dateStr)
            const cityIdx = data?.city ? cityColorMap.get(data.city) : undefined
            const borderColor = cityIdx !== undefined ? LEFT_BORDER_COLORS[cityIdx] : 'border-l-gray-200 dark:border-l-gray-600'
            const dayName = DAY_NAMES[(day.getDay() + 6) % 7]
            return (
              <button
                key={dateStr}
                onClick={() => openEdit(dateStr)}
                className={`w-full flex items-start gap-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 border-l-4 ${borderColor} rounded-xl p-3 text-left shadow-sm active:scale-[0.99] transition-transform ${hasConflict ? 'ring-1 ring-red-300' : ''}`}
              >
                <div className="flex-shrink-0 w-9 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">{dayName}</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{format(day, 'd')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-none">{MONTH_NAMES[day.getMonth()]}</p>
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  {data?.city
                    ? <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.city}</p>
                    : <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin ciudad</p>
                  }
                  {data?.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{data.notes}</p>
                  )}
                  {hasConflict && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span className="text-xs text-red-500">Conflicto de transporte</span>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="flex-shrink-0 text-gray-300 dark:text-gray-600 mt-1.5" />
              </button>
            )
          })}
        </div>
      )}

      {/* Desktop: weekly calendars */}
      {weeks.map((week, wi) => (
        <div key={wi} className="hidden sm:block px-4 pt-4">
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pb-1">{d}</div>
            ))}
            {week.map((day, di) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const inRange = isInRange(day)
              const data = dayMap.get(dateStr)
              const hasConflict = conflictDates.has(dateStr)
              const cityIdx = data?.city !== undefined ? cityColorMap.get(data.city) : undefined
              const colorCls = cityIdx !== undefined
                ? DAY_COLORS[cityIdx]
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              return (
                <button
                  key={di}
                  onClick={() => inRange && openEdit(dateStr)}
                  disabled={!inRange}
                  className={`rounded-xl border p-1.5 text-left min-h-[72px] transition-all ${
                    inRange
                      ? `${colorCls} cursor-pointer hover:shadow-sm active:scale-95 ${hasConflict ? 'ring-2 ring-red-400' : ''}`
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-30 cursor-default'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{format(day, 'd')}</p>
                  {data?.city && (
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 mt-0.5 leading-tight line-clamp-2">{data.city}</p>
                  )}
                  {data?.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight line-clamp-1">{data.notes}</p>
                  )}
                  {hasConflict && <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {editDate && (
        <Modal title={`Editar día ${editDate.split('-').reverse().join('/')}`} onClose={() => setEditDate(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
              <input className={inputCls} placeholder="Ej: Barcelona" value={city} onChange={e => setCity(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nota del día</label>
              <textarea
                className={inputCls + ' resize-none'}
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
