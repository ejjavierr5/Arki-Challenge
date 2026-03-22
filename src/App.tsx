import { useState, useEffect } from 'react'
import Homepage from './Homepage'
import ProjectDashboard from './ProjectDashboard'

type Route = 'home' | 'dashboard'

function getRouteFromPath(): Route {
  const path = window.location.pathname
  if (path === '/dashboard' || path === '/dashboard/') {
    return 'dashboard'
  }
  // Also support hash routing for simpler deployment
  if (window.location.hash === '#dashboard') {
    return 'dashboard'
  }
  return 'home'
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRouteFromPath)

  useEffect(() => {
    // Handle browser back/forward navigation
    const handlePopState = () => {
      setRoute(getRouteFromPath())
    }

    // Handle hash changes
    const handleHashChange = () => {
      setRoute(getRouteFromPath())
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  // Intercept link clicks for SPA navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      
      if (anchor) {
        const href = anchor.getAttribute('href')
        
        if (href === '/dashboard' || href === '#dashboard') {
          e.preventDefault()
          window.history.pushState({}, '', '/dashboard')
          setRoute('dashboard')
        } else if (href === '/' || href === '#home' || href === '#') {
          e.preventDefault()
          window.history.pushState({}, '', '/')
          setRoute('home')
        }
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return route === 'dashboard' ? <ProjectDashboard /> : <Homepage />
}
