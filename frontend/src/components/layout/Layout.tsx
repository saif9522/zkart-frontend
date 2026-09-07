import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { Footer } from '@/components/layout/Footer'
import { ToastHost } from '@/components/layout/ToastHost'
import { InstallAppBanner } from '@/components/layout/InstallAppBanner'
import { ChatWidget } from '@/components/layout/ChatWidget'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-rice-100">
      <Header />
      <main className="flex-1 pb-20 sm:pb-8">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <ToastHost />
      <InstallAppBanner />
      <ChatWidget />
    </div>
  )
}
