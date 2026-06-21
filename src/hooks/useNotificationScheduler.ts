import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { useTripsStore } from '../store/tripsStore'
import { useSettingsStore } from '../store/settingsStore'
import { saveSchedule, checkAndFireDue } from '../lib/notifications'

const isNative = Capacitor.isNativePlatform()

export function useNotificationScheduler() {
  const trips = useTripsStore(s => s.trips)
  const notificationsEnabled = useSettingsStore(s => s.notificationsEnabled)

  useEffect(() => {
    if (!notificationsEnabled) return
    // On web, require browser Notification API and granted permission.
    // On native, LocalNotifications handles permissions — skip these checks.
    if (!isNative && (!('Notification' in window) || Notification.permission !== 'granted')) return
    void checkAndFireDue()
    void saveSchedule(trips)
    const id = setInterval(() => void checkAndFireDue(), 60_000)
    return () => clearInterval(id)
  }, [trips, notificationsEnabled])
}
