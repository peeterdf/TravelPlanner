/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string
}

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
precacheAndRoute((self as any).__WB_MANIFEST)

const NOTIF_ICON = '/TravelPlanner/icon-192.png'
const NOTIF_CACHE = 'tp-notif-schedule'

type ScheduleEntry = { id: string; time: number; title: string; body: string; fired: boolean }

let pendingIds: number[] = []

async function checkSchedule(): Promise<void> {
  const cache = await caches.open(NOTIF_CACHE)
  const response = await cache.match('schedule')
  if (!response) return
  const schedule: ScheduleEntry[] = (await response.json()) as ScheduleEntry[]
  const now = Date.now()

  // Fire notifications that became due while SW was inactive (up to 1h late)
  for (const n of schedule) {
    if (!n.fired && n.time <= now && now - n.time < 3_600_000) {
      await self.registration.showNotification(n.title, {
        body: n.body,
        icon: NOTIF_ICON,
        badge: NOTIF_ICON,
        tag: n.id,
      })
    }
  }

  // Re-arm setTimeout for the next 24h
  pendingIds.forEach(id => clearTimeout(id))
  pendingIds = []
  for (const n of schedule) {
    if (n.fired) continue
    const delay = n.time - now
    if (delay > 0 && delay <= 24 * 3_600_000) {
      pendingIds.push(
        setTimeout(() => {
          void self.registration.showNotification(n.title, {
            body: n.body,
            icon: NOTIF_ICON,
            badge: NOTIF_ICON,
            tag: n.id,
          })
        }, delay) as unknown as number
      )
    }
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const root = new URL('/TravelPlanner/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const win = list.find(c => c.url.startsWith(root))
      return win ? win.focus() : self.clients.openWindow(root)
    })
  )
})

// Re-arm schedule when the SW starts (covers browser restart + first load)
void checkSchedule()

self.addEventListener('activate', (event) => {
  event.waitUntil(checkSchedule())
})

// Periodic Background Sync: browser wakes the SW periodically (Chrome/Edge on Android)
self.addEventListener('periodicsync', (event: Event) => {
  const e = event as PeriodicSyncEvent
  if (e.tag === 'check-notifications') {
    e.waitUntil(checkSchedule())
  }
})

self.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATIONS') return
  pendingIds.forEach(id => clearTimeout(id))
  pendingIds = []
  const schedule: ScheduleEntry[] = event.data.schedule as ScheduleEntry[]
  const now = Date.now()
  for (const n of schedule) {
    const delay = n.time - now
    if (delay > 0 && delay <= 24 * 3_600_000) {
      pendingIds.push(
        setTimeout(() => {
          void self.registration.showNotification(n.title, {
            body: n.body,
            icon: NOTIF_ICON,
            badge: NOTIF_ICON,
            tag: n.id,
          })
        }, delay) as unknown as number
      )
    }
  }
})
