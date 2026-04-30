import { X } from 'lucide-react'
import { useToastStore } from '../../store/toastStore'

export function Toasts() {
  const { toasts, remove } = useToastStore()
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="bg-red-600 text-white rounded-xl px-4 py-3 text-xs shadow-xl flex items-start gap-2 pointer-events-auto">
          <span className="flex-1 break-all font-mono">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="shrink-0 mt-0.5 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
