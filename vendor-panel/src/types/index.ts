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

export type ShopCategory =
  | 'grocery' | 'fruits_vegetables' | 'medical' | 'bakery' | 'meat' | 'electronics' | 'clothing'

export type VerificationStatus = 'documents_submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'
export type BusinessType = 'sole_proprietorship' | 'partnership' | 'private_limited' | 'llp' | 'other'

export interface Vendor {
  id: string
  shop_name: string
  business_name: string
  whatsapp_number: string
  category: ShopCategory
  gst_number: string
  pan_number: string
  business_registration_number: string
  shop_license_number: string
  fssai_license_number: string
  business_type: BusinessType | ''
  years_in_business: number | null
  bank_account_holder_name: string
  bank_name: string
  bank_account_number: string
  bank_ifsc_code: string
  upi_id: string
  gst_certificate: string | null
  pan_card: string | null
  aadhaar_card: string | null
  shop_document: string | null
  business_registration_document: string | null
  fssai_license_document: string | null
  cancelled_cheque: string | null
  shop_front_photo: string | null
  shop_interior_photo: string | null
  owner_photo: string | null
  commission_percent: string
  status: 'pending' | 'approved' | 'suspended'
  verification_status: VerificationStatus
  address_line: string
  city: string
  state: string
  pincode: string
  country: string
  latitude: string
  longitude: string
  is_open: boolean
  created_at: string
}

export interface VendorDashboard {
  shop_name: string
  status: string
  is_open: boolean
  products: { total: number; low_stock: number; out_of_stock: number; batches_expiring_soon: number }
  earnings: { balance: string; this_month_credited: string }
  orders_today: number
  revenue_today: string
}

export interface VendorTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: string
  order_reference: string
  description: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  parent: string | null
}

export interface Brand {
  id: string
  name: string
  slug: string
}

export interface ProductImage {
  id: string
  image: string
  is_primary: boolean
  display_order: number
}

export interface ProductAttribute {
  id: string
  name: string
  value: string
}

export interface ProductVariant {
  id: string
  name: string
  sku: string
  mrp: string
  selling_price: string
  stock_quantity: number
  is_available: boolean
  in_stock: boolean
}

export interface ProductListItem {
  id: string
  name: string
  slug: string
  unit: string
  mrp: string
  selling_price: string
  discount_percent: number
  primary_image: string | null
  vendor_name: string
  category_name: string
  in_stock: boolean
  rating_avg: string
  rating_count: number
  is_featured: boolean
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  unit: string
  mrp: string
  selling_price: string
  sku: string
  barcode: string
  stock_quantity: number
  is_available: boolean
  category_name: string
  brand_name: string | null
  manufacturer_or_marketer: string
  country_of_origin: string
  shelf_life: string
  nutrition_info: Record<string, unknown> | null
  tags: string[] | null
  images: ProductImage[]
  attributes: ProductAttribute[]
  variants: ProductVariant[]
}

export interface ProductWritePayload {
  category: string
  brand?: string | null
  name: string
  description?: string
  unit: string
  mrp: string
  selling_price: string
  sku?: string
  barcode?: string
  stock_quantity: number
  is_available: boolean
  manufacturer_or_marketer?: string
  country_of_origin?: string
  shelf_life?: string
}

export interface VendorWarehouse {
  id: string
  name: string
  address_line: string
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface StockBatch {
  id: string
  product: string
  product_name: string
  warehouse: string | null
  warehouse_name: string | null
  batch_number: string
  quantity: number
  purchase_price: string
  supplier_name: string
  expiry_date: string | null
  received_date: string
  is_expired: boolean
  created_at: string
}

export interface StockMovement {
  id: string
  product: string
  product_name: string
  movement_type: 'purchase' | 'sale' | 'return' | 'adjustment'
  quantity_delta: number
  resulting_stock: number
  reference: string
  notes: string
  created_by_name: string | null
  created_at: string
}

export type OrderStatus =
  | 'placed' | 'accepted' | 'packing' | 'ready' | 'pickup' | 'out_for_delivery' | 'nearby' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  product_name: string
  unit: string
  price: string
  quantity: number
  subtotal: string
}

export interface OrderListItem {
  id: string
  order_number: string
  status: OrderStatus
  payment_method: 'cod' | 'razorpay'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  grand_total: string
  placed_at: string
  customer_name: string
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[]
  subtotal: string
  discount_amount: string
  delivery_charge: string
  delivery_otp: string
  pickup_otp: string
  customer_phone: string
  delivery_address_text: string
}
