import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useSyncStore } from '../../store/syncStore'

interface SyncDotProps {
  tripId: string
  onRetry?: () => void
}

export function SyncDot({ tripId, onRetry }: SyncDotProps) {
  const status = useSyncStore(s => s.statuses[tripId] ?? 'idle')
  const error = useSyncStore(s => s.errors[tripId])
  const clearError = useSyncStore(s => s.clearError)

  if (status === 'syncing') {
    return (
      <span title="Sincronizando..." className="p-2 flex items-center">
        <Loader2 size={16} className="animate-spin text-blue-500" />
      </span>
    )
  }
  if (status === 'synced') {
    return (
      <span title="Sincronizado" className="p-2 flex items-center">
        <Cloud size={16} className="text-green-500" />
      </span>
    )
  }
  if (status === 'error') {
    return (
      <button
        onClick={() => { clearError(tripId); onRetry?.() }}
        title={error ?? 'Error al sincronizar. Tap para reintentar.'}
        className="p-2 text-red-500 hover:text-red-600 transition-colors"
      >
        <CloudOff size={16} />
      </button>
    )
  }
  return null
}
