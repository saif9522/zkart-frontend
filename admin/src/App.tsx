import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { VendorsPage } from '@/pages/VendorsPage'
import { DeliveryPartnersPage } from '@/pages/DeliveryPartnersPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { UsersPage } from '@/pages/UsersPage'
import { CouponsPage } from '@/pages/CouponsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { BrandsPage } from '@/pages/BrandsPage'
import { ReviewsPage } from '@/pages/ReviewsPage'
import { SlidersPage } from '@/pages/SlidersPage'
import { BannersPage } from '@/pages/BannersPage'
import { OffersPage } from '@/pages/OffersPage'
import { FAQsPage } from '@/pages/FAQsPage'
import { PagesPage } from '@/pages/PagesPage'
import { BlogPage } from '@/pages/BlogPage'
import { FooterLinksPage } from '@/pages/FooterLinksPage'
import { ContactMessagesPage } from '@/pages/ContactMessagesPage'
import { PaymentMethodsPage } from '@/pages/PaymentMethodsPage'
import { ExtraChargesPage } from '@/pages/ExtraChargesPage'
import { MediaLibraryPage } from '@/pages/MediaLibraryPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { AccountingPage } from '@/pages/AccountingPage'
import { CitiesPage } from '@/pages/CitiesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { StaffPage } from '@/pages/StaffPage'
import { LogsPage } from '@/pages/LogsPage'
import { BackupsPage } from '@/pages/BackupsPage'
import { MonitoringPage } from '@/pages/MonitoringPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/delivery-partners" element={<DeliveryPartnersPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/sliders" element={<SlidersPage />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/faqs" element={<FAQsPage />} />
            <Route path="/pages" element={<PagesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/footer-links" element={<FooterLinksPage />} />
            <Route path="/contact-messages" element={<ContactMessagesPage />} />
            <Route path="/payment-methods" element={<PaymentMethodsPage />} />
            <Route path="/extra-charges" element={<ExtraChargesPage />} />
            <Route path="/media-library" element={<MediaLibraryPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/accounting" element={<AccountingPage />} />

            {/* Super admin only */}
            <Route
              path="/cities"
              element={
                <ProtectedRoute superAdminOnly>
                  <CitiesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute superAdminOnly>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute superAdminOnly>
                  <StaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute superAdminOnly>
                  <LogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/backups"
              element={
                <ProtectedRoute superAdminOnly>
                  <BackupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute superAdminOnly>
                  <MonitoringPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
