import { parseISO, addDays, format } from 'date-fns'
import localforage from 'localforage'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Trip } from '../types'

export interface ScheduledNotification {
  id: string
  time: number
  title: string
  body: string
  fired: boolean
}

const STORE_KEY = 'scheduled_notifications'
const NOTIF_CACHE = 'tp-notif-schedule'
const ICON = `${import.meta.env.BASE_URL}icon-192.png`
const isNative = Capacitor.isNativePlatform()

// Stable numeric ID for Capacitor (Android uses 32-bit int)
function hashId(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return (Math.abs(h) % 2_000_000_000) + 1
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (isNative) {
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted' ? 'granted' : 'denied'
  }
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

export async function checkExactAlarmGranted(): Promise<boolean> {
  if (!isNative) return true
  try {
    const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting()
    return exact_alarm === 'granted'
  } catch {
    return true // older Android versions don't have this requirement
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!isNative) return
  try {
    await LocalNotifications.changeExactNotificationSetting()
  } catch { /* unsupported */ }
}

export function buildSchedule(trips: Trip[]): ScheduledNotification[] {
  const cutoff = Date.now() - 3_600_000
  const notifs: ScheduledNotification[] = []

  for (const trip of trips) {
    for (const t of trip.transports) {
      if (!t.departureDate) continue
      const depMs = parseISO(`${t.departureDate}T${t.departureTime || '12:00'}`).getTime()
      const label = `${t.origin} → ${t.destination}`
      const timeStr = t.departureTime ? ` a las ${t.departureTime}` : ''

      if (t.type === 'avión') {
        const ciMs = depMs - 24 * 3_600_000
        if (ciMs > cutoff) notifs.push({ id: `ci-${t.id}`, time: ciMs, title: `📋 Check-in online — ${trip.name}`, body: `Abrió el check-in para ${label}`, fired: false })
      }

      const dep24Ms = depMs - 24 * 3_600_000 + 5 * 60_000
      if (dep24Ms > cutoff) notifs.push({ id: `dep24-${t.id}`, time: dep24Ms, title: `✈️ Salida mañana — ${trip.name}`, body: `${label}${timeStr}`, fired: false })

      const dep2Ms = depMs - 2 * 3_600_000
      if (dep2Ms > cutoff) notifs.push({ id: `dep2-${t.id}`, time: dep2Ms, title: `🚀 ¡Salida en 2 horas! — ${trip.name}`, body: `${label}${timeStr}`, fired: false })
    }

    for (const a of trip.accommodations) {
      if (!a.checkInDate) continue
      const inMs = parseISO(`${a.checkInDate}T09:00`).getTime()
      if (inMs > cutoff) notifs.push({ id: `hin-${a.id}`, time: inMs, title: `🏨 Check-in hoy — ${trip.name}`, body: `Alojamiento en ${a.city}${a.address ? ` · ${a.address}` : ''}`, fired: false })

      if (a.nights > 0) {
        const outDate = format(addDays(parseISO(a.checkInDate), a.nights), 'yyyy-MM-dd')
        const outMs = parseISO(`${outDate}T08:00`).getTime()
        if (outMs > cutoff) notifs.push({ id: `hout-${a.id}`, time: outMs, title: `🧳 Check-out hoy — ${trip.name}`, body: `Recordá hacer el check-out en ${a.city}`, fired: false })
      }
    }

    for (const a of trip.activities) {
      if (!a.date || a.status === 'realizada') continue
      const remMs = a.time
        ? parseISO(`${a.date}T${a.time}`).getTime() - 30 * 60_000
        : parseISO(`${a.date}T08:00`).getTime()
      if (remMs > cutoff) notifs.push({ id: `act-${a.id}`, time: remMs, title: `⭐ ${a.place} — ${trip.name}`, body: a.time ? `En 30 minutos (${a.time}) en ${a.city}` : `Actividad de hoy en ${a.city}`, fired: false })
    }
  }

  return notifs.sort((a, b) => a.time - b.time)
}

export async function saveSchedule(trips: Trip[]): Promise<void> {
  if (isNative) {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) })
    }
    const future = buildSchedule(trips).filter(n => n.time > Date.now())
    if (future.length > 0) {
      await LocalNotifications.schedule({
        notifications: future.map(n => ({
          id: hashId(n.id),
          title: n.title,
          body: n.body,
          // allowWhileIdle bypasses Doze mode so the alarm fires even with
          // the screen off or the app in the background.
          schedule: { at: new Date(n.time), allowWhileIdle: true },
        })),
      })
    }
    return
  }

  const existing = (await localforage.getItem<ScheduledNotification[]>(STORE_KEY)) ?? []
  const firedIds = new Set(existing.filter(n => n.fired).map(n => n.id))
  const schedule = buildSchedule(trips).map(n => ({ ...n, fired: firedIds.has(n.id) }))
  await localforage.setItem(STORE_KEY, schedule)

  // Also persist to Cache API so the SW can read it after a browser restart
  try {
    const cache = await caches.open(NOTIF_CACHE)
    await cache.put('schedule', new Response(JSON.stringify(schedule), {
      headers: { 'Content-Type': 'application/json' },
    }))
  } catch { /* Cache API unavailable */ }

  const sw = navigator.serviceWorker?.controller
  if (sw) sw.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', schedule: schedule.filter(n => !n.fired) })
}

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>
}

export async function registerPeriodicSync(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  if (!('periodicSync' in reg)) return
  try {
    await (reg as ServiceWorkerRegistration & { periodicSync: PeriodicSyncManager })
      .periodicSync.register('check-notifications', { minInterval: 60 * 60 * 1000 })
  } catch { /* periodicSync permission denied or browser unsupported */ }
}

async function showViaSwReg(title: string, options: NotificationOptions): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification(title, options)
}

export async function checkAndFireDue(): Promise<void> {
  if (isNative) return // LocalNotifications entrega de forma nativa
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const schedule = (await localforage.getItem<ScheduledNotification[]>(STORE_KEY)) ?? []
  const now = Date.now()
  let changed = false
  const updated = schedule.map(n => {
    if (!n.fired && n.time <= now) {
      showViaSwReg(n.title, { body: n.body, icon: ICON, tag: n.id }).catch(() => {
        new Notification(n.title, { body: n.body, icon: ICON, tag: n.id })
      })
      changed = true
      return { ...n, fired: true }
    }
    return n
  })
  if (changed) await localforage.setItem(STORE_KEY, updated)
}
