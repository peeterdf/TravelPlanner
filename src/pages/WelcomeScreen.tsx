import { useState } from 'react'
import { Plane } from 'lucide-react'
import { AuthModal } from '../components/ui/AuthModal'

interface WelcomeScreenProps {
  onSkip: () => void
}

export function WelcomeScreen({ onSkip }: WelcomeScreenProps) {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col items-center justify-between px-6 py-16 safe-top safe-bottom">
      {/* Branding */}
      <div className="flex-1 flex flex-col items-center justify-center text-white text-center gap-6">
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center shadow-lg">
          <Plane size={44} className="text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-3">TravelPlanner</h1>
          <p className="text-blue-200 text-base max-w-xs leading-relaxed">
            Organizá tus viajes, gastos y planes con tu grupo en tiempo real.
          </p>
        </div>
        <div className="flex gap-6 text-blue-200 text-sm mt-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">∞</p>
            <p>Viajes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Real‑time</p>
            <p>Sincronización</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">Offline</p>
            <p>Sin internet</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => setShowAuth(true)}
          className="w-full bg-white text-blue-600 font-semibold rounded-2xl py-4 text-base shadow-lg hover:bg-blue-50 active:scale-[0.98] transition-all"
        >
          Crear cuenta o iniciar sesión
        </button>
        <button
          onClick={onSkip}
          className="w-full text-blue-200 text-sm py-2 hover:text-white transition-colors"
        >
          Omitir — usar sin cuenta (solo local)
        </button>
        <p className="text-center text-blue-300 text-xs">Tus viajes se guardarán solo en este dispositivo.</p>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
