export type TransportType = 'avión' | 'tren' | 'bus' | 'auto' | 'barco' | 'otro'

export interface Traveler {
  id: string
  name: string
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
}

export interface Accommodation {
  id: string
  city: string
  nights: number
  confirmationCode: string
  pin: string
  phone: string
  address: string
  notes: string
}

export interface ItineraryDay {
  date: string
  city: string
  notes: string
}

export interface Activity {
  id: string
  date: string
  city: string
  place: string
  type: string
  notes: string
}

export interface Expense {
  id: string
  concept: string
  date: string
  detail: string
  price: number
  paid: number
  reserved: boolean
  currency: string
}

export interface ExpenseSplit {
  id: string
  concept: string
  paidBy: string
  currency: string
  amount: number
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

export interface Trip {
  id: string
  name: string
  startDate: string
  endDate: string
  travelers: Traveler[]
  transports: Transport[]
  accommodations: Accommodation[]
  itinerary: ItineraryDay[]
  activities: Activity[]
  expenses: Expense[]
  expenseSplits: ExpenseSplit[]
  packingList: PackingCategory[]
}

export interface ItineraryConflict {
  date: string
  message: string
}
