export interface User {
  id: string
  phone: string | null
  email: string | null
  full_name: string
  role: 'customer' | 'vendor' | 'delivery' | 'admin' | 'super_admin'
  is_phone_verified: boolean
  is_email_verified: boolean
  avatar: string | null
  referral_code: string | null
  date_joined: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface Address {
  id: string
  label: 'home' | 'work' | 'other'
  address_line: string
  landmark: string
  city: string
  state: string
  pincode: string
  latitude: string
  longitude: string
  is_default: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  parent: string | null
  icon: string | null
  display_order: number
  subcategories?: Category[]
}

export interface HomeFeedSection {
  id: string
  name: string
  slug: string
  icon: string | null
  products: ProductListItem[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
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
  in_stock: boolean
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  unit: string
  mrp: string
  selling_price: string
  discount_percent: number
  images: ProductImage[]
  attributes: ProductAttribute[]
  variants: ProductVariant[]
  vendor_id: string
  vendor_name: string
  seller_business_name: string | null
  seller_address: string
  seller_license_number: string | null
  manufacturer_or_marketer: string
  country_of_origin: string
  shelf_life: string
  category_name: string
  category_slug: string
  brand_name: string | null
  sku: string
  barcode: string
  in_stock: boolean
  stock_quantity: number
  nutrition_info: Record<string, unknown> | null
  tags: string[] | null
  rating_avg: string
  rating_count: number
  similar_products: ProductListItem[]
  more_from_vendor: ProductListItem[]
  created_at: string
}

export interface CartItem {
  id: string
  product: ProductListItem
  quantity: number
  subtotal: number
}

export interface Cart {
  id: string
  items: CartItem[]
  coupon_code: string
  subtotal: number
  item_count: number
  delivery_charge: number
  grand_total: number
}

export interface Review {
  id: string
  product: string
  customer_name: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

export interface WishlistItem {
  id: string
  product: ProductListItem
  added_at: string
}

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'packing'
  | 'ready'
  | 'pickup'
  | 'out_for_delivery'
  | 'nearby'
  | 'delivered'
  | 'cancelled'

export interface OrderItem {
  id: string
  product: string | null
  product_name: string
  unit: string
  price: string
  quantity: number
  subtotal: number
}

export interface OrderStatusHistoryEntry {
  from_status: string
  to_status: string
  changed_at: string
}

export interface OrderListItem {
  id: string
  order_number: string
  vendor_name: string
  status: OrderStatus
  payment_method: 'cod' | 'razorpay'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  grand_total: string
  item_count: number
  placed_at: string
}

export interface OrderDetail extends Omit<OrderListItem, 'item_count'> {
  vendor: string
  subtotal: string
  delivery_charge: string
  discount_amount: string
  coupon_code: string
  delivery_address_text: string
  delivery_otp: string
  items: OrderItem[]
  status_history: OrderStatusHistoryEntry[]
  accepted_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
