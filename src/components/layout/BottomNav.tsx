import { NavLink, useParams } from 'react-router-dom'
import { Plane, Calendar, Building2, Wallet, MoreHorizontal } from 'lucide-react'

const tabs = [
  { to: 'transportes', icon: Plane, label: 'Tramos' },
  { to: 'itinerario', icon: Calendar, label: 'Itinerario' },
  { to: 'alojamiento', icon: Building2, label: 'Alojam.' },
  { to: 'gastos', icon: Wallet, label: 'Gastos' },
  { to: 'mas', icon: MoreHorizontal, label: 'Más' },
]

export function BottomNav() {
  const { tripId } = useParams<{ tripId: string }>()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={`/viaje/${tripId}/${to}`}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
