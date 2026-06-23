export type TransportType = 'avión' | 'tren' | 'bus' | 'auto' | 'barco' | 'otro'

export interface Traveler {
  id: string
  name: string
  userId?: string
}

export interface Transport {
  id: string
  origin: string
  destination: string
  departureDate: string
  departureTime: string
  arrivalDate: string
  arrivalTime: string
  bookingCode: string
  company: string
  type: TransportType
  notes: string
  url: string
}

export interface Accommodation {
  id: string
  city: string
  checkInDate: string
  nights: number
  confirmationCode: string
  pin: string
  phone: string
  address: string
  notes: string
  url: string
}

export interface ItineraryDay {
  date: string
  city: string
  notes: string
}

export type ActivityStatus = 'pendiente' | 'reservada' | 'realizada'

export interface Activity {
  id: string
  date: string
  city: string
  place: string
  type: string
  notes: string
  time?: string
  url?: string
  status?: ActivityStatus
}

export type ExpenseCategory = 'vuelo' | 'alojamiento' | 'comida' | 'transporte' | 'actividad' | 'compra' | 'otro'

export interface Expense {
  id: string
  concept: string
  date: string
  detail: string
  price: number
  paid: number
  reserved: boolean
  currency: string
  category?: ExpenseCategory
  paidBy?: string
  includedTravelers?: string[]
  exchangeRate?: number
}

export interface ExpenseSplit {
  id: string
  concept: string
  paidBy: string
  currency: string
  amount: number
  includedTravelers?: string[]
}

export interface PackingItem {
  id: string
  name: string
  checked: boolean
}

export interface PackingCategory {
  id: string
  name: string
  items: PackingItem[]
}

export type AuditAction = 'add' | 'update' | 'delete'

export interface AuditEntry {
  id: string
  timestamp: string
  action: AuditAction
  section: string
  description: string
  authorId?: string
}

export interface Trip {
  id: string
  name: string
  startDate: string
  endDate: string
  currency: string
  travelers: Traveler[]
  transports: Transport[]
  accommodations: Accommodation[]
  itinerary: ItineraryDay[]
  activities: Activity[]
  expenses: Expense[]
  expenseSplits?: ExpenseSplit[]
  packingList: PackingCategory[]
  notes: string
  auditLog?: AuditEntry[]
  synced?: boolean
  cloudCode?: string
  ownerUid?: string
  exchangeRates?: Record<string, number>
  updatedAt?: string
}

export interface ItineraryConflict {
  date: string
  message: string
}

export interface BoardingPass {
  id: string
  tripId?: string
  transportId?: string
  activityId?: string
  label: string
  img?: string
  value?: string
  format?: string
  url?: string
  createdAt: string
}
