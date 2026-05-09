import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Pencil, Building2, Phone, MapPin, Key, Hash, ExternalLink, CircleDollarSign } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { DateInput } from '../../components/ui/DateInput'
import { MoneyInput } from '../../components/ui/MoneyInput'
import type { Accommodation } from '../../types'

const CURRENCIES = ['USD', 'EUR', 'ARS', 'GBP', 'BRL', 'CLP', 'MXN', 'COP']
const EMPTY_COST = { price: 0, currency: 'USD', paid: 0, fullPay: true, paidBy: '', includedTravelers: [] as string[] }

const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : ''

const EMPTY: Omit<Accommodation, 'id'> = {
  city: '', checkInDate: '', nights: 1, confirmationCode: '', pin: '', phone: '', address: '', notes: '', url: '',
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

export function Accommodations() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { trips, addAccommodation, updateAccommodation, deleteAccommodation, addExpense } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Accommodation, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showPin, setShowPin] = useState<Record<string, boolean>>({})
  const [showCost, setShowCost] = useState(false)
  const [costForm, setCostForm] = useState(EMPTY_COST)

  if (!trip) return null

  const openAdd = () => {
    setForm(EMPTY)
    setShowCost(false)
    setCostForm({ ...EMPTY_COST, currency: trip.currency ?? 'USD' })
    setModal('add')
  }
  const openEdit = (a: Accommodation) => {
    setForm({ ...a })
    setEditId(a.id)
    setShowCost(false)
    setCostForm({ ...EMPTY_COST, currency: trip.currency ?? 'USD' })
    setModal('edit')
  }

  const handleSave = () => {
    if (!form.city.trim()) return
    const data = {
      ...form,
      city: form.city.trim(),
      confirmationCode: form.confirmationCode.trim(),
      pin: form.pin.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
      url: form.url.trim(),
    }
    if (modal === 'add') addAccommodation(tripId!, data)
    else if (modal === 'edit' && editId) updateAccommodation(tripId!, { ...data, id: editId })
    if (modal === 'add' && showCost && costForm.price > 0) {
      addExpense(tripId!, {
        concept: `Alojamiento ${data.city}`,
        category: 'alojamiento',
        date: data.checkInDate,
        detail: data.confirmationCode,
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

  const f = (field: keyof Omit<Accommodation, 'id'>, val: string | number) =>
    setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="p-4 space-y-3 pb-28">
      {trip.accommodations.length === 0 ? (
        <EmptyState
          icon={<Building2 size={52} />}
          title="Sin alojamientos"
          description="Agregá los lugares donde van a quedarse."
          action={<button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Agregar alojamiento</button>}
        />
      ) : (
        trip.accommodations.map(a => (
          <div key={a.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{a.city}</h3>
                  <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                    {a.checkInDate ? `${fmtDate(a.checkInDate)} · ` : ''}{a.nights} noche{a.nights !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {a.confirmationCode && (
                    <div className="flex items-center gap-2 text-sm">
                      <Hash size={13} className="text-gray-400 shrink-0" />
                      <span className="font-mono text-gray-700 dark:text-gray-300">{a.confirmationCode}</span>
                    </div>
                  )}
                  {a.pin && (
                    <div className="flex items-center gap-2 text-sm">
                      <Key size={13} className="text-gray-400 shrink-0" />
                      <button
                        className="font-mono text-gray-700 dark:text-gray-300 select-none"
                        onClick={() => setShowPin(p => ({ ...p, [a.id]: !p[a.id] }))}
                      >
                        {showPin[a.id] ? a.pin : '••••'}
                        <span className="ml-2 text-xs text-blue-500">{showPin[a.id] ? 'ocultar' : 'ver PIN'}</span>
                      </button>
                    </div>
                  )}
                  {a.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      <a href={`tel:${a.phone}`} className="text-blue-600 dark:text-blue-400">{a.phone}</a>
                    </div>
                  )}
                  {a.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300 leading-tight">{a.address}</span>
                    </div>
                  )}
                  {a.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{a.notes}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" aria-label="Abrir reserva">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => navigate(`/viaje/${tripId}/gastos`, { state: { prefill: {
                    concept: `Alojamiento ${a.city}`,
                    date: a.checkInDate || '',
                    detail: a.confirmationCode || '',
                    category: 'alojamiento',
                  }}})}
                  className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                  title="Agregar a gastos"
                >
                  <CircleDollarSign size={16} />
                </button>
                <button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <Pencil size={16} />
                </button>
                <button onClick={() => { if (confirm(`¿Eliminar alojamiento en ${a.city}?`)) deleteAccommodation(tripId!, a.id) }} className="p-2 text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {trip.accommodations.length > 0 && (
        <button
          onClick={openAdd}
          className="fixed bottom-20 right-4 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95"
        >
          <Plus size={24} />
        </button>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nuevo alojamiento' : 'Editar alojamiento'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ciudad *</label>
                <input className={inputCls} placeholder="Barcelona" value={form.city} onChange={e => f('city', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Noches</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={inputCls}
                  placeholder="3"
                  value={form.nights === 0 ? '' : String(form.nights)}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, '')
                    f('nights', v === '' ? 1 : Math.max(1, parseInt(v)))
                  }}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Check-in</label>
              <DateInput className={inputCls} value={form.checkInDate} onChange={v => f('checkInDate', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Cód. confirmación</label>
                <input className={inputCls + ' font-mono'} placeholder="HMJQ3RSX3X"
                  value={form.confirmationCode} onChange={e => f('confirmationCode', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>PIN / Contraseña</label>
                <input className={inputCls} placeholder="8626" value={form.pin} onChange={e => f('pin', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input className={inputCls} placeholder="+34 601 50 52 25" value={form.phone} onChange={e => f('phone', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Dirección</label>
              <input className={inputCls} placeholder="Calle, número, ciudad" value={form.address} onChange={e => f('address', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <input className={inputCls} placeholder="Instrucciones de llegada, etc." value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Link de reserva</label>
              <input type="url" className={inputCls} placeholder="https://www.booking.com/..." value={form.url} onChange={e => f('url', e.target.value)} />
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
            <button onClick={handleSave} disabled={!form.city}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {modal === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
