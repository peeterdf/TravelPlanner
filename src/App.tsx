import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Share2, Sun, Moon, Monitor, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTripsStore } from './store/tripsStore'
import { useSettingsStore } from './store/settingsStore'
import { useAuthStore } from './store/authStore'
import { loadOrCreateProfile } from './lib/userProfile'
import { Home } from './pages/Home'
import { WelcomeScreen } from './pages/WelcomeScreen'
import { TripDashboard } from './pages/trip/TripDashboard'
import { Transports } from './pages/trip/Transports'
import { Itinerary } from './pages/trip/Itinerary'
import { Accommodations } from './pages/trip/Accommodations'
import { Activities } from './pages/trip/Activities'
import { Expenses } from './pages/trip/Expenses'
import { Packing } from './pages/trip/Packing'
import { More } from './pages/trip/More'
import { Notes } from './pages/trip/Notes'
import { Audit } from './pages/trip/Audit'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { SyncDot } from './components/ui/SyncDot'
import { UserMenu } from './components/ui/UserMenu'
import { Toasts } from './components/ui/Toasts'
import { Privacy } from './pages/Privacy'
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

  const { trips, syncToCloud } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const { theme, privacyMode, cycleTheme, togglePrivacy } = useSettingsStore()

  const title = SECTION_TITLES[section] ?? ''

  const SUB_SECTIONS = new Set(['actividades', 'checklist', 'notas', 'auditoria'])
  const backTo = section === 'dashboard'
    ? '/'
    : SUB_SECTIONS.has(section)
      ? `/viaje/${tripId}/mas`
      : `/viaje/${tripId}/dashboard`

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={title}
        backTo={backTo}
        right={
          <>
            <button
              onClick={cycleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label={`Tema: ${theme}`}
              title={theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}
            >
              {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
            </button>
            <button
              onClick={togglePrivacy}
              className={`p-2 transition-colors ${privacyMode ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
              aria-label={privacyMode ? 'Mostrar datos' : 'Ocultar datos'}
            >
              {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {trip?.synced && (
              <SyncDot tripId={tripId} onRetry={() => syncToCloud(tripId)} />
            )}
            <UserMenu />
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
          <Route path="checklist" element={<Packing />} />
          <Route path="notas" element={<Notes />} />
          <Route path="auditoria" element={<Audit />} />
          <Route path="mas" element={<More />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
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
  const { theme } = useSettingsStore()
  useEffect(() => {
    if (theme !== 'system') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    document.documentElement.classList.toggle('dark', mq.matches)
    const handler = (e: MediaQueryListEvent) => document.documentElement.classList.toggle('dark', e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])
  return null
}

function AppRoutes() {
  const { user, loading, setRole } = useAuthStore()
  const [skipped, setSkipped] = useState(() => localStorage.getItem('auth-skipped') === '1')

  useEffect(() => {
    if (user && !user.isAnonymous) {
      localStorage.removeItem('auth-skipped')
      setSkipped(false)
      loadOrCreateProfile(user.uid, user.email).then(setRole).catch(console.error)
    } else {
      setRole(null)
    }
  }, [user?.uid, user?.isAnonymous])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-600">
        <Loader2 size={36} className="animate-spin text-white" />
      </div>
    )
  }

  const isAnon = !user || user.isAnonymous
  if (isAnon && !skipped) {
    return (
      <WelcomeScreen
        onSkip={() => {
          localStorage.setItem('auth-skipped', '1')
          setSkipped(true)
        }}
      />
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacidad" element={<Privacy />} />
      <Route path="/viaje/:tripId/*" element={<TripLayout />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeApplier />
      <AppLoader />
      <AppRoutes />
      <Toasts />
    </BrowserRouter>
  )
}
