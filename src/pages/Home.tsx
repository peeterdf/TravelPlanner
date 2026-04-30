import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, MapPin, Trash2, Calendar, Users, Sparkles, Upload, Sun, Moon, Monitor, Eye, EyeOff, Cloud, CloudUpload, UserPlus, Copy, Check } from 'lucide-react'
import { useTripsStore } from '../store/tripsStore'
import { useSettingsStore, useMask } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { buildDemoTrip } from '../utils/demoData'
import { cloudEnabled } from '../lib/cloudSync'
import { DateInput } from '../components/ui/DateInput'
import { UserMenu } from '../components/ui/UserMenu'
import { ClaimTravelerModal } from '../components/ui/ClaimTravelerModal'
import { auth } from '../lib/firebase'
import type { Traveler } from '../types'

function formatDate(d: string) {
  try { return d.split('-').reverse().join('/') }
  catch { return d }
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'

export function Home() {
  const { trips, loaded, load, addTrip, deleteTrip, importTrip, syncToCloud, joinTrip, claimTraveler } = useTripsStore()
  const { theme, privacyMode, cycleTheme, togglePrivacy } = useSettingsStore()
  const { user } = useAuthStore()
  const mask = useMask()
  const navigate = useNavigate()
  // Cloud features only when logged in or not explicitly skipped
  const skipped = localStorage.getItem('auth-skipped') === '1'
  const showCloud = cloudEnabled && (!skipped || (!!user && !user.isAnonymous))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [travelersRaw, setTravelersRaw] = useState('')
  const [currency, setCurrency] = useState('USD')

  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncCode, setSyncCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  const [claimCtx, setClaimCtx] = useState<{ tripId: string; travelers: Traveler[] } | null>(null)
  const [dateError, setDateError] = useState('')

  useEffect(() => { load() }, [load])

  const handleCreate = () => {
    if (!name.trim()) return
    if (startDate && endDate && endDate < startDate) { setDateError('La fecha de vuelta no puede ser antes que la de salida.'); return }
    setDateError('')
    const seen = new Set<string>()
    const travelerNames = travelersRaw.split(',').map(s => s.trim()).filter(s => {
      if (!s) return false
      const key = s.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key); return true
    })
    const id = addTrip(name.trim(), startDate, endDate, travelerNames, currency)
    setShowNew(false)
    setName(''); setStartDate(''); setEndDate(''); setTravelersRaw(''); setCurrency('USD')
    const created = useTripsStore.getState().trips.find(t => t.id === id)
    if (created && created.travelers.length > 0) {
      setClaimCtx({ tripId: id, travelers: created.travelers })
    } else {
      navigate(`/viaje/${id}/dashboard`)
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('¿Eliminar este viaje y todos sus datos?')) deleteTrip(id)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const trip = JSON.parse(ev.target?.result as string)
        if (!trip?.id || !trip?.name) { alert('Archivo inválido'); return }
        importTrip(trip)
        navigate(`/viaje/${trip.id}/dashboard`)
      } catch { alert('No se pudo leer el archivo') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleLoadDemo = () => {
    const already = trips.find(t => t.id === 'demo-europa-2024')
    if (already) { navigate(`/viaje/demo-europa-2024/dashboard`); return }
    importTrip(buildDemoTrip())
    navigate('/viaje/demo-europa-2024/dashboard')
  }

  const handleSync = async (e: React.MouseEvent, trip: { id: string; cloudCode?: string }) => {
    e.stopPropagation()
    if (trip.cloudCode) { setSyncCode(trip.cloudCode); return }
    setSyncingId(trip.id)
    try {
      await syncToCloud(trip.id)
      const updated = useTripsStore.getState().trips.find(t => t.id === trip.id)
      if (updated?.cloudCode) setSyncCode(updated.cloudCode)
    } catch (err) { alert(`Error al sincronizar:\n${err instanceof Error ? err.message : String(err)}`) }
    finally { setSyncingId(null) }
  }

  const handleCopyCode = () => {
    if (!syncCode) return
    navigator.clipboard.writeText(syncCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    setJoinError('')
    try {
      const tripId = await joinTrip(joinCode.trim())
      if (tripId) {
        setShowJoin(false)
        setJoinCode('')
        const joined = useTripsStore.getState().trips.find(t => t.id === tripId)
        const uid = auth.currentUser?.uid
        const unclaimed = joined?.travelers.filter(v => !v.userId || v.userId === uid) ?? []
        if (unclaimed.length > 0) {
          setClaimCtx({ tripId, travelers: unclaimed })
        } else {
          navigate(`/viaje/${tripId}/dashboard`)
        }
      } else {
        setJoinError('No se encontró un viaje con ese código.')
      }
    } catch { setJoinError('Error de conexión. Intentá de nuevo.') }
    finally { setJoining(false) }
  }

  if (!loaded) {
    return <div className="flex items-center justify-center h-screen text-gray-400 dark:bg-gray-950">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-blue-600 text-white px-4 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mis viajes</h1>
            <p className="text-blue-200 text-sm mt-1">Organizá tus aventuras</p>
          </div>
          <div className="flex gap-1 -mr-1 mt-1 items-center">
            <button
              onClick={cycleTheme}
              className="p-2 text-blue-200 hover:text-white transition-colors"
              aria-label={`Tema: ${theme}`}
              title={theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}
            >
              {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
            </button>
            <button
              onClick={togglePrivacy}
              className={`p-2 transition-colors ${privacyMode ? 'text-yellow-300' : 'text-blue-200 hover:text-white'}`}
              aria-label={privacyMode ? 'Mostrar datos' : 'Ocultar datos'}
            >
              {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <UserMenu variant="light" />
          </div>
        </div>
        {trips.length > 0 && !trips.find(t => t.id === 'demo-europa-2024') && (
          <button
            onClick={handleLoadDemo}
            className="mt-3 flex items-center gap-1.5 text-blue-200 hover:text-white text-xs font-medium transition-colors"
          >
            <Sparkles size={13} />
            Cargar viaje de ejemplo
          </button>
        )}
      </header>

      <div className="p-4 space-y-3 pb-24">
        {trips.length === 0 ? (
          <EmptyState
            icon={<MapPin size={56} />}
            title="Todavía no hay viajes"
            description="Creá tu primer viaje para empezar a organizar."
            action={
              <button
                onClick={handleLoadDemo}
                className="flex items-center gap-2 text-blue-600 text-sm font-medium mt-2 hover:underline"
              >
                <Sparkles size={15} />
                Cargar viaje de ejemplo (Europa 2024)
              </button>
            }
          />
        ) : (
          trips.map(trip => (
            <div
              key={trip.id}
              onClick={() => navigate(`/viaje/${trip.id}/dashboard`)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base truncate">{trip.name}</h2>
                    {trip.synced && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                        <Cloud size={10} /> Sync
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar size={13} />
                    <span>
                      {trip.startDate ? formatDate(trip.startDate) : '?'} – {trip.endDate ? formatDate(trip.endDate) : '?'}
                    </span>
                  </div>
                  {trip.travelers.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <Users size={13} />
                      <span>{trip.travelers.map(t => mask.name(t.name)).join(', ')}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {showCloud && (
                    <button
                      onClick={(e) => handleSync(e, trip)}
                      disabled={syncingId === trip.id}
                      className={`p-2 transition-colors disabled:opacity-40 ${trip.synced ? 'text-green-500 dark:text-green-400' : 'text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
                      aria-label={trip.synced ? 'Ver código de sincronización' : 'Sincronizar en la nube'}
                    >
                      {trip.synced ? <Cloud size={17} /> : <CloudUpload size={17} />}
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, trip.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Eliminar viaje"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {trip.transports.length} tramos
                </span>
                <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                  {trip.accommodations.length} alojam.
                </span>
                <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                  {trip.expenses.length} gastos
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {claimCtx && (
        <ClaimTravelerModal
          travelers={claimCtx.travelers}
          onClaim={(travelerId) => {
            claimTraveler(claimCtx.tripId, travelerId)
            navigate(`/viaje/${claimCtx.tripId}/dashboard`)
            setClaimCtx(null)
          }}
          onSkip={() => {
            navigate(`/viaje/${claimCtx.tripId}/dashboard`)
            setClaimCtx(null)
          }}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none">
        <Link to="/privacidad" className="text-xs text-gray-400 dark:text-gray-600 hover:underline pointer-events-auto">
          Política de privacidad
        </Link>
      </div>

      {/* FAB: Unirse con código (solo si Firebase está configurado y usuario activo) */}
      {showCloud && (
        <button
          onClick={() => { setShowJoin(true); setJoinCode(''); setJoinError('') }}
          className="fixed bottom-40 right-4 z-30 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:bg-indigo-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
          aria-label="Unirse a un viaje"
        >
          <UserPlus size={20} />
        </button>
      )}

      {/* FAB: Importar JSON */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-24 right-4 z-30 bg-white dark:bg-gray-800 text-blue-600 border border-blue-200 dark:border-blue-700 rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:bg-blue-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
        aria-label="Importar viaje"
      >
        <Upload size={20} />
      </button>

      {/* FAB: Nuevo viaje */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-6 right-4 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
        aria-label="Nuevo viaje"
      >
        <Plus size={24} />
      </button>

      {/* Modal: Nuevo viaje */}
      {showNew && (
        <Modal title="Nuevo viaje" onClose={() => setShowNew(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del viaje *</label>
              <input className={inputCls} placeholder="Ej: Europa 2024" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de salida</label>
                <DateInput className={inputCls} value={startDate} onChange={v => { setStartDate(v); setDateError('') }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de vuelta</label>
                <DateInput className={inputCls} value={endDate} onChange={v => { setEndDate(v); setDateError('') }} />
              </div>
            </div>
            {dateError && <p className="text-xs text-red-500 dark:text-red-400">{dateError}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Viajeros (separados por coma)</label>
              <input className={inputCls} placeholder="Ej: Ana, Bruno, Clara" value={travelersRaw} onChange={e => setTravelersRaw(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda principal</label>
              <div className="flex flex-wrap gap-2">
                {['USD', 'EUR', 'ARS', 'GBP', 'BRL', 'CLP', 'MXN', 'COP'].map(c => (
                  <button key={c} type="button" onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${currency === c ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Crear viaje
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Código de sincronización */}
      {syncCode && (
        <Modal title="Código del viaje" onClose={() => { setSyncCode(null); setCopied(false) }}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Compartí este código con el grupo. Quien lo ingrese en "Unirse a un viaje" verá y editará el mismo viaje en tiempo real.
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 flex items-center gap-3">
              <code className="flex-1 text-xs font-mono text-gray-800 dark:text-gray-200 break-all">{syncCode}</code>
              <button
                onClick={handleCopyCode}
                className="shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="Copiar código"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {copied && <p className="text-xs text-green-600 dark:text-green-400 text-center">¡Copiado!</p>}
          </div>
        </Modal>
      )}

      {/* Modal: Unirse con código */}
      {showJoin && (
        <Modal title="Unirse a un viaje" onClose={() => setShowJoin(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ingresá el código que te compartió el organizador del viaje.
            </p>
            <input
              className={inputCls}
              placeholder="Pegá el código aquí"
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleJoin() }}
              autoFocus
            />
            {joinError && <p className="text-sm text-red-500">{joinError}</p>}
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joining}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {joining ? 'Conectando...' : 'Unirse al viaje'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
