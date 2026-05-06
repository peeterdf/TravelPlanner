import { useParams } from 'react-router-dom'
import { useTripsStore } from '../../store/tripsStore'
import type { AuditAction } from '../../types'

function formatAuditDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

const ACTION_LABEL: Record<AuditAction, string> = {
  add: 'agregó',
  update: 'modificó',
  delete: 'eliminó',
}

const DOT_COLOR: Record<AuditAction, string> = {
  add: 'bg-green-500',
  update: 'bg-blue-500',
  delete: 'bg-red-500',
}

export function Audit() {
  const { tripId } = useParams<{ tripId: string }>()
  const trip = useTripsStore(s => s.trips.find(t => t.id === tripId))

  if (!trip) return null

  const auditLog = [...(trip.auditLog ?? [])].reverse()

  if (auditLog.length === 0) {
    return (
      <div className="p-4 pb-28 flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-gray-400 dark:text-gray-500 text-sm">Aún no hay cambios registrados</p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-28">
      <ul className="space-y-1">
        {auditLog.map(entry => {
          const author = entry.authorId
            ? trip.travelers.find(v => v.userId === entry.authorId)
            : null
          return (
            <li key={entry.id} className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLOR[entry.action]}`} />
              <div className="flex-1 min-w-0">
                {author && (
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mr-1">{author.name}</span>
                )}
                <span className="text-sm text-gray-800 dark:text-gray-200">
                  {ACTION_LABEL[entry.action]}{' '}
                  <span className="font-medium">{entry.section}</span>:{' '}
                  {entry.description}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                {formatAuditDate(entry.timestamp)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
