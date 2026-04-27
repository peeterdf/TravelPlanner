import { useState } from 'react'
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

export function Notes() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trips, setNotes } = useTripsStore()
  const trip = trips.find(t => t.id === tripId)
  const [tab, setTab] = useState<'notas' | 'auditoria'>('notas')

  if (!trip) return null

  const auditLog = [...(trip.auditLog ?? [])].reverse()

  return (
    <div className="p-4 pb-28">
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('notas')}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
            tab === 'notas'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Notas
        </button>
        <button
          onClick={() => setTab('auditoria')}
          className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
            tab === 'auditoria'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Auditoría
          {auditLog.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-1.5 py-0.5">
              {auditLog.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'notas' ? (
        <textarea
          className="w-full min-h-[65vh] border border-gray-200 dark:border-gray-700 rounded-2xl
                     px-4 py-3 text-sm text-gray-800 dark:text-gray-200
                     bg-white dark:bg-gray-800 resize-none
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Anotá aquí todo lo importante del viaje: direcciones, teléfonos, contraseñas de wifi, tips..."
          value={trip.notes}
          onChange={e => setNotes(tripId!, e.target.value)}
        />
      ) : (
        <div>
          {auditLog.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-12">
              Aún no hay cambios registrados
            </p>
          ) : (
            <ul className="space-y-2">
              {auditLog.map(entry => (
                <li key={entry.id} className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLOR[entry.action]}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      Se {ACTION_LABEL[entry.action]}{' '}
                      <span className="font-medium">{entry.section}</span>:{' '}
                      {entry.description}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                    {formatAuditDate(entry.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
