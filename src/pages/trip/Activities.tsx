import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Pencil, Star, ExternalLink, CircleDollarSign, Clock, Circle, Ticket, CheckCircle2 } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { DateInput } from '../../components/ui/DateInput'
import { TimeInput } from '../../components/ui/TimeInput'
import { MoneyInput } from '../../components/ui/MoneyInput'
import type { Activity, ActivityStatus } from '../../types'

const ACTIVITY_TYPES = ['Museo', 'Restaurante', 'Excursión', 'Monumento', 'Show/Evento', 'Compras', 'Naturaleza', 'Playa', 'Otro']
const CURRENCIES = ['USD', 'EUR', 'ARS', 'GBP', 'BRL', 'CLP', 'MXN', 'COP']
const EMPTY_COST = { price: 0, currency: 'USD', paid: 0, fullPay: true, paidBy: '', includedTravelers: [] as string[] }
const EMPTY: Omit<Activity, 'id'> = { date: '', city: '', place: '', type: '', notes: '', time: '', url: '', status: 'pendiente' }

const STATUS_CYCLE: Record<ActivityStatus, ActivityStatus> = {
  pendiente: 'reservada',
  reservada: 'realizada',
  realizada: 'pendiente',
}

const STATUS_CONFIG: Record<ActivityStatus, { icon: React.ElementType; color: string; label: string; bg: string }> = {
  pendiente: { icon: Circle,       color: 'text-gray-400 dark:text-gray-500', label: 'Pendiente', bg: 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300' },
  reservada: { icon: Ticket,       color: 'text-blue-500 dark:text-blue-400',  label: 'Reservada', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' },
  realizada: { icon: CheckCircle2, color: 'text-green-500',                    label: 'Realizada', bg: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400' },
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : ''

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function fmtDateLong(d: string): string {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  const date = new Date(y, m - 1, day)
  return `${DAY_NAMES[date.getDay()]} ${day} ${MONTH_NAMES[m - 1]}`
}

export function Activities() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { trips, addActivity, updateActivity, deleteActivity, addExpense } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Activity, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showCost, setShowCost] = useState(false)
  const [costForm, setCostForm] = useState(EMPTY_COST)

  const sorted = useMemo(() =>
    [...(trip?.activities ?? [])].sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      const dateCmp = a.date.localeCompare(b.date)
      if (dateCmp !== 0) return dateCmp
      if (!a.time && !b.time) return 0
      if (!a.time) return 1
      if (!b.time) return -1
      return a.time.localeCompare(b.time)
    }), [trip?.activities])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof sorted> = {}
    for (const a of sorted) {
      const key = a.city.trim() || '__sin_ciudad__'
      if (!groups[key]) groups[key] = []
      groups[key].push(a)
    }
    return groups
  }, [sorted])

  const groupOrder = useMemo(() =>
    Object.keys(grouped).sort((a, b) => {
      if (a === '__sin_ciudad__') return 1
      if (b === '__sin_ciudad__') return -1
      const aDate = grouped[a].find(x => x.date)?.date ?? ''
      const bDate = grouped[b].find(x => x.date)?.date ?? ''
      if (!aDate && !bDate) return a.localeCompare(b)
      if (!aDate) return 1
      if (!bDate) return -1
      return aDate.localeCompare(bDate)
    }), [grouped])

  if (!trip) return null

  const dateOutOfRange = form.date && trip.startDate && trip.endDate
    ? form.date < trip.startDate || form.date > trip.endDate
    : false

  const openAdd = () => {
    setForm(EMPTY)
    setShowCost(false)
    setCostForm({ ...EMPTY_COST, currency: trip.currency ?? 'USD' })
    setModal('add')
  }

  const openEdit = (a: Activity) => {
    setForm({ date: a.date, city: a.city, place: a.place, type: a.type, notes: a.notes, time: a.time ?? '', url: a.url ?? '', status: a.status ?? 'pendiente' })
    setEditId(a.id)
    setShowCost(false)
    setCostForm({ ...EMPTY_COST, currency: trip.currency ?? 'USD' })
    setModal('edit')
  }

  const handleSave = () => {
    if (!form.place.trim()) return
    const data: Omit<Activity, 'id'> = {
      ...form,
      place: form.place.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
      url: form.url?.trim() ?? '',
      time: form.time?.trim() ?? '',
    }
    if (modal === 'add') addActivity(tripId!, data)
    else if (modal === 'edit' && editId) updateActivity(tripId!, { ...data, id: editId })
    if (modal === 'add' && showCost && costForm.price > 0) {
      addExpense(tripId!, {
        concept: data.place,
        category: 'actividad',
        date: data.date,
        detail: data.city,
        price: costForm.price,
        paid: costForm.fullPay ? costForm.price : costForm.paid,
        currency: costForm.currency,
        reserved: true,
        paidBy: costForm.paidBy,
        includedTravelers: costForm.paidBy ? costForm.includedTravelers : [],
      })
    }
    setModal(null)
  }

  const cycleStatus = (a: Activity) => {
    const current = a.status ?? 'pendiente'
    updateActivity(tripId!, { ...a, status: STATUS_CYCLE[current] })
  }

  const f = (field: 'date' | 'city' | 'place' | 'type' | 'notes' | 'time' | 'url', val: string) =>
    setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="p-4 space-y-4 pb-28">
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Star size={52} />}
          title="Sin actividades"
          description="Agregá lugares, restaurantes y planes para cada día."
          action={<button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Agregar actividad</button>}
        />
      ) : (
        groupOrder.map(cityKey => {
          const acts = grouped[cityKey]
          const isSinCiudad = cityKey === '__sin_ciudad__'
          return (
            <div key={cityKey}>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {isSinCiudad ? 'Sin ciudad' : cityKey}
                </h3>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {acts.length} {acts.length === 1 ? 'actividad' : 'actividades'}
                </span>
              </div>
              <div className="space-y-2">
                {acts.map(a => {
                  const status = a.status ?? 'pendiente'
                  const cfg = STATUS_CONFIG[status]
                  const StatusIcon = cfg.icon
                  const isRealizada = status === 'realizada'
                  return (
                    <div key={a.id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-3 py-3 flex items-start gap-2 transition-opacity ${isRealizada ? 'opacity-60' : ''}`}>
                      <button
                        onClick={() => cycleStatus(a)}
                        className={`mt-0.5 shrink-0 transition-colors ${cfg.color}`}
                        title={`Estado: ${cfg.label} — click para cambiar`}
                      >
                        <StatusIcon size={18} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium text-gray-900 dark:text-white text-sm ${isRealizada ? 'line-through' : ''}`}>{a.place}</p>
                          {a.type && (
                            <span className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">{a.type}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.bg}`}>{cfg.label}</span>
                        </div>
                        {(a.date || a.time) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.date && <span className="text-xs text-gray-400 dark:text-gray-500">{fmtDateLong(a.date)}</span>}
                            {a.time && (
                              <span className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                                <Clock size={10} />
                                {a.time} hs
                              </span>
                            )}
                          </div>
                        )}
                        {a.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.notes}</p>}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {a.url && (
                          <a href={a.url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" aria-label="Abrir reserva">
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => navigate(`/viaje/${tripId}/gastos`, { state: { prefill: { concept: a.place, date: a.date, detail: a.city, category: 'actividad' } } })}
                          className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                          title="Agregar a gastos"
                        >
                          <CircleDollarSign size={14} />
                        </button>
                        <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Pencil size={14} /></button>
                        <button onClick={() => { if (confirm(`¿Eliminar "${a.place}"?`)) deleteActivity(tripId!, a.id) }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {sorted.length > 0 && (
        <button
          onClick={openAdd}
          className="fixed bottom-20 right-4 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95"
        >
          <Plus size={24} />
        </button>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nueva actividad' : 'Editar actividad'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Lugar / actividad *</label>
              <input className={inputCls} placeholder="Sagrada Familia"
                value={form.place} onChange={e => f('place', e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha</label>
                <DateInput className={inputCls} value={form.date} onChange={v => f('date', v)} />
                {dateOutOfRange && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Fuera del rango del viaje ({fmtDate(trip.startDate)} – {fmtDate(trip.endDate)})
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Hora</label>
                <TimeInput className={inputCls} value={form.time ?? ''} onChange={v => f('time', v)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Ciudad</label>
              <input className={inputCls} placeholder="Barcelona" value={form.city} onChange={e => f('city', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <div className="flex gap-2">
                {(['pendiente', 'reservada', 'realizada'] as ActivityStatus[]).map(s => {
                  const cfg = STATUS_CONFIG[s]
                  const Icon = cfg.icon
                  const active = form.status === s
                  return (
                    <button key={s} type="button"
                      onClick={() => setForm(p => ({ ...p, status: s }))}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium border transition-colors ${active ? cfg.bg : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>
                      <Icon size={13} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPES.map(tp => (
                  <button key={tp} type="button" onClick={() => f('type', form.type === tp ? '' : tp)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.type === tp ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {tp}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <input className={inputCls} placeholder="Horarios, reservas, etc." value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Link de reserva</label>
              <input type="url" className={inputCls} placeholder="https://..." value={form.url ?? ''} onChange={e => f('url', e.target.value)} />
            </div>
            {modal === 'add' && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={showCost} onChange={e => setShowCost(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Registrar costo</span>
                </label>
                {showCost && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Precio total</label>
                        <MoneyInput className={inputCls} value={costForm.price}
                          onChange={v => setCostForm(p => ({ ...p, price: v }))} />
                      </div>
                      <div>
                        <label className={labelCls}>Moneda</label>
                        <select className={inputCls + ' bg-white dark:bg-gray-700'} value={costForm.currency}
                          onChange={e => setCostForm(p => ({ ...p, currency: e.target.value }))}>
                          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Pagado</label>
                      <div className="flex gap-2 mb-2">
                        {([{ v: true, label: 'Total' }, { v: false, label: 'Parcial' }] as const).map(({ v, label }) => (
                          <button key={label} type="button"
                            onClick={() => setCostForm(p => ({ ...p, fullPay: v }))}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${costForm.fullPay === v ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      {!costForm.fullPay && (
                        <MoneyInput className={inputCls} value={costForm.paid}
                          onChange={v => setCostForm(p => ({ ...p, paid: v }))} />
                      )}
                    </div>
                    {trip.travelers.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">División entre viajeros (opcional)</p>
                        <div>
                          <label className={labelCls}>Pagado por</label>
                          <div className="flex flex-wrap gap-2">
                            {trip.travelers.map(tv => (
                              <button key={tv.id} type="button"
                                onClick={() => setCostForm(p => ({ ...p, paidBy: p.paidBy === tv.name ? '' : tv.name, includedTravelers: [] }))}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${costForm.paidBy === tv.name ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                                {tv.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        {costForm.paidBy && (
                          <div>
                            <label className={labelCls}>Incluye a</label>
                            <div className="flex flex-wrap gap-2">
                              {trip.travelers.map(tv => {
                                const included = costForm.includedTravelers
                                return (
                                  <button key={tv.id} type="button"
                                    onClick={() => setCostForm(p => {
                                      const cur = p.includedTravelers
                                      return { ...p, includedTravelers: cur.includes(tv.name) ? cur.filter(n => n !== tv.name) : [...cur, tv.name] }
                                    })}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${included.includes(tv.name) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                                    {tv.name}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <button onClick={handleSave} disabled={!form.place.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {modal === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
