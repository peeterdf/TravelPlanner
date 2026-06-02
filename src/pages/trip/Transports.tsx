import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Pencil, Plane, ExternalLink, CircleDollarSign, Ticket } from 'lucide-react'
import { DateInput } from '../../components/ui/DateInput'
import { TimeInput } from '../../components/ui/TimeInput'
import { MoneyInput } from '../../components/ui/MoneyInput'
import { useTripsStore } from '../../store/tripsStore'
import { useBoardingPassStore } from '../../store/boardingPassStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { TransportBadge } from '../../components/ui/Badge'
import type { Transport, TransportType } from '../../types'

const CURRENCIES = ['USD', 'EUR', 'ARS', 'GBP', 'BRL', 'CLP', 'MXN', 'COP']
const EMPTY_COST = { price: 0, currency: 'USD', paid: 0, fullPay: true, paidBy: '', includedTravelers: [] as string[] }

const TRANSPORT_TYPES: TransportType[] = ['avión', 'tren', 'bus', 'auto', 'barco', 'otro']

const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : ''

const EMPTY: Omit<Transport, 'id'> = {
  origin: '', destination: '', departureDate: '', departureTime: '',
  arrivalDate: '', arrivalTime: '', bookingCode: '', company: '',
  type: 'avión', notes: '', url: '',
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

export function Transports() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { trips, addTransport, updateTransport, deleteTransport, addExpense } = useTripsStore()
  const { passes } = useBoardingPassStore()
  const trip = trips.find(t => t.id === tripId)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Transport, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  const [formError, setFormError] = useState('')
  const [showCost, setShowCost] = useState(false)
  const [costForm, setCostForm] = useState(EMPTY_COST)

  if (!trip) return null

  const sorted = [...trip.transports].sort((a, b) => {
    if (!a.departureDate && !b.departureDate) return 0
    if (!a.departureDate) return 1
    if (!b.departureDate) return -1
    return (a.departureDate + (a.departureTime || '')).localeCompare(b.departureDate + (b.departureTime || ''))
  })

  const openAdd = () => {
    setForm(EMPTY)
    setShowCost(false)
    setCostForm({ ...EMPTY_COST, currency: trip.currency ?? 'USD' })
    setModal('add')
  }
  const openEdit = (t: Transport) => {
    setForm({ ...t })
    setEditId(t.id)
    setShowCost(false)
    setCostForm({ ...EMPTY_COST, currency: trip.currency ?? 'USD' })
    setModal('edit')
  }

  const handleSave = () => {
    if (!form.origin.trim() || !form.destination.trim()) return
    if (form.arrivalDate && !form.departureDate) {
      setFormError('Ingresá la fecha de salida antes de agregar la llegada.')
      return
    }
    if (form.departureDate && form.arrivalDate && form.arrivalDate < form.departureDate) {
      setFormError('La llegada no puede ser antes que la salida.')
      return
    }
    if (form.departureDate && form.arrivalDate && form.arrivalDate === form.departureDate
        && form.departureTime && form.arrivalTime && form.arrivalTime < form.departureTime) {
      setFormError('La hora de llegada no puede ser antes que la de salida.')
      return
    }
    setFormError('')
    const data = {
      ...form,
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      company: form.company.trim(),
      bookingCode: form.bookingCode.trim(),
      notes: form.notes.trim(),
      url: form.url.trim(),
    }
    if (modal === 'add') addTransport(tripId!, data)
    else if (modal === 'edit' && editId) updateTransport(tripId!, { ...data, id: editId })
    if (modal === 'add' && showCost && costForm.price > 0) {
      addExpense(tripId!, {
        concept: `${data.origin} → ${data.destination}`,
        category: data.type === 'avión' ? 'vuelo' : 'transporte',
        date: data.departureDate,
        detail: data.company,
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

  const f = (field: keyof Omit<Transport, 'id'>, val: string) => setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="p-4 space-y-3 pb-28">
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Plane size={52} />}
          title="Sin tramos de viaje"
          description="Agregá los vuelos, trenes y buses de tu itinerario."
          action={<button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Agregar tramo</button>}
        />
      ) : (
        sorted.map(t => (
          <div key={t.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TransportBadge type={t.type} />
                  {t.company && <span className="text-xs text-gray-500 dark:text-gray-400">{t.company}</span>}
                  {t.bookingCode && (
                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                      {t.bookingCode}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t.origin} → {t.destination}
                </p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  <p>Salida: {fmtDate(t.departureDate)} {t.departureTime && `a las ${t.departureTime}`}</p>
                  <p>Llegada: {fmtDate(t.arrivalDate)} {t.arrivalTime && `a las ${t.arrivalTime}`}</p>
                  {t.notes && <p className="text-blue-600 dark:text-blue-400 mt-1">{t.notes}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {t.url && (
                  <a href={t.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" aria-label="Abrir reserva">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => navigate(`/viaje/${tripId}/gastos`, { state: { prefill: {
                    concept: `${t.origin} → ${t.destination}`,
                    date: t.departureDate,
                    detail: t.company || '',
                    category: t.type === 'avión' ? 'vuelo' : 'transporte',
                  }}})}
                  className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  title="Agregar a gastos"
                >
                  <CircleDollarSign size={16} />
                </button>
                <button
                  onClick={() => navigate(`/viaje/${tripId}/pases`)}
                  className={`p-2 transition-colors ${passes.some(p => p.transportId === t.id && p.tripId === tripId) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
                  title="Pases de embarque"
                >
                  <Ticket size={16} />
                </button>
                <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <Pencil size={16} />
                </button>
                <button onClick={() => { if (confirm(`¿Eliminar "${t.origin} → ${t.destination}"?`)) deleteTransport(tripId!, t.id) }} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
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
        <Modal title={modal === 'add' ? 'Nuevo tramo' : 'Editar tramo'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Origen *</label>
                <input className={inputCls} placeholder="Buenos Aires" value={form.origin} onChange={e => f('origin', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Destino *</label>
                <input className={inputCls} placeholder="Barcelona" value={form.destination} onChange={e => f('destination', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_TYPES.map(tp => (
                  <button key={tp} onClick={() => f('type', tp)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.type === tp ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {tp}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha salida</label>
                <DateInput className={inputCls} value={form.departureDate} onChange={v => f('departureDate', v)} />
              </div>
              <div>
                <label className={labelCls}>Hora salida</label>
                <TimeInput className={inputCls} value={form.departureTime} onChange={v => f('departureTime', v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha llegada</label>
                <DateInput className={inputCls} value={form.arrivalDate} onChange={v => f('arrivalDate', v)} />
              </div>
              <div>
                <label className={labelCls}>Hora llegada</label>
                <TimeInput className={inputCls} value={form.arrivalTime} onChange={v => f('arrivalTime', v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Empresa</label>
                <input className={inputCls} placeholder="Ryanair" value={form.company} onChange={e => f('company', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Cód. reserva</label>
                <input className={inputCls + ' font-mono uppercase'} placeholder="WZSLUN"
                  value={form.bookingCode} onChange={e => f('bookingCode', e.target.value.toUpperCase())} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notas (escalas, tiempo antes, etc.)</label>
              <input className={inputCls} placeholder="Escala en Madrid" value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Link de reserva</label>
              <input type="url" className={inputCls} placeholder="https://www.ryanair.com/..." value={form.url} onChange={e => f('url', e.target.value)} />
            </div>
            {formError && <p className="text-xs text-danger">{formError}</p>}
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
            <button onClick={handleSave} disabled={!form.origin || !form.destination}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {modal === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
