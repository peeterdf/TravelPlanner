import { useParams, useNavigate } from 'react-router-dom'
import { Star, CheckSquare, Users, ArrowRight } from 'lucide-react'

export function More() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const items = [
    { icon: Star, label: 'Actividades', desc: 'Lugares y planes por día', to: 'actividades', color: 'text-pink-600 bg-pink-50' },
    { icon: CheckSquare, label: 'Checklist equipaje', desc: 'Listas de packing por categoría', to: 'checklist', color: 'text-teal-600 bg-teal-50' },
    { icon: Users, label: 'División de gastos', desc: 'Quién pagó qué y deudas', to: 'splits', color: 'text-indigo-600 bg-indigo-50' },
  ]
  return (
    <div className="p-4 space-y-3 pb-28">
      {items.map(({ icon: Icon, label, desc, to, color }) => (
        <button
          key={to}
          onClick={() => navigate(`/viaje/${tripId}/${to}`)}
          className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.99]"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={22} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
          </div>
          <ArrowRight size={18} className="text-gray-400" />
        </button>
      ))}
    </div>
  )
}
