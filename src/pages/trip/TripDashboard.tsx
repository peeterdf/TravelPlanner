import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTripsStore } from '../../store/tripsStore'
import { useSettingsStore, useMask } from '../../store/settingsStore'
import { validateItinerary } from '../../utils/validate'
import { differenceInDays, differenceInCalendarDays } from 'date-fns'
import { Plane, Calendar, Building2, Wallet, CheckSquare, AlertTriangle, CheckCircle, Users, Activity, Pencil, UserMinus, UserPlus, X } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { DateInput } from '../../components/ui/DateInput'

const CURRENCIES = ['USD', 'EUR', 'ARS', 'GBP', 'BRL', 'CLP', 'MXN', 'COP']
const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

function formatDate(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

const round2 = (n: number) => Math.round(n * 100) / 100

function calcNetBalance(trip: { expenses: { paidBy?: string; price: number; includedTravelers?: string[] }[]; travelers: { name: string }[] }) {
  const travelerNames = trip.travelers.map(t => t.name)
  const net: Record<string, number> = {}
  for (const e of trip.expenses.filter(e => e.paidBy)) {
    const included = e.includedTravelers?.length ? e.includedTravelers : travelerNames
    const share = included.length > 0 ? round2(e.price / included.length) : 0
    net[e.paidBy!] = round2((net[e.paidBy!] ?? 0) + e.price)
    for (const p of included) net[p] = round2((net[p] ?? 0) - share)
  }
  return net
}

export function TripDashboard() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { addTraveler, removeTraveler, updateTrip } = useTripsStore()
  const trip = useTripsStore(s => s.trips.find(t => t.id === tripId))
  const { privacyMode } = useSettingsStore()
  const mask = useMask()

  const [showTravelers, setShowTravelers] = useState(false)
  const [newName, setNewName] = useState('')
  const [dupError, setDupError] = useState('')
  const [removeError, setRemoveError] = useState<Record<string, string>>({})

  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editCurrency, setEditCurrency] = useState('')
  const [editDateError, setEditDateError] = useState('')

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
    { label: 'Transportes', icon: Plane, to: 'transportes', value: `${trip.transports.length} tramos`, color: 'icon-box-primary' },
    { label: 'Itinerario', icon: Calendar, to: 'itinerario', value: `${trip.itinerary.length} días`, color: 'icon-box-purple' },
    { label: 'Alojamiento', icon: Building2, to: 'alojamiento', value: `${trip.accommodations.length} lugares`, color: 'icon-box-success' },
    { label: 'Gastos', icon: Wallet, to: 'gastos', value: privacyMode ? '••••' : `$${totalExpenses.toFixed(0)}`, color: 'icon-box-warning' },
    { label: 'Actividades', icon: Activity, to: 'actividades', value: `${trip.activities.length} actividades`, color: 'icon-box-pink' },
    { label: 'Checklist', icon: CheckSquare, to: 'checklist', value: `${checkedItems}/${totalItems}`, color: 'icon-box-teal' },
  ]

  const netBalance = calcNetBalance(trip)

  const handleRemove = (travelerId: string, travelerName: string) => {
    const balance = netBalance[travelerName] ?? 0
    if (Math.abs(balance) > 0.5) {
      const sign = balance > 0 ? 'le deben' : 'debe'
      const amt = `${trip.currency} ${Math.abs(balance).toFixed(2)}`
      setRemoveError(prev => ({
        ...prev,
        [travelerId]: `Saldo pendiente: ${sign} ${amt}. Saldá primero en la pestaña Balance de Gastos.`,
      }))
      return
    }
    removeTraveler(tripId!, travelerId)
    setRemoveError(prev => { const n = { ...prev }; delete n[travelerId]; return n })
  }

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    if (trip.travelers.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      setDupError(`"${name}" ya está en el viaje.`)
      return
    }
    setDupError('')
    addTraveler(tripId!, name)
    setNewName('')
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Trip header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{trip.name}</h2>
          <button
            onClick={() => {
              setEditName(trip.name)
              setEditStart(trip.startDate)
              setEditEnd(trip.endDate)
              setEditCurrency(trip.currency ?? 'USD')
              setShowEdit(true)
            }}
            className="p-1 text-blue-300 hover:text-white transition-colors"
            title="Editar viaje"
          >
            <Pencil size={14} />
          </button>
        </div>
        {trip.startDate && trip.endDate && (
          <p className="text-blue-200 text-sm mt-1">
            {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
            {totalDays && <span className="ml-2 bg-blue-500 px-2 py-0.5 rounded-full text-xs">{totalDays} días</span>}
          </p>
        )}
        <button
          onClick={() => { setShowTravelers(true); setRemoveError({}) }}
          className="flex items-center gap-1.5 mt-2 text-blue-200 hover:text-white transition-colors text-sm group"
        >
          <Users size={14} />
          <span>
            {trip.travelers.length === 0
              ? 'Agregar viajeros'
              : trip.travelers.map(t => mask.name(t.name)).join(' · ')}
          </span>
          <Pencil size={11} className="opacity-60 group-hover:opacity-100" />
        </button>

        {countdownBadge}
      </div>

      {/* Validation indicator */}
      <div className={`alert-box ${conflicts.length === 0 ? 'alert-success' : 'alert-warning'}`}>
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
              <p className="text-lg font-bold text-success">{mask.amount(totalPaid)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pagado</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${remaining > 0 ? 'text-danger' : 'text-success'}`}>{mask.amount(remaining)}</p>
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
            <div className={`icon-box-sm ${color}`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal: Viajeros */}
      {showTravelers && (
        <Modal title="Viajeros" onClose={() => setShowTravelers(false)}>
          <div className="space-y-4">
            {/* Lista actual */}
            {trip.travelers.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">Sin viajeros aún.</p>
            ) : (
              <div className="space-y-2">
                {trip.travelers.map(t => {
                  const balance = netBalance[t.name] ?? 0
                  const hasBalance = Math.abs(balance) > 0.5
                  return (
                    <div key={t.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{mask.name(t.name)}</span>
                          {hasBalance && (
                            <span className={`chip-sm ${balance > 0 ? 'chip-success' : 'chip-danger'}`}>
                              {balance > 0 ? `+${trip.currency} ${Math.abs(balance).toFixed(0)}` : `-${trip.currency} ${Math.abs(balance).toFixed(0)}`}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(t.id, t.name)}
                          className={`p-1.5 rounded-lg transition-colors shrink-0 ${hasBalance ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                          title={hasBalance ? 'Saldo pendiente — no se puede eliminar' : 'Eliminar viajero'}
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                      {removeError[t.id] && (
                        <div className="alert-box alert-danger text-xs">
                          <span className="flex-1">{removeError[t.id]}</span>
                          <button onClick={() => setRemoveError(prev => { const n = { ...prev }; delete n[t.id]; return n })}>
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Agregar viajero */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Agregar viajero</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Nombre"
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setDupError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="bg-blue-600 text-white rounded-xl px-3 py-2 disabled:opacity-40 hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={18} />
                </button>
              </div>
              {dupError && <p className="text-xs text-red-500 mt-1">{dupError}</p>}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Editar viaje */}
      {showEdit && (
        <Modal title="Editar viaje" onClose={() => setShowEdit(false)}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre del viaje</label>
              <input className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha de salida</label>
                <DateInput className={inputCls} value={editStart} onChange={v => { setEditStart(v); setEditDateError('') }} />
              </div>
              <div>
                <label className={labelCls}>Fecha de vuelta</label>
                <DateInput className={inputCls} value={editEnd} onChange={v => { setEditEnd(v); setEditDateError('') }} />
              </div>
            </div>
            {editDateError && <p className="text-xs text-danger">{editDateError}</p>}
            <div>
              <label className={labelCls}>Moneda</label>
              <div className="flex flex-wrap gap-2">
                {CURRENCIES.map(c => (
                  <button key={c} type="button" onClick={() => setEditCurrency(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${editCurrency === c ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (!editName.trim()) return
                if (editStart && editEnd && editEnd < editStart) { setEditDateError('La fecha de vuelta no puede ser antes que la de salida.'); return }
                updateTrip(tripId!, { name: editName.trim(), startDate: editStart, endDate: editEnd, currency: editCurrency })
                setShowEdit(false)
              }}
              disabled={!editName.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Guardar cambios
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
