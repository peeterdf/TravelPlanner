import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Plane } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { TransportBadge } from '../../components/ui/Badge'
import type { Transport, TransportType } from '../../types'

const TRANSPORT_TYPES: TransportType[] = ['avión', 'tren', 'bus', 'auto', 'barco', 'otro']

const EMPTY: Omit<Transport, 'id'> = {
  origin: '', destination: '', departureDate: '', departureTime: '',
  arrivalDate: '', arrivalTime: '', bookingCode: '', company: '',
  type: 'avión', notes: '',
}

export function Transports() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, addTransport, updateTransport, deleteTransport } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Transport, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  if (!trip) return null

  const sorted = [...trip.transports].sort((a, b) =>
    (a.departureDate + a.departureTime).localeCompare(b.departureDate + b.departureTime))

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (t: Transport) => { setForm({ ...t }); setEditId(t.id); setModal('edit') }

  const handleSave = () => {
    if (!form.origin || !form.destination) return
    if (modal === 'add') addTransport(tripId!, form)
    else if (modal === 'edit' && editId) updateTransport(tripId!, { ...form, id: editId })
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
          <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <TransportBadge type={t.type} />
                  {t.company && <span className="text-xs text-gray-500">{t.company}</span>}
                  {t.bookingCode && (
                    <span className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                      {t.bookingCode}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900">
                  {t.origin} → {t.destination}
                </p>
                <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                  <p>Salida: {t.departureDate} {t.departureTime && `a las ${t.departureTime}`}</p>
                  <p>Llegada: {t.arrivalDate} {t.arrivalTime && `a las ${t.arrivalTime}`}</p>
                  {t.notes && <p className="text-blue-600 mt-1">{t.notes}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(t)} className="p-2 text-gray-400 hover:text-gray-700">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteTransport(tripId!, t.id)} className="p-2 text-gray-400 hover:text-red-500">
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Origen *</label>
                <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Buenos Aires"
                  value={form.origin} onChange={e => f('origin', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Destino *</label>
                <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Barcelona"
                  value={form.destination} onChange={e => f('destination', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_TYPES.map(tp => (
                  <button key={tp} onClick={() => f('type', tp)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.type === tp ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600'}`}>
                    {tp}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha salida</label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  value={form.departureDate} onChange={e => f('departureDate', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hora salida</label>
                <input type="time" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  value={form.departureTime} onChange={e => f('departureTime', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha llegada</label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  value={form.arrivalDate} onChange={e => f('arrivalDate', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hora llegada</label>
                <input type="time" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  value={form.arrivalTime} onChange={e => f('arrivalTime', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
                <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Ryanair"
                  value={form.company} onChange={e => f('company', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cód. reserva</label>
                <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm font-mono uppercase" placeholder="WZSLUN"
                  value={form.bookingCode} onChange={e => f('bookingCode', e.target.value.toUpperCase())} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notas (escalas, tiempo antes, etc.)</label>
              <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Escala en Madrid"
                value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
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
