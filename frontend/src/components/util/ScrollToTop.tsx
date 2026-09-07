import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets the window scroll to the top whenever the route (pathname) changes.
 * Without this, React Router keeps the previous page's scroll offset, so
 * opening a product from halfway down a list would show the product page
 * scrolled into the middle. Mount once, just inside <BrowserRouter>.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // 'auto' (instant) feels right for navigation; 'smooth' would animate.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
