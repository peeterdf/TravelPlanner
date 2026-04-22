import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Share2 } from 'lucide-react'
import { useTripsStore } from './store/tripsStore'
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
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import type { Trip } from './types'

function shareTrip(trip: Trip) {
  const json = JSON.stringify(trip, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const file = new File([blob], `${trip.name.replace(/\s+/g, '_')}.json`, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    navigator.share({ files: [file], title: trip.name }).catch(() => {})
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = file.name; a.click()
    URL.revokeObjectURL(url)
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
  mas: 'Más',
}

const BOTTOM_NAV_SECTIONS = new Set(['transportes', 'itinerario', 'alojamiento', 'gastos', 'mas'])

function TripLayout() {
  const location = useLocation()
  const parts = location.pathname.split('/')
  // /viaje/:tripId/:section  → parts = ['', 'viaje', tripId, section]
  const tripId = parts[2]
  const section = parts[3] ?? ''

  const { trips } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)

  const title = SECTION_TITLES[section] ?? ''

  // Tabs principales → volver al Home. Sub-páginas (más, actividades, checklist, splits) → volver a "más".
  const SUB_SECTIONS = new Set(['actividades', 'checklist', 'splits'])
  const backTo = SUB_SECTIONS.has(section)
    ? `/viaje/${tripId}/mas`
    : '/'

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={title}
        backTo={backTo}
        right={
          trip ? (
            <button
              onClick={() => shareTrip(trip)}
              className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              aria-label="Compartir viaje"
            >
              <Share2 size={20} />
            </button>
          ) : undefined
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

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/viaje/:tripId/*" element={<TripLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
