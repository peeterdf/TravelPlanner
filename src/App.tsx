import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Share2, Moon, Sun, Eye, EyeOff } from 'lucide-react'
import { useTripsStore } from './store/tripsStore'
import { useSettingsStore } from './store/settingsStore'
import { Home } from './pages/Home'
import { TripDashboard } from './pages/trip/TripDashboard'
import { Transports } from './pages/trip/Transports'
import { Itinerary } from './pages/trip/Itinerary'
import { Accommodations } from './pages/trip/Accommodations'
import { Activities } from './pages/trip/Activities'
import { Expenses } from './pages/trip/Expenses'
import { ExpenseSplitPage } from './pages/trip/ExpenseSplit'
import { Packing } from './pages/trip/Packing'
import { More } from './pages/trip/More'
import { Notes } from './pages/trip/Notes'
import { Audit } from './pages/trip/Audit'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import type { Trip } from './types'

function shareTrip(trip: Trip) {
  const json = JSON.stringify(trip, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const file = new File([blob], `${trip.name.replace(/\s+/g, '_')}.json`, { type: 'application/json' })

  const download = () => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = file.name; a.click()
    URL.revokeObjectURL(url)
  }

  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file], title: trip.name })
      .catch(err => { if ((err as DOMException)?.name !== 'AbortError') download() })
  } else {
    download()
  }
}

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Resumen',
  transportes: 'Transportes',
  itinerario: 'Itinerario',
  alojamiento: 'Alojamiento',
  gastos: 'Gastos',
  actividades: 'Actividades',
  checklist: 'Checklist',
  splits: 'División de gastos',
  notas: 'Notas',
  auditoria: 'Auditoría',
  mas: 'Más',
}

const BOTTOM_NAV_SECTIONS = new Set(['transportes', 'itinerario', 'alojamiento', 'gastos', 'mas'])

function TripLayout() {
  const location = useLocation()
  const parts = location.pathname.split('/')
  const tripId = parts[2]
  const section = parts[3] ?? ''

  const { trips } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const { darkMode, privacyMode, toggleDark, togglePrivacy } = useSettingsStore()

  const title = SECTION_TITLES[section] ?? ''

  const SUB_SECTIONS = new Set(['actividades', 'checklist', 'splits', 'notas', 'auditoria'])
  const backTo = SUB_SECTIONS.has(section)
    ? `/viaje/${tripId}/mas`
    : '/'

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={title}
        backTo={backTo}
        right={
          <>
            <button
              onClick={toggleDark}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={togglePrivacy}
              className={`p-2 transition-colors ${privacyMode ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
              aria-label={privacyMode ? 'Mostrar datos' : 'Ocultar datos'}
            >
              {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {trip && (
              <button
                onClick={() => shareTrip(trip)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="Compartir viaje"
              >
                <Share2 size={18} />
              </button>
            )}
          </>
        }
      />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="dashboard" element={<TripDashboard />} />
          <Route path="transportes" element={<Transports />} />
          <Route path="itinerario" element={<Itinerary />} />
          <Route path="alojamiento" element={<Accommodations />} />
          <Route path="actividades" element={<Activities />} />
          <Route path="gastos" element={<Expenses />} />
          <Route path="splits" element={<ExpenseSplitPage />} />
          <Route path="checklist" element={<Packing />} />
          <Route path="notas" element={<Notes />} />
          <Route path="auditoria" element={<Audit />} />
          <Route path="mas" element={<More />} />
          <Route path="*" element={<Navigate to="transportes" replace />} />
        </Routes>
      </main>
      {BOTTOM_NAV_SECTIONS.has(section) && <BottomNav />}
    </div>
  )
}

function AppLoader() {
  const { load } = useTripsStore()
  useEffect(() => { load() }, [load])
  return null
}

function ThemeApplier() {
  const { darkMode } = useSettingsStore()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])
  return null
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeApplier />
      <AppLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/viaje/:tripId/*" element={<TripLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
