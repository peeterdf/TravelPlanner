import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, MapPin, Trash2, Calendar, Users, Sparkles, Upload, Sun, Moon, Monitor, Flame, Eye, EyeOff, Cloud, CloudUpload, UserPlus, Copy, Check } from 'lucide-react'
import { useTripsStore } from '../store/tripsStore'
import { useSettingsStore, useMask } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { buildDemoTrip } from '../utils/demoData'
import { cloudEnabled, findUserByEmail, fetchTripsByOwner, backfillMembership } from '../lib/cloudSync'
import { DateInput } from '../components/ui/DateInput'
import { UserMenu } from '../components/ui/UserMenu'
import { ClaimTravelerModal } from '../components/ui/ClaimTravelerModal'
import { auth, ensureAuth, db } from '../lib/firebase'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { useToastStore } from '../store/toastStore'
import type { Traveler } from '../types'

function formatDate(d: string) {
  try { return d.split('-').reverse().join('/') }
  catch { return d }
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'

export function Home() {
  const { trips, loaded, load, addTrip, deleteTrip, leaveTrip, importTrip, syncToCloud, joinTrip, claimTraveler } = useTripsStore()
  const { theme, privacyMode, cycleTheme, togglePrivacy } = useSettingsStore()
  const { user, role } = useAuthStore()
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
  const [nameError, setNameError] = useState('')
  const [leaveConfirm, setLeaveConfirm] = useState<{ id: string; name: string; isOwner: boolean } | null>(null)
  const [showBackfill, setShowBackfill] = useState(false)
  const [backfillEmail, setBackfillEmail] = useState('')
  const [backfillResult, setBackfillResult] = useState<string | null>(null)
  const [backfilling, setBackfilling] = useState(false)

  useEffect(() => { load() }, [load])

  const handleCreate = () => {
    if (!name.trim()) return
    if (!endDate) { setDateError('La fecha de vuelta es obligatoria.'); return }
    if (startDate && endDate < startDate) { setDateError('La fecha de vuelta no puede ser antes que la de salida.'); return }
    setDateError('')
    if (trips.some(t => t.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      setNameError('Ya tenés un viaje con ese nombre.'); return
    }
    setNameError('')
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

  const handleDelete = (e: React.MouseEvent, trip: { id: string; name: string; synced?: boolean; ownerUid?: string }) => {
    e.stopPropagation()
    if (trip.synced) {
      const isOwner = !trip.ownerUid || trip.ownerUid === auth.currentUser?.uid
      setLeaveConfirm({ id: trip.id, name: trip.name, isOwner })
    } else {
      if (confirm('¿Eliminar este viaje y todos sus datos?')) deleteTrip(trip.id)
    }
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const trip = JSON.parse(ev.target?.result as string)
        if (!trip?.id || !trip?.name) { useToastStore.getState().add('Archivo inválido'); return }
        importTrip(trip)
        navigate(`/viaje/${trip.id}/dashboard`)
      } catch { useToastStore.getState().add('No se pudo leer el archivo') }
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

  const handleBackfill = async () => {
    setBackfilling(true); setBackfillResult(null)
    try {
      const found = await findUserByEmail(backfillEmail.trim())
      if (!found) { setBackfillResult('No se encontró ninguna cuenta con ese email.'); return }
      const trips = await fetchTripsByOwner(found.uid)
      if (!trips.length) { setBackfillResult('No se encontraron viajes para ese usuario.'); return }
      const count = await backfillMembership(found.uid, trips)
      setBackfillResult(`✅ ${count} viaje(s) asignados a ${backfillEmail.trim()}`)
    } catch (err) {
      setBackfillResult(`❌ ${(err as Error).message}`)
    } finally { setBackfilling(false) }
  }

  const handleTestConnection = async () => {
    const toast = useToastStore.getState().add
    const u = auth.currentUser
    toast(`🔍 Auth actual: uid=${u?.uid?.slice(0, 8) ?? 'null'} anon=${u?.isAnonymous ?? '-'} email=${u?.email ?? 'ninguno'}`)
    toast(`API_KEY: ${import.meta.env.VITE_FIREBASE_API_KEY || '❌vacío'}`)
    toast(`AUTH_DOMAIN: ${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌vacío'}`)
    toast(`PROJECT_ID: ${import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌vacío'}`)
    toast(`APP_ID: ${import.meta.env.VITE_FIREBASE_APP_ID || '❌vacío'}`)
    const pid = import.meta.env.VITE_FIREBASE_PROJECT_ID || ''
    const looksWrong = pid.startsWith('1:') || pid.includes(':web:')
    if (looksWrong) toast('⚠️ PROJECT_ID parece ser el APP_ID — debería ser algo como "travelplanner-c78cd"')
    try {
      toast('⏳ Llamando ensureAuth…')
      await ensureAuth()
      const u2 = auth.currentUser
      toast(`✅ ensureAuth OK — uid=${u2?.uid?.slice(0, 8) ?? 'null'} anon=${u2?.isAnonymous}`)
    } catch (err) {
      toast(`❌ ensureAuth FALLÓ: ${(err as Error).message}`)
      return
    }
    try {
      toast('⏳ Probando escritura directa en Firestore (trips/_debug_test)…')
      const testRef = doc(db, 'trips', '_debug_test_delete_me')
      await setDoc(testRef, { t: Date.now(), uid: auth.currentUser?.uid ?? 'anon' })
      await deleteDoc(testRef)
      toast('✅ Firestore escritura+borrado OK — Firestore funciona correctamente')
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown'
      const msg = (err as Error).message ?? String(err)
      toast(`❌ Firestore FALLÓ: [${code}] ${msg}`)
    }
  }

  const handleSync = async (e: React.MouseEvent, trip: { id: string; cloudCode?: string }) => {
    e.stopPropagation()
    if (trip.cloudCode) { setSyncCode(trip.cloudCode); return }
    setSyncingId(trip.id)
    try {
      await syncToCloud(trip.id)
      const updated = useTripsStore.getState().trips.find(t => t.id === trip.id)
      if (updated?.cloudCode) setSyncCode(updated.cloudCode)
    } catch (err) { useToastStore.getState().add(`Error al sincronizar: ${err instanceof Error ? err.message : String(err)}`) }
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
              title={theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : theme === 'warm' ? 'Cálido' : 'Sistema'}
            >
              {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : theme === 'warm' ? <Flame size={18} /> : <Monitor size={18} />}
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
                      <span className="chip-sm chip-success shrink-0">
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
                      className={`p-2 transition-colors disabled:opacity-40 ${trip.synced ? 'text-success' : 'text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
                      aria-label={trip.synced ? 'Ver código de sincronización' : 'Sincronizar en la nube'}
                    >
                      {trip.synced ? <Cloud size={17} /> : <CloudUpload size={17} />}
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, trip)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Eliminar viaje"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-3 text-xs">
                <span className="chip chip-primary">
                  {trip.transports.length} tramos
                </span>
                <span className="chip chip-success">
                  {trip.accommodations.length} alojam.
                </span>
                <span className="chip chip-warning">
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

      {/* FAB: Backfill membresías (solo admin) */}
      {showCloud && role === 'admin' && (
        <button
          onClick={() => { setShowBackfill(true); setBackfillResult(null); setBackfillEmail('') }}
          className="fixed bottom-72 right-4 z-30 bg-orange-400 text-orange-900 rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:bg-orange-300 active:scale-95 transition-all text-lg"
          aria-label="Asignar viajes a usuario"
          title="Asignar viajes a usuario"
        >
          🔧
        </button>
      )}

      {/* FAB: Test conexión Firebase (solo admin) */}
      {showCloud && role === 'admin' && (
        <button
          onClick={handleTestConnection}
          className="fixed bottom-56 right-4 z-30 bg-yellow-400 text-yellow-900 rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:bg-yellow-300 active:scale-95 transition-all text-xs font-bold"
          aria-label="Test Firebase"
          title="Test conexión Firebase"
        >
          DBG
        </button>
      )}

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
              <input className={inputCls} placeholder="Ej: Europa 2024" value={name} onChange={e => { setName(e.target.value); setNameError('') }} autoFocus />
              {nameError && <p className="text-xs text-danger mt-1">{nameError}</p>}
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
            {dateError && <p className="text-xs text-danger">{dateError}</p>}
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
              <code className="flex-1 text-xs font-mono text-gray-800 dark:text-white break-all">{syncCode}</code>
              <button
                onClick={handleCopyCode}
                className="shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
                aria-label="Copiar código"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {copied && <p className="text-xs text-success text-center">¡Copiado!</p>}
          </div>
        </Modal>
      )}

      {/* Modal: Salir / Eliminar viaje sincronizado */}
      {leaveConfirm && (
        <Modal
          title={leaveConfirm.isOwner ? 'Salir o eliminar viaje' : 'Salir del viaje'}
          onClose={() => setLeaveConfirm(null)}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {leaveConfirm.isOwner
                ? 'Podés salir del viaje (seguirá existiendo para los demás) o eliminarlo para todos.'
                : 'Al salir, el viaje se quitará de tu lista. Los demás integrantes seguirán viéndolo.'}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { leaveTrip(leaveConfirm.id); setLeaveConfirm(null) }}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl py-3 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Salir del viaje
              </button>
              {leaveConfirm.isOwner && (
                <button
                  onClick={() => { deleteTrip(leaveConfirm.id); setLeaveConfirm(null) }}
                  className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold text-sm hover:bg-red-700 transition-colors"
                >
                  Eliminar para todos
                </button>
              )}
              <button
                onClick={() => setLeaveConfirm(null)}
                className="w-full text-gray-400 dark:text-gray-500 py-2 text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Backfill membresías (admin) */}
      {showBackfill && (
        <Modal title="Asignar viajes a usuario" onClose={() => setShowBackfill(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ingresá el email de la cuenta. Se buscarán todos los viajes donde esa cuenta es owner y se registrarán en su índice de membresías.
            </p>
            <input
              className={inputCls}
              type="email"
              placeholder="email@ejemplo.com"
              value={backfillEmail}
              onChange={e => { setBackfillEmail(e.target.value); setBackfillResult(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleBackfill() }}
              autoFocus
            />
            {backfillResult && (
              <p className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">{backfillResult}</p>
            )}
            <button
              onClick={handleBackfill}
              disabled={!backfillEmail.trim() || backfilling}
              className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold text-sm hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {backfilling ? 'Buscando...' : 'Asignar viajes'}
            </button>
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
