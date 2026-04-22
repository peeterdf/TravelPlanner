import { Plane, Train, Bus, Car, Ship, HelpCircle } from 'lucide-react'
import type { TransportType } from '../../types'

const CONFIG: Record<TransportType, { icon: React.ReactNode; color: string; label: string }> = {
  avión: { icon: <Plane size={12} />, color: 'bg-blue-100 text-blue-700', label: 'Avión' },
  tren: { icon: <Train size={12} />, color: 'bg-green-100 text-green-700', label: 'Tren' },
  bus: { icon: <Bus size={12} />, color: 'bg-orange-100 text-orange-700', label: 'Bus' },
  auto: { icon: <Car size={12} />, color: 'bg-purple-100 text-purple-700', label: 'Auto' },
  barco: { icon: <Ship size={12} />, color: 'bg-cyan-100 text-cyan-700', label: 'Barco' },
  otro: { icon: <HelpCircle size={12} />, color: 'bg-gray-100 text-gray-600', label: 'Otro' },
}

export function TransportBadge({ type }: { type: TransportType }) {
  const cfg = CONFIG[type] ?? CONFIG.otro
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  )
}
