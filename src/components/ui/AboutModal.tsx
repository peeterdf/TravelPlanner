import { MapPin, Plane, Wifi, Shield, Smartphone } from 'lucide-react'
import { Modal } from './Modal'

interface AboutModalProps {
  onClose: () => void
}

export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <Modal title="Acerca de" onClose={onClose}>
      <div className="space-y-6 pb-2">
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
            <MapPin size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">TravelPlanner</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-0.5 rounded-full">
            v{__APP_VERSION__}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 text-center leading-relaxed">
          Organizá viajes grupales con itinerario, gastos, transportes y alojamiento — todo offline-first y sincronizado en la nube.
        </p>

        <div className="space-y-2">
          {[
            { icon: Wifi, label: 'Offline-first', desc: 'Funciona sin conexión, sincroniza cuando hay red' },
            { icon: Shield, label: 'Privacidad', desc: 'Modo privacidad para ocultar montos y nombres' },
            { icon: Plane, label: 'Multi-viajero', desc: 'Compartí el viaje con un código único' },
            { icon: Smartphone, label: 'PWA + Android', desc: 'Instalable como app en cualquier dispositivo' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Icon size={18} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-1">
          <p>React 19 · Firebase · Tailwind · Vite · PWA</p>
          <a
            href="https://github.com/peeterdf/travelplanner"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            github.com/peeterdf/travelplanner
          </a>
        </div>
      </div>
    </Modal>
  )
}
