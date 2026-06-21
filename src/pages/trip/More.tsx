import { useParams, useNavigate } from 'react-router-dom'
import { Star, CheckSquare, FileText, ClipboardList, ArrowRight, LayoutDashboard, Ticket, Bell, BellOff } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import { requestPermission, saveSchedule } from '../../lib/notifications'
import { useTripsStore } from '../../store/tripsStore'
import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export function More() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore()
  const trips = useTripsStore(s => s.trips)

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
    } else {
      const perm = await requestPermission()
      if (perm === 'granted') {
        setNotificationsEnabled(true)
        void saveSchedule(trips)
      }
    }
  }

  const items = [
    { icon: LayoutDashboard, label: 'Resumen del viaje', desc: 'Vista general y viajeros', to: 'dashboard', color: 'icon-box-primary' },
    { icon: Ticket, label: 'Pases de embarque', desc: 'Tus pkpass y QR personales', to: 'pases', color: 'icon-box-violet' },
    { icon: Star, label: 'Actividades', desc: 'Lugares y planes por día', to: 'actividades', color: 'icon-box-pink' },
    { icon: CheckSquare, label: 'Checklist equipaje', desc: 'Listas de packing por categoría', to: 'checklist', color: 'icon-box-teal' },
    { icon: FileText, label: 'Notas', desc: 'Direcciones, tips y recordatorios', to: 'notas', color: 'icon-box-amber' },
    { icon: ClipboardList, label: 'Auditoría', desc: 'Historial de cambios del viaje', to: 'auditoria', color: 'icon-box-neutral' },
  ]
  return (
    <div className="p-4 space-y-3 pb-28">
      {items.map(({ icon: Icon, label, desc, to, color }) => (
        <button
          key={to}
          onClick={() => navigate(`/viaje/${tripId}/${to}`)}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.99]"
        >
          <div className={`icon-box ${color}`}>
            <Icon size={22} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
          </div>
          <ArrowRight size={18} className="text-gray-400 dark:text-gray-500" />
        </button>
      ))}
      {(isNative || 'Notification' in window) && (
        <button
          onClick={() => void handleToggleNotifications()}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.99]"
        >
          <div className={`icon-box ${notificationsEnabled ? 'icon-box-primary' : 'icon-box-neutral'}`}>
            {notificationsEnabled ? <Bell size={22} /> : <BellOff size={22} />}
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900 dark:text-white">Notificaciones</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {notificationsEnabled ? 'Activas — tocá para desactivar' : 'Tocá para activar recordatorios'}
            </p>
          </div>
          <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      )}
    </div>
  )
}
