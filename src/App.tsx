import { useState, useEffect, createElement, useRef } from 'react'
import { useAuth, useUser } from '@clerk/react'

// Lazy wrapper: shows skeleton until Clerk content actually renders in the DOM
function ClerkLazy({ factory, ...props }: { factory: () => Promise<{ default: React.ComponentType<any> }>; [key: string]: any }) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [ready, setReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    factory().then(mod => setComponent(() => mod.default))
  }, [])

  useEffect(() => {
    if (!Component || !containerRef.current) return
    const el = containerRef.current
    // Clerk renders a form or buttons — check for any meaningful child content
    if (el.querySelector('button, input, form')) {
      setReady(true)
      return
    }
    const observer = new MutationObserver(() => {
      if (el.querySelector('button, input, form')) {
        setReady(true)
        observer.disconnect()
      }
    })
    observer.observe(el, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [Component])

  return (
    <div ref={containerRef} className="relative min-h-[340px]">
      {Component && createElement(Component, props)}
      {!ready && (
        <div className="absolute inset-0">
          <ClerkSkeleton />
        </div>
      )}
    </div>
  )
}

const SignInLoader = (props: any) => (
  <ClerkLazy factory={() => import('@clerk/react').then(m => ({ default: m.SignIn }))} {...props} />
)
const SignUpLoader = (props: any) => (
  <ClerkLazy factory={() => import('@clerk/react').then(m => ({ default: m.SignUp }))} {...props} />
)
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import Homepage from './Homepage'
import ProjectDashboard from './ProjectDashboard'

type Route = 'home' | 'dashboard' | 'sign-in' | 'sign-up'

function getRouteFromPath(): Route {
  const path = window.location.pathname
  if (path === '/dashboard' || path === '/dashboard/') {
    return 'dashboard'
  }
  if (path.startsWith('/sign-in')) {
    return 'sign-in'
  }
  if (path.startsWith('/sign-up')) {
    return 'sign-up'
  }
  // Also support hash routing for simpler deployment
  if (window.location.hash === '#dashboard') {
    return 'dashboard'
  }
  if (window.location.hash.startsWith('#sign-in')) {
    return 'sign-in'
  }
  if (window.location.hash.startsWith('#sign-up')) {
    return 'sign-up'
  }
  return 'home'
}

// Component to sync Clerk user to Convex
function UserSync() {
  const { user, isLoaded } = useUser()
  const upsertUser = useMutation(api.users.upsertUser)

  useEffect(() => {
    if (isLoaded && user) {
      upsertUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name: user.fullName || user.firstName || '',
        imageUrl: user.imageUrl,
      }).catch(console.error)
    }
  }, [isLoaded, user, upsertUser])

  return null
}

// Shared Clerk appearance config
const clerkAppearance = {
  variables: {
    colorPrimary: '#f4b400',
    colorPrimaryHover: '#e6a800',
    colorBackground: 'transparent',
    colorInputBackground: 'rgba(255, 255, 255, 0.05)',
    colorInputText: '#ffffff',
    colorText: '#d1d5db',
    colorTextSecondary: '#9ca3af',
    colorTextOnPrimaryBackground: '#000000',
    colorNeutral: 'rgba(255, 255, 255, 0.1)',
    colorDanger: '#ef4444',
    colorSuccess: '#34d399',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    fontSize: '13px',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: { width: '100%', maxWidth: '100%', display: 'flex', justifyContent: 'center' },
    card: {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box' as const,
      backgroundColor: 'rgba(30, 35, 41, 0.8)',
      backdropFilter: 'blur(32px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '2rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    headerTitle: { display: 'none' },
    headerSubtitle: { display: 'none' },
    socialButtonsBlockButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.75rem',
      color: '#ffffff',
      textTransform: 'uppercase',
      fontSize: '11px',
      letterSpacing: '0.05em',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#ffffff',
      fontSize: '11px',
    },
    socialButtonsProviderIcon: {},
    dividerLine: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
      color: '#6b7280',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
    formFieldLabel: {
      color: '#9ca3af',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      fontWeight: '700',
    },
    formFieldInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.75rem',
      color: '#ffffff',
      fontSize: '13px',
      '&::placeholder': { color: '#4b5563' },
      '&:focus': {
        borderColor: 'rgba(244, 180, 0, 0.4)',
        boxShadow: '0 0 0 1px rgba(244, 180, 0, 0.2)',
      },
    },
    formButtonPrimary: {
      backgroundColor: '#f4b400',
      color: '#000000',
      fontWeight: 900,
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderRadius: '0.75rem',
      padding: '0.75rem',
      height: 'auto',
      boxShadow: '0 10px 15px -3px rgba(244, 180, 0, 0.2)',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: '#e6a800',
        boxShadow: '0 10px 25px -5px rgba(244, 180, 0, 0.3)',
      },
    },
    footerActionText: {
      color: '#6b7280',
      fontSize: '10px',
    },
    footerActionLink: {
      color: '#f4b400',
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      '&:hover': { color: '#f4b400cc' },
    },
    identityPreviewText: {
      color: '#ffffff',
      fontSize: '12px',
    },
    identityPreviewEditButton: {
      color: '#f4b400',
      '&:hover': { color: '#f4b400cc' },
    },
    formFieldInputShowPasswordButton: {
      color: '#9ca3af',
      '&:hover': { color: '#ffffff' },
    },
    alert: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.2)',
      borderRadius: '0.75rem',
    },
    alertText: {
      color: '#d1d5db',
      fontSize: '12px',
    },
    formFieldSuccessText: {
      color: '#34d399',
      fontSize: '12px',
    },
    formFieldErrorText: {
      color: '#f87171',
      fontSize: '12px',
    },
    formFieldHintText: {
      color: '#6b7280',
      fontSize: '10px',
    },
    formResendCodeLink: {
      color: '#f4b400',
      fontSize: '12px',
      '&:hover': { color: '#f4b400cc' },
    },
    formFieldAction: {
      color: '#f4b400',
      fontSize: '10px',
      '&:hover': { color: '#f4b400cc' },
    },
    otpCodeFieldInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.5rem',
      color: '#ffffff',
    },
    main: { gap: '1rem' },
  },
}

