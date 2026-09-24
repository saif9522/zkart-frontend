import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DeliveryLocation {
  lat: number
  lng: number
  /** Short name for the header, e.g. "Garhwa Road" */
  label: string
  /** Full address line shown under the label */
  detail: string
}

interface LocationState {
  location: DeliveryLocation | null
  pickerOpen: boolean
  setLocation: (loc: DeliveryLocation) => void
  openPicker: () => void
  closePicker: () => void
}

/** The customer's chosen delivery location — remembered across visits. */
export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      pickerOpen: false,
      setLocation: (location) => set({ location, pickerOpen: false }),
      openPicker: () => set({ pickerOpen: true }),
      closePicker: () => set({ pickerOpen: false }),
    }),
    { name: 'zkart-location', partialize: (s) => ({ location: s.location }) }
  )
)
