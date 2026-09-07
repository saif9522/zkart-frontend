import { api } from '@/api/client'
import type {
  Brand,
  Category,
  OrderDetail,
  OrderListItem,
  Paginated,
  ProductAttribute,
  ProductDetail,
  ProductImage,
  ProductListItem,
  ProductVariant,
  ProductWritePayload,
  StockBatch,
  StockMovement,
  Vendor,
  VendorDashboard,
  VendorTransaction,
  VendorWarehouse,
} from '@/types'

export const vendorApi = {
  // Onboarding / profile
  onboard: (payload: FormData) =>
    api.post<Vendor>('/vendors/onboard/', payload, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  profile: () => api.get<Vendor>('/vendors/profile/').then((r) => r.data),
  updateProfile: (payload: Partial<Vendor>) => api.patch<Vendor>('/vendors/profile/', payload).then((r) => r.data),
  dashboard: () => api.get<VendorDashboard>('/vendors/dashboard/').then((r) => r.data),
  transactions: () => api.get<Paginated<VendorTransaction>>('/vendors/transactions/').then((r) => r.data),

  // Reference data for product forms
  categories: () => api.get<Paginated<Category>>('/catalog/categories/').then((r) => r.data.results),
  brands: () => api.get<Paginated<Brand>>('/catalog/brands/').then((r) => r.data.results),

  // Own products
  myProducts: (search?: string) =>
    api
      .get<Paginated<ProductListItem>>('/catalog/products/my-products/', { params: search ? { search } : {} })
      .then((r) => r.data),
  productDetail: (slug: string) => api.get<ProductDetail>(`/catalog/products/${slug}/`).then((r) => r.data),
  createProduct: (payload: ProductWritePayload) =>
    api.post<ProductDetail>('/catalog/products/', payload).then((r) => r.data),
  updateProduct: (slug: string, payload: Partial<ProductWritePayload>) =>
    api.patch<ProductDetail>(`/catalog/products/${slug}/`, payload).then((r) => r.data),
  deleteProduct: (slug: string) => api.delete(`/catalog/products/${slug}/`),

  // Product images
  addProductImage: (slug: string, file: File, isPrimary = false) => {
    const form = new FormData()
    form.append('image', file)
    form.append('is_primary', String(isPrimary))
    return api.post<ProductImage>(`/catalog/products/${slug}/images/`, form).then((r) => r.data)
  },
  removeProductImage: (slug: string, imageId: string) =>
    api.delete(`/catalog/products/${slug}/images/${imageId}/`),

  // Product attributes (specifications)
  addProductAttribute: (slug: string, payload: { name: string; value: string }) =>
    api.post<ProductAttribute>(`/catalog/products/${slug}/attributes/`, payload).then((r) => r.data),
  removeProductAttribute: (slug: string, attributeId: string) =>
    api.delete(`/catalog/products/${slug}/attributes/${attributeId}/`),

  // Product variants
  addProductVariant: (slug: string, payload: Partial<ProductVariant>) =>
    api.post<ProductVariant>(`/catalog/products/${slug}/variants/`, payload).then((r) => r.data),
  removeProductVariant: (slug: string, variantId: string) =>
    api.delete(`/catalog/products/${slug}/variants/${variantId}/`),

  // Warehouses
  warehouses: () => api.get<Paginated<VendorWarehouse>>('/inventory/warehouses/').then((r) => r.data),
  createWarehouse: (payload: { name: string; address_line?: string; is_default?: boolean }) =>
    api.post<VendorWarehouse>('/inventory/warehouses/', payload).then((r) => r.data),
  updateWarehouse: (id: string, payload: Partial<VendorWarehouse>) =>
    api.patch<VendorWarehouse>(`/inventory/warehouses/${id}/`, payload).then((r) => r.data),
  deleteWarehouse: (id: string) => api.delete(`/inventory/warehouses/${id}/`),

  // Stock batches
  stockBatches: () => api.get<Paginated<StockBatch>>('/inventory/stock-batches/').then((r) => r.data),
  createStockBatch: (payload: {
    product: string
    quantity: number
    purchase_price: string
    supplier_name?: string
    expiry_date?: string | null
    batch_number?: string
    warehouse?: string
  }) => api.post<StockBatch>('/inventory/stock-batches/', payload).then((r) => r.data),
  deleteStockBatch: (id: string) => api.delete(`/inventory/stock-batches/${id}/`),

  // Stock movements (ledger)
  stockMovements: () => api.get<Paginated<StockMovement>>('/inventory/stock-movements/').then((r) => r.data),
  createAdjustment: (payload: { product: string; quantity_delta: number; notes?: string }) =>
    api.post<StockMovement>('/inventory/stock-movements/', payload).then((r) => r.data),
  updateAdjustment: (id: string, payload: { quantity_delta?: number; notes?: string }) =>
    api.patch<StockMovement>(`/inventory/stock-movements/${id}/`, payload).then((r) => r.data),
  deleteAdjustment: (id: string) => api.delete(`/inventory/stock-movements/${id}/`),

  // Orders
  orders: (status?: string) =>
    api.get<Paginated<OrderListItem>>('/orders/vendor/', { params: status ? { status } : {} }).then((r) => r.data),
  orderDetail: (id: string) => api.get<OrderDetail>(`/orders/vendor/${id}/`).then((r) => r.data),
  acceptOrder: (id: string) => api.post<OrderDetail>(`/orders/vendor/${id}/accept/`).then((r) => r.data),
  rejectOrder: (id: string, reason: string) =>
    api.post<OrderDetail>(`/orders/vendor/${id}/reject/`, { reason }).then((r) => r.data),
  advanceOrderStatus: (id: string, status: 'packing' | 'ready') =>
    api.post<OrderDetail>(`/orders/vendor/${id}/advance-status/`, { status }).then((r) => r.data),
  downloadOrderInvoice: (id: string) =>
    api.get(`/orders/vendor/${id}/invoice/`, { responseType: 'blob' }).then((r) => r.data as Blob),
}
