import { useEffect } from 'react'
import { useTripsStore } from '../store/tripsStore'
import { useSettingsStore } from '../store/settingsStore'
import { saveSchedule, checkAndFireDue } from '../lib/notifications'

export function useNotificationScheduler() {
  const trips = useTripsStore(s => s.trips)
  const notificationsEnabled = useSettingsStore(s => s.notificationsEnabled)

  useEffect(() => {
    if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return
    void checkAndFireDue()
    void saveSchedule(trips)
    const id = setInterval(() => void checkAndFireDue(), 60_000)
    return () => clearInterval(id)
  }, [trips, notificationsEnabled])
}
