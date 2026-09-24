import { api } from '@/api/client'
import type {
  AdminBanner,
  AdminBlogPost,
  AdminContactMessage,
  AdminDeliveryPartner,
  AdminExtraCharge,
  AdminFAQ,
  AdminFooterLink,
  AdminMediaAsset,
  AdminOffer,
  AdminOrder,
  AdminPage,
  AdminPaymentMethodConfig,
  AdminProductAttribute,
  AdminProductVariant,
  AdminReview,
  AdminSlider,
  AdminVendor,
  VerificationLogEntry,
  AIGeneratedContent,
  Brand,
  Campaign,
  CampaignAnalytics,
  CampaignExternalContact,
  CampaignPreview,
  CampaignRecipient,
  Category,
  Coupon,
  DashboardStats,
  Paginated,
  SimpleCustomer,
  Product,
  ProductImage,
  StockBatch,
  User,
} from '@/types'

export const adminApi = {
  dashboard: () => api.get<DashboardStats>('/admin/dashboard/').then((r) => r.data),

  // Users
  users: (params: { role?: string; search?: string } = {}) =>
    api.get<Paginated<User>>('/admin/users/', { params }).then((r) => r.data),
  activateUser: (id: string) => api.post<User>(`/admin/users/${id}/activate/`).then((r) => r.data),
  deactivateUser: (id: string) => api.post<User>(`/admin/users/${id}/deactivate/`).then((r) => r.data),
  updateUser: (id: string, payload: Partial<Pick<User, 'full_name' | 'email'>>) =>
    api.patch<User>(`/admin/users/${id}/`, payload).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}/`),

  // Vendors
  vendors: (params: { status?: string; search?: string } = {}) =>
    api.get<Paginated<AdminVendor>>('/admin/vendors/', { params }).then((r) => r.data),
  vendor: (id: string) => api.get<AdminVendor>(`/admin/vendors/${id}/`).then((r) => r.data),
  approveVendor: (id: string, notes?: string) =>
    api.post<AdminVendor>(`/admin/vendors/${id}/approve/`, { notes }).then((r) => r.data),
  suspendVendor: (id: string) => api.post<AdminVendor>(`/admin/vendors/${id}/suspend/`).then((r) => r.data),
  rejectVendor: (id: string, reason: string) =>
    api.post<AdminVendor>(`/admin/vendors/${id}/reject/`, { reason }).then((r) => r.data),
  requestVendorResubmission: (id: string, notes: string) =>
    api.post<AdminVendor>(`/admin/vendors/${id}/request-resubmission/`, { notes }).then((r) => r.data),
  markVendorUnderReview: (id: string, notes?: string) =>
    api.post<AdminVendor>(`/admin/vendors/${id}/mark-under-review/`, { notes }).then((r) => r.data),
  vendorVerificationHistory: (id: string) =>
    api.get<VerificationLogEntry[]>(`/admin/vendors/${id}/verification-history/`).then((r) => r.data),
  setVendorCommission: (id: string, commission_percent: string) =>
    api.patch<AdminVendor>(`/admin/vendors/${id}/commission/`, { commission_percent }).then((r) => r.data),

  // Delivery partners
  deliveryPartners: (params: { status?: string } = {}) =>
    api.get<Paginated<AdminDeliveryPartner>>('/admin/delivery-partners/', { params }).then((r) => r.data),
  deliveryPartner: (id: string) => api.get<AdminDeliveryPartner>(`/admin/delivery-partners/${id}/`).then((r) => r.data),
  approveDeliveryPartner: (id: string, notes?: string) =>
    api.post<AdminDeliveryPartner>(`/admin/delivery-partners/${id}/approve/`, { notes }).then((r) => r.data),
  suspendDeliveryPartner: (id: string) =>
    api.post<AdminDeliveryPartner>(`/admin/delivery-partners/${id}/suspend/`).then((r) => r.data),
  rejectDeliveryPartner: (id: string, reason: string) =>
    api.post<AdminDeliveryPartner>(`/admin/delivery-partners/${id}/reject/`, { reason }).then((r) => r.data),
  requestDeliveryResubmission: (id: string, notes: string) =>
    api.post<AdminDeliveryPartner>(`/admin/delivery-partners/${id}/request-resubmission/`, { notes }).then((r) => r.data),
  markDeliveryUnderReview: (id: string, notes?: string) =>
    api.post<AdminDeliveryPartner>(`/admin/delivery-partners/${id}/mark-under-review/`, { notes }).then((r) => r.data),
  deliveryVerificationHistory: (id: string) =>
    api.get<VerificationLogEntry[]>(`/admin/delivery-partners/${id}/verification-history/`).then((r) => r.data),

  // Orders (platform-wide, read-only)
  orders: (params: { status?: string; vendor?: string; search?: string } = {}) =>
    api.get<Paginated<AdminOrder>>('/admin/orders/', { params }).then((r) => r.data),

  // Coupons
  coupons: () => api.get<Paginated<Coupon>>('/admin/coupons/').then((r) => r.data),
  createCoupon: (payload: Partial<Coupon>) => api.post<Coupon>('/admin/coupons/', payload).then((r) => r.data),
  updateCoupon: (id: string, payload: Partial<Coupon>) =>
    api.patch<Coupon>(`/admin/coupons/${id}/`, payload).then((r) => r.data),
  deleteCoupon: (id: string) => api.delete(`/admin/coupons/${id}/`),

  // Categories
  categories: () => api.get<Paginated<Category>>('/admin/categories/').then((r) => r.data),
  createCategory: (payload: Partial<Category>) =>
    api.post<Category>('/admin/categories/', payload).then((r) => r.data),
  updateCategory: (id: string, payload: Partial<Category>) =>
    api.patch<Category>(`/admin/categories/${id}/`, payload).then((r) => r.data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}/`),
  uploadCategoryIcon: (id: string, file: File) => {
    const form = new FormData()
    form.append('icon', file)
    return api.patch<Category>(`/admin/categories/${id}/`, form).then((r) => r.data)
  },

  // Brands
  brands: (params: { search?: string } = {}) =>
    api.get<Paginated<Brand>>('/admin/brands/', { params }).then((r) => r.data),
  createBrand: (payload: Partial<Brand>) => api.post<Brand>('/admin/brands/', payload).then((r) => r.data),
  updateBrand: (id: string, payload: Partial<Brand>) =>
    api.patch<Brand>(`/admin/brands/${id}/`, payload).then((r) => r.data),
  deleteBrand: (id: string) => api.delete(`/admin/brands/${id}/`),
  uploadBrandLogo: (id: string, file: File) => {
    const form = new FormData()
    form.append('logo', file)
    return api.patch<Brand>(`/admin/brands/${id}/`, form).then((r) => r.data)
  },

  // Reviews (moderation)
  reviews: (params: { search?: string; product?: string } = {}) =>
    api.get<Paginated<AdminReview>>('/admin/reviews/', { params }).then((r) => r.data),
  setReviewApproved: (id: string, is_approved: boolean) =>
    api.patch<AdminReview>(`/admin/reviews/${id}/`, { is_approved }).then((r) => r.data),
  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}/`),

  // Sliders
  sliders: () => api.get<Paginated<AdminSlider>>('/admin/sliders/').then((r) => r.data),
  createSlider: (payload: Partial<AdminSlider> & { imageFile: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    // DRF quirk: with multipart data, an omitted BooleanField defaults to
    // False (HTML checkbox semantics) instead of the model's default=True.
    form.append('is_active', String(rest.is_active ?? true))
    Object.entries(rest).forEach(([k, v]) => {
      if (k !== 'is_active' && v !== undefined && v !== null) form.append(k, v as string)
    })
    form.append('image', imageFile)
    return api.post<AdminSlider>('/admin/sliders/', form).then((r) => r.data)
  },
  updateSlider: (id: string, payload: Partial<AdminSlider> & { imageFile?: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v as string)
    })
    if (imageFile) form.append('image', imageFile)
    return api.patch<AdminSlider>(`/admin/sliders/${id}/`, form).then((r) => r.data)
  },
  deleteSlider: (id: string) => api.delete(`/admin/sliders/${id}/`),

  // Banners
  banners: (params: { position?: string } = {}) =>
    api.get<Paginated<AdminBanner>>('/admin/banners/', { params }).then((r) => r.data),
  createBanner: (payload: Partial<AdminBanner> & { imageFile: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    form.append('is_active', String(rest.is_active ?? true))
    Object.entries(rest).forEach(([k, v]) => {
      if (k !== 'is_active' && v !== undefined && v !== null) form.append(k, v as string)
    })
    form.append('image', imageFile)
    return api.post<AdminBanner>('/admin/banners/', form).then((r) => r.data)
  },
  updateBanner: (id: string, payload: Partial<AdminBanner> & { imageFile?: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v as string)
    })
    if (imageFile) form.append('image', imageFile)
    return api.patch<AdminBanner>(`/admin/banners/${id}/`, form).then((r) => r.data)
  },
  deleteBanner: (id: string) => api.delete(`/admin/banners/${id}/`),

  // Offers
  offers: () => api.get<Paginated<AdminOffer>>('/admin/offers/').then((r) => r.data),
  createOffer: (payload: Partial<AdminOffer> & { imageFile?: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    form.append('is_active', String(rest.is_active ?? true))
    Object.entries(rest).forEach(([k, v]) => {
      if (k !== 'is_active' && v !== undefined && v !== null) form.append(k, v as string)
    })
    if (imageFile) form.append('image', imageFile)
    return api.post<AdminOffer>('/admin/offers/', form).then((r) => r.data)
  },
  updateOffer: (id: string, payload: Partial<AdminOffer> & { imageFile?: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v as string)
    })
    if (imageFile) form.append('image', imageFile)
    return api.patch<AdminOffer>(`/admin/offers/${id}/`, form).then((r) => r.data)
  },
  deleteOffer: (id: string) => api.delete(`/admin/offers/${id}/`),

  // FAQs
  faqs: () => api.get<Paginated<AdminFAQ>>('/admin/faqs/').then((r) => r.data),
  createFAQ: (payload: Partial<AdminFAQ>) => api.post<AdminFAQ>('/admin/faqs/', payload).then((r) => r.data),
  updateFAQ: (id: string, payload: Partial<AdminFAQ>) =>
    api.patch<AdminFAQ>(`/admin/faqs/${id}/`, payload).then((r) => r.data),
  deleteFAQ: (id: string) => api.delete(`/admin/faqs/${id}/`),

  // Pages
  pages: () => api.get<Paginated<AdminPage>>('/admin/pages/').then((r) => r.data),
  createPage: (payload: Partial<AdminPage>) => api.post<AdminPage>('/admin/pages/', payload).then((r) => r.data),
  updatePage: (id: string, payload: Partial<AdminPage>) =>
    api.patch<AdminPage>(`/admin/pages/${id}/`, payload).then((r) => r.data),
  deletePage: (id: string) => api.delete(`/admin/pages/${id}/`),

  // Blog
  blogPosts: () => api.get<Paginated<AdminBlogPost>>('/admin/blog/').then((r) => r.data),
  createBlogPost: (payload: Partial<AdminBlogPost> & { imageFile?: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v as string)
    })
    if (imageFile) form.append('cover_image', imageFile)
    return api.post<AdminBlogPost>('/admin/blog/', form).then((r) => r.data)
  },
  updateBlogPost: (id: string, payload: Partial<AdminBlogPost> & { imageFile?: File }) => {
    const { imageFile, ...rest } = payload
    const form = new FormData()
    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v as string)
    })
    if (imageFile) form.append('cover_image', imageFile)
    return api.patch<AdminBlogPost>(`/admin/blog/${id}/`, form).then((r) => r.data)
  },
  deleteBlogPost: (id: string) => api.delete(`/admin/blog/${id}/`),

  // Footer links
  footerLinks: (params: { section?: string } = {}) =>
    api.get<Paginated<AdminFooterLink>>('/admin/footer-links/', { params }).then((r) => r.data),
  createFooterLink: (payload: Partial<AdminFooterLink>) =>
    api.post<AdminFooterLink>('/admin/footer-links/', payload).then((r) => r.data),
  updateFooterLink: (id: string, payload: Partial<AdminFooterLink>) =>
    api.patch<AdminFooterLink>(`/admin/footer-links/${id}/`, payload).then((r) => r.data),
  deleteFooterLink: (id: string) => api.delete(`/admin/footer-links/${id}/`),

  // Contact messages
  contactMessages: (params: { status?: string; search?: string } = {}) =>
    api.get<Paginated<AdminContactMessage>>('/admin/contact-messages/', { params }).then((r) => r.data),
  setContactMessageStatus: (id: string, status: AdminContactMessage['status']) =>
    api.patch<AdminContactMessage>(`/admin/contact-messages/${id}/`, { status }).then((r) => r.data),
  deleteContactMessage: (id: string) => api.delete(`/admin/contact-messages/${id}/`),

  // Payment methods
  paymentMethods: () => api.get<Paginated<AdminPaymentMethodConfig>>('/admin/payment-methods/').then((r) => r.data),
  createPaymentMethod: (payload: Partial<AdminPaymentMethodConfig>) =>
    api.post<AdminPaymentMethodConfig>('/admin/payment-methods/', payload).then((r) => r.data),
  updatePaymentMethod: (id: string, payload: Partial<AdminPaymentMethodConfig>) =>
    api.patch<AdminPaymentMethodConfig>(`/admin/payment-methods/${id}/`, payload).then((r) => r.data),
  deletePaymentMethod: (id: string) => api.delete(`/admin/payment-methods/${id}/`),

  // Extra charges (handling / packing / night / rain / custom)
  extraCharges: () => api.get<Paginated<AdminExtraCharge>>('/admin/extra-charges/').then((r) => r.data),
  createExtraCharge: (payload: Partial<AdminExtraCharge>) =>
    api.post<AdminExtraCharge>('/admin/extra-charges/', payload).then((r) => r.data),
  updateExtraCharge: (id: string, payload: Partial<AdminExtraCharge>) =>
    api.patch<AdminExtraCharge>(`/admin/extra-charges/${id}/`, payload).then((r) => r.data),
  deleteExtraCharge: (id: string) => api.delete(`/admin/extra-charges/${id}/`),

  // Media library
  mediaAssets: (search?: string) =>
    api.get<Paginated<AdminMediaAsset>>('/admin/media-library/', { params: search ? { search } : {} }).then((r) => r.data),
  uploadMediaAsset: (file: File, altText: string) => {
    const form = new FormData()
    form.append('file', file)
    if (altText) form.append('alt_text', altText)
    return api.post<AdminMediaAsset>('/admin/media-library/', form).then((r) => r.data)
  },
  updateMediaAsset: (id: string, altText: string) =>
    api.patch<AdminMediaAsset>(`/admin/media-library/${id}/`, { alt_text: altText }).then((r) => r.data),
  deleteMediaAsset: (id: string) => api.delete(`/admin/media-library/${id}/`),

  // Products
  products: (params: { vendor?: string; category?: string; search?: string } = {}) =>
    api.get<Paginated<Product>>('/admin/products/', { params }).then((r) => r.data),
  createProduct: (payload: Partial<Product>) =>
    api.post<Product>('/admin/products/', payload).then((r) => r.data),
  getProduct: (id: string) => api.get<Product>(`/admin/products/${id}/`).then((r) => r.data),
  updateProduct: (id: string, payload: Partial<Product>) =>
    api.patch<Product>(`/admin/products/${id}/`, payload).then((r) => r.data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}/`),
  uploadProductImage: (productId: string, file: File, isPrimary = false) => {
    const form = new FormData()
    form.append('image', file)
    form.append('is_primary', String(isPrimary))
    return api.post<ProductImage>(`/admin/products/${productId}/images/`, form).then((r) => r.data)
  },
  deleteProductImage: (productId: string, imageId: string) =>
    api.delete(`/admin/products/${productId}/images/${imageId}/`),

  // Product attributes (specifications)
  productAttributes: (productId: string) =>
    api.get<AdminProductAttribute[]>(`/admin/products/${productId}/attributes/`).then((r) => r.data),
  createProductAttribute: (productId: string, payload: { name: string; value: string }) =>
    api.post<AdminProductAttribute>(`/admin/products/${productId}/attributes/`, payload).then((r) => r.data),
  updateProductAttribute: (productId: string, attributeId: string, payload: Partial<AdminProductAttribute>) =>
    api.patch<AdminProductAttribute>(`/admin/products/${productId}/attributes/${attributeId}/`, payload).then((r) => r.data),
  deleteProductAttribute: (productId: string, attributeId: string) =>
    api.delete(`/admin/products/${productId}/attributes/${attributeId}/`),

  // Product variants
  productVariants: (productId: string) =>
    api.get<AdminProductVariant[]>(`/admin/products/${productId}/variants/`).then((r) => r.data),
  createProductVariant: (productId: string, payload: Partial<AdminProductVariant>) =>
    api.post<AdminProductVariant>(`/admin/products/${productId}/variants/`, payload).then((r) => r.data),
  updateProductVariant: (productId: string, variantId: string, payload: Partial<AdminProductVariant>) =>
    api.patch<AdminProductVariant>(`/admin/products/${productId}/variants/${variantId}/`, payload).then((r) => r.data),
  deleteProductVariant: (productId: string, variantId: string) =>
    api.delete(`/admin/products/${productId}/variants/${variantId}/`),
  exportProductsCsv: () =>
    api.get('/admin/products/export-csv/', { responseType: 'blob' }).then((r) => r.data as Blob),
  importProductsCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<{ created: number; errors: string[] }>('/admin/products/import-csv/', form)
      .then((r) => r.data)
  },

  // Inventory
  lowStockProducts: () => api.get<Product[]>('/admin/inventory/low-stock/').then((r) => r.data),
  expiringStockBatches: () => api.get<StockBatch[]>('/admin/inventory/expiring-soon/').then((r) => r.data),

  // Broadcast notification
  broadcast: (payload: { role: string; title: string; message: string }) =>
    api.post('/admin/notifications/broadcast/', payload).then((r) => r.data),

  // Campaigns
  campaigns: () => api.get<Paginated<Campaign>>('/admin/campaigns/').then((r) => r.data),
  campaignAnalytics: () => api.get<CampaignAnalytics>('/admin/campaigns/analytics/').then((r) => r.data),
  campaign: (id: string) => api.get<Campaign>(`/admin/campaigns/${id}/`).then((r) => r.data),
  createCampaign: (payload: FormData) =>
    api.post<Campaign>('/admin/campaigns/', payload).then((r) => r.data),
  updateCampaign: (id: string, payload: Partial<Campaign>) =>
    api.patch<Campaign>(`/admin/campaigns/${id}/`, payload).then((r) => r.data),
  deleteCampaign: (id: string) => api.delete(`/admin/campaigns/${id}/`),
  sendCampaign: (id: string) => api.post<Campaign>(`/admin/campaigns/${id}/send/`).then((r) => r.data),
  scheduleCampaign: (id: string, scheduled_at: string) =>
    api.post<Campaign>(`/admin/campaigns/${id}/schedule/`, { scheduled_at }).then((r) => r.data),
  campaignRecipients: (id: string) =>
    api.get<Paginated<CampaignRecipient>>(`/admin/campaigns/${id}/recipients/`).then((r) => r.data),
  campaignAudiencePreview: (id: string) =>
    api.get<{ audience_count: number }>(`/admin/campaigns/${id}/audience-preview/`).then((r) => r.data.audience_count),
  duplicateCampaign: (id: string) => api.post<Campaign>(`/admin/campaigns/${id}/duplicate/`).then((r) => r.data),
  campaignPreview: (id: string) => api.get<CampaignPreview>(`/admin/campaigns/${id}/preview/`).then((r) => r.data),
  searchCustomers: (search: string) =>
    api.get<SimpleCustomer[]>('/admin/campaigns/customers/', { params: { search } }).then((r) => r.data),
  campaignExternalContacts: (id: string) =>
    api.get<CampaignExternalContact[]>(`/admin/campaigns/${id}/external-contacts/`).then((r) => r.data),
  addExternalContact: (id: string, payload: { name?: string; email?: string; phone?: string }) =>
    api.post<CampaignExternalContact>(`/admin/campaigns/${id}/external-contacts/`, payload).then((r) => r.data),
  removeExternalContact: (id: string, contactId: string) =>
    api.delete(`/admin/campaigns/${id}/external-contacts/${contactId}/`),
  generateAICampaignContent: (topic: string, productName?: string) =>
    api
      .post<AIGeneratedContent>('/admin/campaigns/generate-ai-content/', { topic, product_name: productName })
      .then((r) => r.data),
}
