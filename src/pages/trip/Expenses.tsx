import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Wallet, CheckCircle2 } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { useMask } from '../../store/settingsStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import type { Expense } from '../../types'

const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : ''

const EMPTY: Omit<Expense, 'id'> = {
  concept: '', date: '', detail: '', price: 0, paid: 0, reserved: false, currency: 'USD',
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

export function Expenses() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, addExpense, updateExpense, deleteExpense } = useTripsStore()
  const mask = useMask()
  const trip = trips.find(t => t.id === tripId)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Expense, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  if (!trip) return null

  const sorted = [...trip.expenses].sort((a, b) => a.date.localeCompare(b.date))
  const totalPrice = sorted.reduce((s, e) => s + e.price, 0)
  const totalPaid = sorted.reduce((s, e) => s + e.paid, 0)
  const remaining = totalPrice - totalPaid

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (e: Expense) => { setForm({ ...e }); setEditId(e.id); setModal('edit') }

  const handleSave = () => {
    if (!form.concept) return
    if (modal === 'add') addExpense(tripId!, form)
    else if (modal === 'edit' && editId) updateExpense(tripId!, { ...form, id: editId })
    setModal(null)
  }

  const f = (field: keyof Omit<Expense, 'id'>, val: string | number | boolean) =>
    setForm(p => ({ ...p, [field]: val }))

  return (
    <div className="flex flex-col pb-28">
      {/* Summary bar */}
      {sorted.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 grid grid-cols-3 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="font-bold text-gray-900 dark:text-white">{sorted[0]?.currency} {mask.amount2(totalPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pagado</p>
            <p className="font-bold text-green-600 dark:text-green-400">{sorted[0]?.currency} {mask.amount2(totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente</p>
            <p className={`font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {sorted[0]?.currency} {mask.amount2(remaining)}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-2">
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Wallet size={52} />}
            title="Sin gastos registrados"
            description="Agregá los gastos del viaje para llevar el control."
            action={<button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium">Agregar gasto</button>}
          />
        ) : (
          sorted.map(e => (
            <div key={e.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{e.concept}</p>
                    {e.reserved && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Reservado
                      </span>
                    )}
                  </div>
                  {e.detail && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{e.detail}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {e.date && <span>{fmtDate(e.date)}</span>}
                    <span className="text-gray-900 dark:text-white font-medium">{e.currency} {mask.amount2(e.price)}</span>
                    {e.paid > 0 && <span className="text-green-600 dark:text-green-400">Pag: {e.currency} {mask.amount2(e.paid)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Pencil size={15} /></button>
                  <button onClick={() => deleteExpense(tripId!, e.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {sorted.length > 0 && (
        <button
          onClick={openAdd}
          className="fixed bottom-20 right-4 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95"
        >
          <Plus size={24} />
        </button>
      )}

      {modal && (
        <Modal title={modal === 'add' ? 'Nuevo gasto' : 'Editar gasto'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Concepto *</label>
              <input className={inputCls} placeholder="Alojamiento París"
                value={form.concept} onChange={e => f('concept', e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Precio</label>
                <input type="number" min="0" step="0.01" className={inputCls}
                  value={form.price} onChange={e => f('price', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelCls}>Moneda</label>
                <select className={inputCls + ' bg-white dark:bg-gray-700'}
                  value={form.currency} onChange={e => f('currency', e.target.value)}>
                  {['USD', 'EUR', 'ARS', 'GBP', 'BRL'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Pagado</label>
                <input type="number" min="0" step="0.01" className={inputCls}
                  value={form.paid} onChange={e => f('paid', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <input type="date" className={inputCls}
                  value={form.date} onChange={e => f('date', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Detalle</label>
              <input className={inputCls} placeholder="Detalles adicionales"
                value={form.detail} onChange={e => f('detail', e.target.value)} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded accent-blue-600"
                checked={form.reserved} onChange={e => f('reserved', e.target.checked)} />
              <span className="text-sm text-gray-700 dark:text-gray-300">Marcado como reservado</span>
            </label>
            <button onClick={handleSave} disabled={!form.concept}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {modal === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
