import { useParams, useNavigate } from 'react-router-dom'
import { Star, CheckSquare, Users, FileText, ClipboardList, Building2, ArrowRight } from 'lucide-react'

export function More() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const items = [
    { icon: Building2, label: 'Alojamiento', desc: 'Hoteles, Airbnbs y reservas', to: 'alojamiento', color: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400' },
    { icon: Star, label: 'Actividades', desc: 'Lugares y planes por día', to: 'actividades', color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30 dark:text-pink-400' },
    { icon: CheckSquare, label: 'Checklist equipaje', desc: 'Listas de packing por categoría', to: 'checklist', color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400' },
    { icon: Users, label: 'División de gastos', desc: 'Quién pagó qué y deudas', to: 'splits', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { icon: FileText, label: 'Notas', desc: 'Direcciones, tips y recordatorios', to: 'notas', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
    { icon: ClipboardList, label: 'Auditoría', desc: 'Historial de cambios del viaje', to: 'auditoria', color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300' },
  ]
  return (
    <div className="p-4 space-y-3 pb-28">
      {items.map(({ icon: Icon, label, desc, to, color }) => (
        <button
          key={to}
          onClick={() => navigate(`/viaje/${tripId}/${to}`)}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.99]"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={22} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
          </div>
          <ArrowRight size={18} className="text-gray-400 dark:text-gray-500" />
        </button>
      ))}
    </div>
  )
}
