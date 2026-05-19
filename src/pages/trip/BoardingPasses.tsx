import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Ticket, Plus, Trash2, Eye, Plane, Link } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTripsStore } from '../../store/tripsStore'
import { useBoardingPassStore } from '../../store/boardingPassStore'
import { processFile, processGoogleWalletLink } from '../../utils/boardingPassUtils'
import { BoardingPassViewer } from '../../components/ui/BoardingPassViewer'
import { EmptyState } from '../../components/ui/EmptyState'
import type { BoardingPass } from '../../types'

export function BoardingPasses() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuthStore()
  const { trips } = useTripsStore()
  const { passes, add, remove } = useBoardingPassStore()
  const trip = trips.find(t => t.id === tripId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewing, setViewing] = useState<BoardingPass | null>(null)
  const [loading, setLoading] = useState(false)
  const [linkTransportId, setLinkTransportId] = useState<string | undefined>()

  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkError, setLinkError] = useState('')

  const uid = user?.uid
  if (!uid || !trip) return null

  const myPasses = passes.filter(p => p.tripId === tripId)

  const buildLabel = (transportId?: string) => {
    const transport = transportId ? trip.transports.find(t => t.id === transportId) : undefined
    return transport
      ? `${transport.origin} → ${transport.destination}${transport.departureDate ? ` · ${transport.departureDate.split('-').reverse().slice(0, 2).join('/')}` : ''}`
      : `Pase ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}`
  }

  const handlePickFile = (transportId?: string) => {
    setLinkTransportId(transportId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setLoading(true)
    try {
      const bp = await processFile(file, buildLabel(linkTransportId), tripId, linkTransportId)
      await add(uid, bp)
    } catch (err) {
      console.error('Error procesando pase:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkSubmit = async (transportId?: string) => {
    const url = linkInput.trim()
    if (!url) return
    if (!url.startsWith('http')) {
      setLinkError('Ingresá una URL válida')
      return
    }
    setLinkError('')
    setLoading(true)
    try {
      const bp = processGoogleWalletLink(url, buildLabel(transportId), tripId, transportId)
      await add(uid, bp)
      setLinkInput('')
      setShowLinkInput(false)
    } catch (err) {
      console.error('Error procesando enlace:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este pase de embarque?')) return
    await remove(uid, id)
  }

  const getTransportLabel = (transportId?: string) => {
    if (!transportId) return null
    const t = trip.transports.find(t => t.id === transportId)
    return t ? `${t.origin} → ${t.destination}` : null
  }

  return (
    <div className="p-4 space-y-3 pb-28">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pkpass,image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {showLinkInput && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Enlace de Google Wallet</p>
          <input
            type="url"
            value={linkInput}
            onChange={e => { setLinkInput(e.target.value); setLinkError('') }}
            placeholder="https://pay.google.com/gp/v/save/..."
            className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {linkError && <p className="text-xs text-red-500">{linkError}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowLinkInput(false); setLinkInput(''); setLinkError('') }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleLinkSubmit(linkTransportId)}
              disabled={!linkInput.trim() || loading}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-xl disabled:opacity-60 hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {myPasses.length === 0 && !showLinkInput ? (
        <EmptyState
          icon={<Ticket size={52} />}
          title="Sin pases de embarque"
          description="Agregá tu pkpass, captura del código QR/barcode o enlace de Google Wallet."
          action={
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => handlePickFile()}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Agregar archivo
              </button>
              <button
                onClick={() => { setLinkTransportId(undefined); setShowLinkInput(true) }}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5"
              >
                <Link size={14} />
                Pegar enlace
              </button>
            </div>
          }
        />
      ) : myPasses.length > 0 ? (
        myPasses.map(bp => (
          <div key={bp.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{bp.label}</p>
              {getTransportLabel(bp.transportId) && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Plane size={10} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{getTransportLabel(bp.transportId)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setViewing(bp)}
                className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="Ver pase"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => handleDelete(bp.id)}
                className="p-2 text-gray-400 hover:text-red-500"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))
      ) : null}

      {myPasses.length > 0 && !showLinkInput && (
        <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2">
          <button
            onClick={() => { setLinkTransportId(undefined); setShowLinkInput(true) }}
            disabled={loading}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 disabled:opacity-60"
            title="Pegar enlace"
          >
            <Link size={18} />
          </button>
          <button
            onClick={() => handlePickFile()}
            disabled={loading}
            className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 disabled:opacity-60"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Per-transport quick add buttons */}
      {trip.transports.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Vincular a un tramo</p>
          <div className="space-y-2">
            {trip.transports.map(t => {
              const linkedPasses = myPasses.filter(p => p.transportId === t.id)
              return (
                <div key={t.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  <Plane size={14} className="text-gray-400 shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate min-w-0">
                    {t.origin} → {t.destination}
                    {linkedPasses.length > 0 && (
                      <span className="ml-1.5 text-xs text-blue-600 dark:text-blue-400">({linkedPasses.length})</span>
                    )}
                  </span>
                  <button
                    onClick={() => { setLinkTransportId(t.id); setShowLinkInput(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    disabled={loading}
                    className="shrink-0 text-xs text-gray-500 dark:text-gray-400 hover:underline disabled:opacity-60 flex items-center gap-1"
                  >
                    <Link size={10} />
                    Enlace
                  </button>
                  <button
                    onClick={() => handlePickFile(t.id)}
                    disabled={loading}
                    className="shrink-0 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
                  >
                    + Archivo
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
            Procesando pase…
          </div>
        </div>
      )}

      {viewing && (
        <BoardingPassViewer bp={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
