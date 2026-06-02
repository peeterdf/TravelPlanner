import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, CheckSquare } from 'lucide-react'
import { useTripsStore } from '../../store/tripsStore'
import { Modal } from '../../components/ui/Modal'

export function Packing() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, togglePackingItem, addPackingItem, deletePackingItem,
          addPackingCategory, deletePackingCategory, resetPackingChecked } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [newItem, setNewItem] = useState<Record<string, string>>({})
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [newCat, setNewCat] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ catId: string; catName: string; itemCount: number } | null>(null)

  if (!trip) return null

  const totalChecked = trip.packingList.flatMap(c => c.items).filter(i => i.checked).length
  const totalItems = trip.packingList.flatMap(c => c.items).length

  const handleAddItem = (catId: string) => {
    const name = (newItem[catId] ?? '').trim()
    if (!name) return
    addPackingItem(tripId!, catId, name)
    setNewItem(p => ({ ...p, [catId]: '' }))
  }

  const handleAddCat = () => {
    const name = newCat.trim()
    if (!name) return
    addPackingCategory(tripId!, name)
    setNewCat('')
  }

  const handleDeleteCat = (catId: string, catName: string, itemCount: number) => {
    if (itemCount === 0) {
      deletePackingCategory(tripId!, catId)
      if (openCat === catId) setOpenCat(null)
    } else {
      setDeleteConfirm({ catId, catName, itemCount })
    }
  }

  const confirmDeleteCat = () => {
    if (!deleteConfirm) return
    deletePackingCategory(tripId!, deleteConfirm.catId)
    if (openCat === deleteConfirm.catId) setOpenCat(null)
    setDeleteConfirm(null)
  }

  return (
    <div className="p-4 space-y-3 pb-28">
      {/* Header con totales y reset */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">{totalChecked}/{totalItems}</span> ítems listos
        </p>
        {totalChecked > 0 && (
          <button
            onClick={() => { if (confirm('¿Desmarcar todos los ítems?')) resetPackingChecked(tripId!) }}
            className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
          >
            Resetear tildados
          </button>
        )}
      </div>

      {trip.packingList.map(cat => {
        const checked = cat.items.filter(i => i.checked).length
        const total = cat.items.length
        const isOpen = openCat === cat.id
        return (
          <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center w-full px-4 py-3 gap-2">
              <button
                onClick={() => setOpenCat(isOpen ? null : cat.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <CheckSquare size={18} className={checked === total && total > 0 ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'} />
                <span className="font-semibold text-gray-900 dark:text-white truncate">{cat.name}</span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`chip ${
                  checked === total && total > 0 ? 'chip-success' : 'chip-neutral'
                }`}>
                  {checked}/{total}
                </span>
                <button
                  onClick={() => handleDeleteCat(cat.id, cat.name, cat.items.length)}
                  className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors"
                  title="Eliminar categoría"
                >
                  <Trash2 size={13} />
                </button>
                <span
                  onClick={() => setOpenCat(isOpen ? null : cat.id)}
                  className="text-gray-400 dark:text-gray-500 text-lg leading-none cursor-pointer select-none"
                >
                  {isOpen ? '−' : '+'}
                </span>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 dark:border-gray-700">
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

                <div className="flex gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <input
                    className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="Agregar ítem..."
                    value={newItem[cat.id] ?? ''}
                    onChange={e => setNewItem(p => ({ ...p, [cat.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddItem(cat.id) }}
                  />
                  <button
                    onClick={() => handleAddItem(cat.id)}
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

      {/* Nueva categoría */}
      <div className="flex gap-2 pt-1">
        <input
          className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          placeholder="Nueva categoría..."
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddCat() }}
        />
        <button
          onClick={handleAddCat}
          disabled={!newCat.trim()}
          className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {deleteConfirm && (
        <Modal title="Eliminar categoría" onClose={() => setDeleteConfirm(null)}>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
            ¿Eliminar <span className="font-semibold">"{deleteConfirm.catName}"</span> y sus <span className="font-semibold">{deleteConfirm.itemCount} ítem{deleteConfirm.itemCount !== 1 ? 's' : ''}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeleteCat}
              className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
