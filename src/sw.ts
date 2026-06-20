/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
precacheAndRoute((self as any).__WB_MANIFEST)

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

let pendingIds: number[] = []

self.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type !== 'SCHEDULE_NOTIFICATIONS') return
  pendingIds.forEach(id => clearTimeout(id))
  pendingIds = []
  const schedule: Array<{ id: string; time: number; title: string; body: string }> = event.data.schedule
  const now = Date.now()
  for (const n of schedule) {
    const delay = n.time - now
    if (delay > 0 && delay <= 24 * 3_600_000) {
      pendingIds.push(
        setTimeout(() => {
          self.registration.showNotification(n.title, {
            body: n.body,
            icon: '/TravelPlanner/icon-192.png',
            badge: '/TravelPlanner/icon-192.png',
            tag: n.id,
          })
        }, delay) as unknown as number
      )
    }
  }
})
