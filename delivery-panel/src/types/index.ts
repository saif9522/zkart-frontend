export interface User {
  id: string
  phone: string | null
  email: string | null
  full_name: string
  role: 'customer' | 'vendor' | 'delivery' | 'admin' | 'super_admin'
  is_active: boolean
  is_phone_verified: boolean
  is_email_verified: boolean
  date_joined: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type VehicleType = 'bicycle' | 'bike' | 'car'
export type PartnerStatus = 'pending' | 'approved' | 'suspended'

export type VerificationStatus = 'documents_submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export interface DeliveryProfile {
  id: string
  whatsapp_number: string
  date_of_birth: string | null
  gender: Gender | ''
  current_address: string
  permanent_address: string
  city: string
  state: string
  pincode: string
  country: string
  vehicle_type: VehicleType
  vehicle_number: string
  vehicle_rc_number: string
  insurance_number: string
  insurance_expiry_date: string | null
  aadhaar_number: string
  license_number: string
  pan_number: string
  aadhaar_front_image: string | null
  aadhaar_back_image: string | null
  license_front_image: string | null
  license_back_image: string | null
  vehicle_rc_image: string | null
  vehicle_insurance_image: string | null
  pan_card_image: string | null
  passport_photo: string | null
  selfie_photo: string | null
  status: PartnerStatus
  verification_status: VerificationStatus
  is_online: boolean
  current_latitude: string | null
  current_longitude: string | null
  last_location_update: string | null
  rating_avg: string
  rating_count: number
}

export interface DeliveryDashboard {
  status: PartnerStatus
  is_online: boolean
  active_orders: number
  delivered_today: number
  earnings: { balance: string; today: string }
}

export interface AvailableOrder {
  id: string
  order_number: string
  vendor_name: string
  vendor_address: string
  vendor_phone: string
  vendor_latitude: string
  vendor_longitude: string
  item_count: number
  grand_total: string
  placed_at: string
}

export type OrderStatus =
  | 'placed' | 'accepted' | 'packing' | 'ready' | 'pickup' | 'out_for_delivery' | 'nearby' | 'delivered' | 'cancelled'

export interface MyDeliveryOrder {
  id: string
  order_number: string
  status: OrderStatus
  vendor_name: string
  vendor_address: string
  vendor_phone: string
  customer_name: string
  customer_phone: string
  delivery_address_text: string
  item_count: number
  grand_total: string
  payment_method: 'cod' | 'razorpay'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  placed_at: string
}

export interface DeliveryTransaction {
  id: string
  type: 'delivery_earning' | 'incentive' | 'payout' | 'adjustment'
  amount: string
  order_reference: string
  description: string
  created_at: string
}

export interface Attendance {
  id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  hours_worked: number | null
}
