import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, CheckSquare } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'

export function Packing() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, togglePackingItem, addPackingItem, deletePackingItem } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [newItem, setNewItem] = useState<Record<string, string>>({})
  const [openCat, setOpenCat] = useState<string | null>(null)

  if (!trip) return null

  const handleAdd = (catId: string) => {
    const name = (newItem[catId] ?? '').trim()
    if (!name) return
    addPackingItem(tripId!, catId, name)
    setNewItem(p => ({ ...p, [catId]: '' }))
  }

  return (
    <div className="p-4 space-y-3 pb-28">
      {trip.packingList.map(cat => {
        const checked = cat.items.filter(i => i.checked).length
        const total = cat.items.length
        const isOpen = openCat === cat.id
        return (
          <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <button
              onClick={() => setOpenCat(isOpen ? null : cat.id)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <CheckSquare size={18} className={checked === total && total > 0 ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'} />
                <span className="font-semibold text-gray-900 dark:text-white">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                  checked === total && total > 0
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {checked}/{total}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-lg leading-none">{isOpen ? '−' : '+'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {/* Progress bar */}
                <div className="h-1 bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-1 bg-green-500 transition-all"
                    style={{ width: total > 0 ? `${(checked / total) * 100}%` : '0%' }}
                  />
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                  {cat.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <button
                        onClick={() => togglePackingItem(tripId!, cat.id, item.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-500'
                        }`}
                      >
                        {item.checked && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                      <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        {item.name}
                      </span>
                      <button
                        onClick={() => deletePackingItem(tripId!, cat.id, item.id)}
                        className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-400 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <input
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="Agregar ítem..."
                    value={newItem[cat.id] ?? ''}
                    onChange={e => setNewItem(p => ({ ...p, [cat.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(cat.id) }}
                  />
                  <button
                    onClick={() => handleAdd(cat.id)}
                    className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
