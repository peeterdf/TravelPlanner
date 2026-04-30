import { Cloud, CloudOff, Loader2, Bug } from 'lucide-react'
import { useSyncStore } from '../../store/syncStore'
import { useTripsStore } from '../../store/tripsStore'

interface SyncDotProps {
  tripId: string
  onRetry?: () => void
}

export function SyncDot({ tripId, onRetry }: SyncDotProps) {
  const status = useSyncStore(s => s.statuses[tripId] ?? 'idle')
  const error = useSyncStore(s => s.errors[tripId])
  const clearError = useSyncStore(s => s.clearError)
  const debugSync = useTripsStore(s => s.debugSync)

  const debugBtn = (
    <button
      onClick={() => debugSync(tripId)}
      title="Debug: forzar upload y mostrar info"
      className="p-2 text-yellow-500 hover:text-yellow-600 transition-colors"
    >
      <Bug size={16} />
    </button>
  )

  if (status === 'syncing') {
    return (
      <span title="Sincronizando..." className="p-2 flex items-center">
        <Loader2 size={16} className="animate-spin text-blue-500" />
      </span>
    )
  }
  if (status === 'synced') {
    return (
      <>
        {debugBtn}
        <span title="Sincronizado" className="p-2 flex items-center">
          <Cloud size={16} className="text-green-500" />
        </span>
      </>
    )
  }
  if (status === 'error') {
    return (
      <>
        {debugBtn}
        <button
          onClick={() => { clearError(tripId); onRetry?.() }}
          title={error ?? 'Error al sincronizar. Tap para reintentar.'}
          className="p-2 text-red-500 hover:text-red-600 transition-colors"
        >
          <CloudOff size={16} />
        </button>
      </>
    )
  }
  return debugBtn
}
