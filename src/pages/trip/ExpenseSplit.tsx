import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Users } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { useMask } from '../../store/settingsStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import type { ExpenseSplit } from '../../types'

const EMPTY: Omit<ExpenseSplit, 'id'> = { concept: '', paidBy: '', currency: 'USD', amount: 0 }

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

export function ExpenseSplitPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, addSplit, updateSplit, deleteSplit } = useTripsStore()
  const mask = useMask()
  const trip = trips.find(t => t.id === tripId)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<ExpenseSplit, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  if (!trip) return null

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (s: ExpenseSplit) => { setForm({ ...s }); setEditId(s.id); setModal('edit') }

  const handleSave = () => {
    if (!form.concept || !form.paidBy) return
    if (modal === 'add') addSplit(tripId!, form)
    else if (modal === 'edit' && editId) updateSplit(tripId!, { ...form, id: editId })
    setModal(null)
  }

  const f = (field: keyof Omit<ExpenseSplit, 'id'>, val: string | number) =>
    setForm(p => ({ ...p, [field]: val }))

  const byPerson = trip.expenseSplits.reduce<Record<string, number>>((acc, s) => {
    acc[s.paidBy] = (acc[s.paidBy] ?? 0) + s.amount
    return acc
  }, {})

  const grandTotal = Object.values(byPerson).reduce((a, b) => a + b, 0)
  const perPerson = grandTotal / (Object.keys(byPerson).length || 1)
  const travelerNames = trip.travelers.map(t => t.name)

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Summary */}
      {Object.keys(byPerson).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Resumen por persona</p>
          <div className="space-y-2">
            {Object.entries(byPerson).sort((a, b) => b[1] - a[1]).map(([person, total]) => {
              const diff = total - perPerson
              return (
                <div key={person} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{mask.name(person)}</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{mask.amount(total)}</span>
                    <span className={`ml-2 text-xs font-medium ${diff > 0.5 ? 'text-green-600 dark:text-green-400' : diff < -0.5 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                      {diff > 0.5
                        ? `le deben ${mask.amount(diff)}`
                        : diff < -0.5
                          ? `debe ${mask.amount(Math.abs(diff))}`
                          : '✓ par'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total grupal</span>
            <span className="font-bold text-gray-900 dark:text-white">{mask.amount(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Por persona ({Object.keys(byPerson).length} viajeros)</span>
            <span className="font-medium">{mask.amount(perPerson)}</span>
          </div>
        </div>
      )}

      {/* List */}
      {trip.expenseSplits.length === 0 ? (
        <EmptyState
          icon={<Users size={52} />}
          title="Sin registros de división"
          description="Agregá quién pagó cada gasto para calcular las deudas."
          action={<button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Agregar registro</button>}
        />
      ) : (
        <div className="space-y-2">
          {trip.expenseSplits.map(s => (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{s.concept}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Pagó: <span className="font-semibold text-gray-700 dark:text-gray-300">{mask.name(s.paidBy)}</span>
                  {' · '}<span className="font-medium">{s.currency} {mask.amount(s.amount)}</span>
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Pencil size={15} /></button>
                <button onClick={() => deleteSplit(tripId!, s.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {trip.expenseSplits.length > 0 && (
        <button
          onClick={openAdd}
          className="fixed bottom-20 right-4 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95"
        >
          <Plus size={24} />
        </button>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nuevo registro' : 'Editar registro'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Concepto *</label>
              <input className={inputCls} placeholder="Alojamiento Londres"
                value={form.concept} onChange={e => f('concept', e.target.value)} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Pagado por *</label>
              {travelerNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {travelerNames.map(n => (
                    <button key={n} onClick={() => f('paidBy', n)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.paidBy === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <input className={inputCls} placeholder="Nombre"
                  value={form.paidBy} onChange={e => f('paidBy', e.target.value)} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Monto</label>
                <input type="number" min="0" step="0.01" className={inputCls}
                  value={form.amount} onChange={e => f('amount', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelCls}>Moneda</label>
                <select className={inputCls + ' bg-white dark:bg-gray-700'}
                  value={form.currency} onChange={e => f('currency', e.target.value)}>
                  {['USD', 'EUR', 'ARS', 'GBP', 'BRL'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleSave} disabled={!form.concept || !form.paidBy}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {modal === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