// Skeleton loader matching Clerk card layout
function ClerkSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-5">
      {/* Social buttons */}
      <div className="flex gap-3">
        <div className="flex-1 h-11 bg-white/5 rounded-xl border border-white/10" />
        <div className="flex-1 h-11 bg-white/5 rounded-xl border border-white/10" />
        <div className="flex-1 h-11 bg-white/5 rounded-xl border border-white/10" />
      </div>
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <div className="w-20 h-3 bg-white/5 rounded" />
        <div className="flex-1 h-px bg-white/10" />
      </div>
      {/* Form fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="w-16 h-3 bg-white/5 rounded" />
          <div className="w-full h-11 bg-white/5 rounded-xl border border-white/10" />
        </div>
        <div className="space-y-1.5">
          <div className="w-16 h-3 bg-white/5 rounded" />
          <div className="w-full h-11 bg-white/5 rounded-xl border border-white/10" />
        </div>
      </div>
      {/* Submit button */}
      <div className="w-full h-11 bg-architectural-yellow/20 rounded-xl" />
      {/* Footer link */}
      <div className="flex justify-center">
        <div className="w-40 h-3 bg-white/5 rounded" />
      </div>
    </div>
  )
}

// Sign In page component
function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4 selection:bg-architectural-yellow selection:text-black overflow-hidden relative">
      {/* Architectural Grid Background */}
      <div className="fixed inset-0 architectural-grid opacity-30 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-architectural-yellow/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-architectural-yellow text-black flex items-center justify-center font-bold text-2xl rounded-xl shadow-lg shadow-architectural-yellow/20">
              A
            </div>
          </a>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Welcome Back</h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Sign in to your studio</p>
        </div>

        <SignInLoader 
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={clerkAppearance}
        />

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
            Arki Challenge · Practice Architecture Like a Pro
          </p>
        </div>
      </div>
    </div>
  )
}

// Sign Up page component
function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4 selection:bg-architectural-yellow selection:text-black overflow-hidden relative">
      {/* Architectural Grid Background */}
      <div className="fixed inset-0 architectural-grid opacity-30 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-architectural-yellow/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-architectural-yellow text-black flex items-center justify-center font-bold text-2xl rounded-xl shadow-lg shadow-architectural-yellow/20">
              A
            </div>
          </a>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Start Designing</h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Create your studio account</p>
        </div>

        <SignUpLoader 
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
          appearance={clerkAppearance}
        />

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
            Arki Challenge · Practice Architecture Like a Pro
          </p>
        </div>
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
    return <SignInPage />
  }

  return (
    <>
      <UserSync />
      <ProjectDashboard />
    </>
  )
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
  if (route === 'sign-in') {
    return <SignInPage />
  }
  
  if (route === 'sign-up') {
    return <SignUpPage />
  }
  
  if (route === 'dashboard') {
    return <ProtectedDashboard />
  }

  return <Homepage />
}
