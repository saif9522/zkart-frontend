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

export interface DashboardStats {
  users: { total: number; by_role: Record<string, number> }
  vendors: { total: number; by_status: Record<string, number>; pending_approval: number }
  delivery_partners: { total: number; by_status: Record<string, number>; pending_approval: number }
  orders: { today: number; this_month: number; delivered_this_month: number; cancelled_this_month: number }
  revenue_this_month: number
  low_stock_products: number
  out_of_stock_products: number
}

export type VerificationStatus = 'documents_submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required'

export interface AdminVendor {
  id: string
  shop_name: string
  business_name: string
  category: string
  owner_phone: string
  owner_name: string
  owner_email: string
  whatsapp_number: string
  gst_number: string
  pan_number: string
  business_registration_number: string
  shop_license_number: string
  fssai_license_number: string
  business_type: string
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
  product_count: number
  created_at: string
  last_login_at: string | null
}

export interface AdminDeliveryPartner {
  id: string
  owner_phone: string
  owner_name: string
  owner_email: string
  whatsapp_number: string
  date_of_birth: string | null
  gender: string
  current_address: string
  permanent_address: string
  city: string
  state: string
  pincode: string
  country: string
  vehicle_type: string
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
  status: 'pending' | 'approved' | 'suspended'
  verification_status: VerificationStatus
  is_online: boolean
  rating_avg: string
  rating_count: number
  created_at: string
  last_login_at: string | null
}

export interface VerificationLogEntry {
  id: string
  action: 'approved' | 'rejected' | 'resubmission_requested'
  notes: string
  reviewed_by_name: string | null
  created_at: string
}

export interface AdminOrder {
  id: string
  order_number: string
  vendor_name: string
  status: string
  payment_method: string
  payment_status: string
  grand_total: string
  item_count: number
  placed_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'flat' | 'percent'
  discount_value: string
  max_discount: string | null
  min_order_value: string
  valid_from: string
  valid_to: string
  usage_limit: number | null
  used_count: number
  is_active: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  parent: string | null
  icon: string | null
  display_order: number
  is_active: boolean
}

export interface AdminReview {
  id: string
  product: string
  product_name: string
  customer_name: string
  customer_phone: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
}

export interface AdminProductAttribute {
  id: string
  name: string
  value: string
  display_order: number
}

export interface AdminProductVariant {
  id: string
  name: string
  sku: string
  mrp: string
  selling_price: string
  stock_quantity: number
  is_available: boolean
  display_order: number
  in_stock: boolean
}

export interface AdminMediaAsset {
  id: string
  file: string
  alt_text: string
  uploaded_by_name: string | null
  file_size: number | null
  is_image: boolean
  created_at: string
}

export interface AdminPaymentMethodConfig {
  id: string
  code: 'cod' | 'razorpay'
  label: string
  is_enabled: boolean
  extra_fee: string
  min_order_value: string | null
  display_order: number
}

export interface AdminExtraCharge {
  id: string
  code: string
  label: string
  charge_type: 'flat' | 'percent'
  amount: string
  max_charge: string | null
  min_order_value: string | null
  active_from_hour: number | null
  active_to_hour: number | null
  is_active: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

export interface AdminFAQ {
  id: string
  question: string
  answer: string
  display_order: number
  is_active: boolean
}

export interface AdminPage {
  id: string
  title: string
  slug: string
  content: string
  is_active: boolean
  updated_at: string
}

export interface AdminBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string | null
  is_published: boolean
  published_at: string | null
}

export interface AdminFooterLink {
  id: string
  section: 'about' | 'quick_links' | 'customer_support' | 'social'
  label: string
  url: string
  display_order: number
  is_active: boolean
}

export interface AdminContactMessage {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: 'new' | 'read' | 'resolved'
  created_at: string
}

export interface AdminSlider {
  id: string
  title: string
  subtitle: string
  image: string
  link_url: string
  display_order: number
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
}

export interface AdminBanner {
  id: string
  title: string
  image: string
  link_url: string
  position: 'home_top' | 'home_middle' | 'category_page' | 'cart_page'
  display_order: number
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
}

export interface AdminOffer {
  id: string
  title: string
  description: string
  image: string | null
  discount_label: string
  link_url: string
  display_order: number
  is_active: boolean
  valid_from: string | null
  valid_to: string | null
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  is_active: boolean
}

export interface ProductImage {
  id: string
  image: string
  is_primary: boolean
  display_order: number
}

