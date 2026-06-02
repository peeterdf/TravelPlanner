import { ArrowRight, User } from 'lucide-react'
import type { Traveler } from '../../types'

interface ClaimTravelerModalProps {
  travelers: Traveler[]
  onClaim: (travelerId: string) => void
  onSkip: () => void
}

export function ClaimTravelerModal({ travelers, onClaim, onSkip }: ClaimTravelerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-sm shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <User size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">¿Cuál sos vos?</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Seleccioná tu nombre en el viaje</p>
          </div>
        </div>

        {travelers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            Todos los viajeros ya tienen un usuario asignado.
          </p>
        ) : (
          <div className="space-y-2">
            {travelers.map(t => (
              <button
                key={t.id}
                onClick={() => onClaim(t.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{t.name}</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onSkip}
          className="w-full mt-4 py-2.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Continuar sin asignar
        </button>
      </div>
    </div>
  )
}
