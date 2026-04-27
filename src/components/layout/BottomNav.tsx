import { NavLink, useParams } from 'react-router-dom'
import { LayoutDashboard, Plane, Calendar, Wallet, MoreHorizontal } from 'lucide-react'

const tabs = [
  { to: 'dashboard', icon: LayoutDashboard, label: 'Resumen' },
  { to: 'transportes', icon: Plane, label: 'Tramos' },
  { to: 'itinerario', icon: Calendar, label: 'Itinerario' },
  { to: 'gastos', icon: Wallet, label: 'Gastos' },
  { to: 'mas', icon: MoreHorizontal, label: 'Más' },
]

export function BottomNav() {
  const { tripId } = useParams<{ tripId: string }>()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-bottom">
      <div className="flex">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={`/viaje/${tripId}/${to}`}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
