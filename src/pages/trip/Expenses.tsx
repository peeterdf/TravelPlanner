import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Plus, Trash2, Pencil, Wallet, CheckCircle2, Users, ArrowRight, Plane, Building2, UtensilsCrossed, Bus, Map, ShoppingBag, Package } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { useMask } from '../../store/settingsStore'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { DateInput } from '../../components/ui/DateInput'
import { MoneyInput } from '../../components/ui/MoneyInput'
import type { Expense, ExpenseCategory } from '../../types'

const fmtDate = (d: string) => d ? d.split('-').reverse().join('/') : ''

const CATEGORIES: { value: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'vuelo',       label: 'Vuelo',       icon: <Plane size={13} /> },
  { value: 'alojamiento', label: 'Alojamiento',  icon: <Building2 size={13} /> },
  { value: 'comida',      label: 'Comida',       icon: <UtensilsCrossed size={13} /> },
  { value: 'transporte',  label: 'Transporte',   icon: <Bus size={13} /> },
  { value: 'actividad',   label: 'Actividad',    icon: <Map size={13} /> },
  { value: 'compra',      label: 'Compra',       icon: <ShoppingBag size={13} /> },
  { value: 'otro',        label: 'Otro',         icon: <Package size={13} /> },
]

const EMPTY: Omit<Expense, 'id'> = {
  concept: '', date: '', detail: '', price: 0, paid: 0,
  reserved: false, currency: 'USD', paidBy: '', includedTravelers: [],
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'

const round2 = (n: number) => Math.round(n * 100) / 100

function calcSettlements(net: Record<string, number>) {
  const pos = Object.entries(net).filter(([, v]) => v > 0.005).map(([n, v]) => [n, round2(v)] as [string, number])
  const neg = Object.entries(net).filter(([, v]) => v < -0.005).map(([n, v]) => [n, round2(-v)] as [string, number])
  const result: { from: string; to: string; amount: number }[] = []
  let i = 0, j = 0
  while (i < pos.length && j < neg.length) {
    const amt = round2(Math.min(pos[i][1], neg[j][1]))
    result.push({ from: neg[j][0], to: pos[i][0], amount: amt })
    pos[i][1] = round2(pos[i][1] - amt)
    neg[j][1] = round2(neg[j][1] - amt)
    if (pos[i][1] < 0.005) i++
    if (neg[j][1] < 0.005) j++
  }
  return result
}

export function Expenses() {
  const { tripId } = useParams<{ tripId: string }>()
  const location = useLocation()
  const { trips, addExpense, updateExpense, deleteExpense } = useTripsStore()
  const mask = useMask()
  const trip = trips.find(t => t.id === tripId)
  const [tab, setTab] = useState<'gastos' | 'balance'>('gastos')
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [form, setForm] = useState<Omit<Expense, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [paidError, setPaidError] = useState('')

  const travelerNames = trip?.travelers.map(t => t.name) ?? []

  useEffect(() => {
    const prefill = (location.state as { prefill?: Partial<Omit<Expense, 'id'>> } | null)?.prefill
    if (prefill) {
      setForm({ ...EMPTY, currency: trip?.currency ?? 'USD', ...prefill, includedTravelers: [...travelerNames] })
      setModal('add')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!trip) return null

  const sorted = [...trip.expenses].sort((a, b) => a.date.localeCompare(b.date))
  const byCurrency = sorted.reduce<Record<string, { price: number; paid: number }>>((acc, e) => {
    const c = e.currency ?? currency
    const prev = acc[c] ?? { price: 0, paid: 0 }
    acc[c] = { price: prev.price + e.price, paid: prev.paid + e.paid }
    return acc
  }, {})
  const currencyTotals = Object.entries(byCurrency).map(([c, { price, paid }]) => ({ currency: c, price, paid, remaining: price - paid }))

  const splitExpenses = sorted.filter(e => e.paidBy)
  const currency = trip.currency ?? 'USD'

  const netBalance: Record<string, number> = {}
  for (const e of splitExpenses) {
    const included = e.includedTravelers?.length ? e.includedTravelers : travelerNames
    const share = included.length > 0 ? round2(e.price / included.length) : 0
    netBalance[e.paidBy!] = round2((netBalance[e.paidBy!] ?? 0) + e.price)
    for (const p of included) netBalance[p] = round2((netBalance[p] ?? 0) - share)
  }

  const settlements = calcSettlements(netBalance)

  const openAdd = () => {
    setForm({ ...EMPTY, currency: trip.currency ?? 'USD', includedTravelers: [...travelerNames] })
    setModal('add')
  }
  const openEdit = (e: Expense) => {
    setForm({ ...e, includedTravelers: e.includedTravelers ?? [...travelerNames] })
    setEditId(e.id)
    setModal('edit')
  }

  const handleSave = () => {
    const concept = form.concept.trim()
    if (!concept) return
    if (form.paid > form.price) { setPaidError('El monto pagado no puede superar el precio total.'); return }
    setPaidError('')
    const { category, paidBy, ...rest } = form
    const data = {
      ...rest,
      concept,
      detail: form.detail.trim(),
      ...(category ? { category } : {}),
      ...(paidBy ? { paidBy, includedTravelers: form.includedTravelers } : { includedTravelers: [] }),
    }
    if (modal === 'add') addExpense(tripId!, data)
    else if (modal === 'edit' && editId) updateExpense(tripId!, { ...data, id: editId })
    setModal(null)
  }

  const f = (field: keyof Omit<Expense, 'id'>, val: string | number | boolean | string[]) =>
    setForm(p => ({ ...p, [field]: val }))

  const toggleIncluded = (name: string) => {
    const cur = form.includedTravelers ?? []
    f('includedTravelers', cur.includes(name) ? cur.filter(n => n !== name) : [...cur, name])
  }

  const tabBtn = (t: 'gastos' | 'balance', label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`px-4 py-2 text-sm font-medium transition-colors ${tab === t
        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col pb-28">
      {/* Summary bar — only on gastos tab */}
      {tab === 'gastos' && sorted.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2 divide-y divide-gray-50 dark:divide-gray-700">
          {currencyTotals.map(ct => (
            <div key={ct.currency} className="grid grid-cols-3 text-center py-1.5">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{ct.currency} {mask.amount2(ct.price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pagado</p>
                <p className="font-bold text-green-600 dark:text-green-400 text-sm">{ct.currency} {mask.amount2(ct.paid)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente</p>
                <p className={`font-bold text-sm ${ct.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {ct.currency} {mask.amount2(ct.remaining)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 px-4 bg-white dark:bg-gray-900">
        {tabBtn('gastos', 'Gastos')}
        {tabBtn('balance', `Balance${splitExpenses.length > 0 ? ` (${splitExpenses.length})` : ''}`)}
      </div>

      {/* GASTOS TAB */}
      {tab === 'gastos' && (
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{e.concept}</p>
                      {e.category && (() => {
                        const cat = CATEGORIES.find(c => c.value === e.category)
                        return cat ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                            {cat.icon}{cat.label}
                          </span>
                        ) : null
                      })()}
                      {e.reserved && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 px-1.5 py-0.5 rounded-full">
                          <CheckCircle2 size={11} /> Reservado
                        </span>
                      )}
                    </div>
                    {e.detail && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{e.detail}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      {e.date && <span>{fmtDate(e.date)}</span>}
                      <span className="text-gray-900 dark:text-white font-medium">{e.currency} {mask.amount2(e.price)}</span>
                      {e.paid > 0 && <span className="text-green-600 dark:text-green-400">Pag: {mask.amount2(e.paid)}</span>}
                      {e.paidBy && (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Pagó {mask.name(e.paidBy)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><Pencil size={15} /></button>
                    <button onClick={() => { if (confirm(`¿Eliminar "${e.concept}"?`)) deleteExpense(tripId!, e.id) }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* BALANCE TAB */}
      {tab === 'balance' && (
        <div className="p-4 space-y-4">
          {splitExpenses.length === 0 ? (
            <EmptyState
              icon={<Users size={52} />}
              title="Sin datos de división"
              description='Indicá "Pagado por" en cada gasto para ver el balance entre viajeros.'
            />
          ) : (
            <>
              {/* Balance per person */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Balance por persona</p>
                <div className="space-y-2">
                  {Object.entries(netBalance).sort((a, b) => b[1] - a[1]).map(([person, net]) => (
                    <div key={person} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{mask.name(person)}</span>
                      <span className={`text-xs font-medium ${net > 0.5 ? 'text-green-600 dark:text-green-400' : net < -0.5 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                        {net > 0.5 ? `le deben ${mask.amount(net)}` : net < -0.5 ? `debe ${mask.amount(Math.abs(net))}` : '✓ par'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlements */}
              {settlements.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Cómo saldar</p>
                  <div className="space-y-2.5">
                    {settlements.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">{mask.name(s.from)}</span>
                        <ArrowRight size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white">{mask.name(s.to)}</span>
                        <span className="ml-auto text-gray-700 dark:text-gray-300 font-semibold">{currency} {mask.amount2(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <button
        onClick={openAdd}
        className="fixed bottom-20 right-4 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95"
      >
        <Plus size={24} />
      </button>

      {modal && (
        <Modal title={modal === 'add' ? 'Nuevo gasto' : 'Editar gasto'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Concepto *</label>
              <input className={inputCls} placeholder="Alojamiento París"
                value={form.concept} onChange={e => f('concept', e.target.value)} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat.value} type="button"
                    onClick={() => setForm(p => form.category === cat.value
                      ? (({ category: _, ...rest }) => rest)(p) as typeof p
                      : { ...p, category: cat.value })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.category === cat.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                    {cat.icon}{cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Precio</label>
                <MoneyInput className={inputCls} value={form.price}
                  onChange={v => f('price', v)} />
              </div>
              <div>
                <label className={labelCls}>Moneda</label>
                <select className={inputCls + ' bg-white dark:bg-gray-700'}
                  value={form.currency} onChange={e => f('currency', e.target.value)}>
                  {['USD', 'EUR', 'ARS', 'GBP', 'BRL', 'CLP', 'MXN', 'COP'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Pagado</label>
                <MoneyInput className={inputCls} value={form.paid}
                  onChange={v => f('paid', v)} />
              </div>
              <div>
                <label className={labelCls}>Fecha</label>
                <DateInput className={inputCls} value={form.date}
                  onChange={v => f('date', v)} />
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

            {/* División section */}
            {travelerNames.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic border-t border-gray-100 dark:border-gray-700 pt-3">
                Agregá viajeros al viaje para registrar quién pagó y dividir el gasto.
              </p>
            ) : (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">División entre viajeros (opcional)</p>
                <div>
                  <label className={labelCls}>Pagado por</label>
                  <div className="flex flex-wrap gap-2">
                    {travelerNames.map(n => (
                      <button key={n} type="button" onClick={() => f('paidBy', form.paidBy === n ? '' : n)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.paidBy === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {form.paidBy && (
                  <div>
                    <label className={labelCls}>Incluye a</label>
                    <div className="flex flex-wrap gap-2">
                      {travelerNames.map(n => {
                        const included = form.includedTravelers ?? []
                        return (
                          <button key={n} type="button" onClick={() => toggleIncluded(n)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${included.includes(n) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                            {n}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {paidError && <p className="text-xs text-red-500 dark:text-red-400">{paidError}</p>}
            <button onClick={handleSave} disabled={!form.concept.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors">
              {modal === 'add' ? 'Agregar' : 'Guardar cambios'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
