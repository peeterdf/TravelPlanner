import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Star } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import type { Activity } from '../../types'

const ACTIVITY_TYPES = ['Museo', 'Restaurante', 'Excursión', 'Monumento', 'Show/Evento', 'Compras', 'Naturaleza', 'Playa', 'Otro']

const EMPTY: Omit<Activity, 'id'> = { date: '', city: '', place: '', type: '', notes: '' }

export function Activities() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, addActivity, updateActivity, deleteActivity } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Activity, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  if (!trip) return null

  const sorted = [...trip.activities].sort((a, b) => a.date.localeCompare(b.date))

  const grouped = sorted.reduce<Record<string, typeof sorted>>((acc, a) => {
    const key = `${a.date}|${a.city}`
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (a: Activity) => { setForm({ ...a }); setEditId(a.id); setModal('edit') }

  const handleSave = () => {
    if (!form.place) return
    if (modal === 'add') addActivity(tripId!, form)
    else if (modal === 'edit' && editId) updateActivity(tripId!, { ...form, id: editId })
    setModal(null)
  }

  const f = (field: keyof Omit<Activity, 'id'>, val: string) => setForm(p => ({ ...p, [field]: val }))

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
        Object.entries(grouped).map(([key, acts]) => {
          const [date, city] = key.split('|')
          return (
            <div key={key}>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{city || date}</h3>
                {city && <span className="text-xs text-gray-500">{date}</span>}
              </div>
              <div className="space-y-2">
                {acts.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{a.place}</p>
                        {a.type && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{a.type}</span>
                        )}
                      </div>
                      {a.notes && <p className="text-xs text-gray-500 mt-0.5">{a.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-gray-700"><Pencil size={15} /></button>
                      <button onClick={() => deleteActivity(tripId!, a.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Lugar / actividad *</label>
              <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Sagrada Familia"
                value={form.place} onChange={e => f('place', e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
                <input type="date" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm"
                  value={form.date} onChange={e => f('date', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad</label>
                <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Barcelona"
                  value={form.city} onChange={e => f('city', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPES.map(tp => (
                  <button key={tp} onClick={() => f('type', tp)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.type === tp ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-600'}`}>
                    {tp}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notas</label>
              <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" placeholder="Horarios, reservas, etc."
                value={form.notes} onChange={e => f('notes', e.target.value)} />
            </div>
            <button onClick={handleSave} disabled={!form.place}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {modal === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