export interface Product {
  id: string
  vendor: string
  vendor_name: string
  category: string
  category_name: string
  brand: string | null
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
  is_featured: boolean
  nutrition_info: Record<string, unknown> | null
  tags: string[] | null
  rating_avg: string
  rating_count: number
  discount_percent: number
  images: ProductImage[]
  created_at: string
  updated_at: string
}

export interface StockBatch {
  id: string
  product: string
  product_name: string
  batch_number: string
  quantity: number
  purchase_price: string
  supplier_name: string
  expiry_date: string | null
  received_date: string
  is_expired: boolean
  created_at: string
}

export interface City {
  id: string
  name: string
  state: string
  delivery_charge: string | null
  free_delivery_threshold: string | null
  is_active: boolean
  vendor_count: number
  created_at: string
}

export interface PlatformSettings {
  default_commission_percent: string
  default_delivery_charge: string
  default_free_delivery_threshold: string
  order_accept_timeout_minutes: number
  maintenance_mode: boolean
  updated_at: string
}

export type StaffDepartment =
  | 'custom' | 'full' | 'accounts' | 'vendor_desk' | 'delivery_desk' | 'catalog' | 'support'

export interface StaffPermission {
  id: string
  user: string
  user_phone: string
  user_name: string
  department: StaffDepartment
  can_manage_vendors: boolean
  can_manage_delivery_partners: boolean
  can_manage_orders: boolean
  can_manage_coupons: boolean
  can_manage_categories: boolean
  can_manage_users: boolean
  can_view_reports: boolean
  updated_at: string
}

export interface AuditLogEntry {
  id: string
  user: string | null
  user_phone: string | null
  method: string
  path: string
  status_code: number
  ip_address: string | null
  created_at: string
}

export interface BackupLog {
  id: string
  filename: string
  size_bytes: number | null
  status: 'running' | 'success' | 'failed'
  error_message: string
  started_at: string
  finished_at: string | null
}

export interface MonitoringStats {
  window: string
  total_requests: number
  error_count: number
  error_rate_percent: number
  top_endpoints: { path: string; count: number }[]
  status_code_breakdown: Record<string, number>
  requests_today: number
}

export type CampaignAudience = 'all_customers' | 'city' | 'recent_buyers' | 'inactive' | 'selected'
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'partially_sent' | 'failed'

export interface Campaign {
  id: string
  name: string
  is_ai_generated: boolean
  send_email: boolean
  send_sms: boolean
  send_whatsapp: boolean
  post_facebook: boolean
  post_instagram: boolean
  channels: string[]
  audience: CampaignAudience
  audience_city: string | null
  audience_city_name: string | null
  selected_customer_count: number
  external_contact_count: number
  subject: string
  message: string
  image: string | null
  link_url: string
  scheduled_at: string | null
  status: CampaignStatus
  total_recipients: number
  sent_count: number
  failed_count: number
  facebook_post_id: string
  facebook_error: string
  instagram_post_id: string
  instagram_error: string
  created_by_name: string | null
  created_at: string
  sent_at: string | null
}

export interface SimpleCustomer {
  id: string
  full_name: string
  phone: string
  email: string | null
}

export interface CampaignExternalContact {
  id: string
  name: string
  email: string
  phone: string
  email_status: 'pending' | 'sent' | 'failed' | 'skipped'
  whatsapp_status: 'pending' | 'sent' | 'failed' | 'skipped'
}

export interface CampaignPreview {
  email?: { subject: string; body: string; image: string | null }
  sms?: { body: string }
  whatsapp?: { body: string; image: string | null }
  facebook?: { caption: string; image: string | null }
  instagram?: { caption: string; image: string | null }
}

export interface AIGeneratedContent {
  email_subject: string
  email_body: string
  whatsapp_message: string
  social_caption: string
  hashtags: string[]
}

export interface CampaignRecipient {
  id: string
  user_name: string
  user_phone: string
  channel: 'email' | 'sms' | 'whatsapp'
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  error: string
  sent_at: string | null
}

export interface CampaignAnalytics {
  overview: {
    total_campaigns: number
    total_recipients: number
    emails_sent: number
    whatsapp_sent: number
    sms_sent: number
    facebook_posts: number
    instagram_posts: number
    delivery_rate: number
    failed_count: number
  }
  by_status: {
    draft: number
    scheduled: number
    sending: number
    sent: number
    partially_sent: number
    failed: number
  }
  recent_campaign: {
    id: string
    name: string
    status: string
    total_recipients: number
    sent_count: number
    failed_count: number
    delivery_rate: number
    sent_at: string | null
  } | null
  contact_growth: { label: string; new_contacts: number; total_contacts: number }[]
  contacts_summary: {
    total_customers: number
    with_email: number
    without_email: number
    new_last_30_days: number
  }
}
