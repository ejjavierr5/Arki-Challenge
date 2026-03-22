import { useState, useEffect } from 'react'
import { SignIn, useAuth } from '@clerk/react'
import Homepage from './Homepage'
import ProjectDashboard from './ProjectDashboard'

type Route = 'home' | 'dashboard' | 'sign-in' | 'sign-up'

function getRouteFromPath(): Route {
  const path = window.location.pathname
  if (path === '/dashboard' || path === '/dashboard/') {
    return 'dashboard'
  }
  if (path === '/sign-in' || path === '/sign-in/') {
    return 'sign-in'
  }
  if (path === '/sign-up' || path === '/sign-up/') {
    return 'sign-up'
  }
  // Also support hash routing for simpler deployment
  if (window.location.hash === '#dashboard') {
    return 'dashboard'
  }
  if (window.location.hash === '#sign-in') {
    return 'sign-in'
  }
  if (window.location.hash === '#sign-up') {
    return 'sign-up'
  }
  return 'home'
}

// Auth page component with Clerk's SignIn
function AuthPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn 
          routing="hash"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-[#1e2329] border border-white/10 shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-gray-400',
              socialButtonsBlockButton: 'bg-white/5 border-white/10 text-white hover:bg-white/10',
              socialButtonsBlockButtonText: 'text-white',
              dividerLine: 'bg-white/10',
              dividerText: 'text-gray-500',
              formFieldLabel: 'text-gray-300',
              formFieldInput: 'bg-white/5 border-white/10 text-white placeholder:text-gray-500',
              formButtonPrimary: 'bg-[#f4b400] hover:bg-[#f4b400]/90 text-black',
              footerActionLink: 'text-[#f4b400] hover:text-[#f4b400]/80',
              identityPreviewText: 'text-white',
              identityPreviewEditButton: 'text-[#f4b400]',
            },
          }}
        />
      </div>
    </div>
  )
}

// Protected dashboard wrapper
function ProtectedDashboard() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#f4b400] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <AuthPage />
  }

  return <ProjectDashboard />
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
        } else if (href === '/sign-in' || href === '#sign-in') {
          e.preventDefault()
          window.history.pushState({}, '', '/sign-in')
          setRoute('sign-in')
        } else if (href === '/sign-up' || href === '#sign-up') {
          e.preventDefault()
          window.history.pushState({}, '', '/sign-up')
          setRoute('sign-up')
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

  // Render based on route
  if (route === 'sign-in' || route === 'sign-up') {
    return <AuthPage />
  }
  
  if (route === 'dashboard') {
    return <ProtectedDashboard />
  }

  return <Homepage />
}
