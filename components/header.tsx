// components/Header.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

// UserGreeting Komponente für den Header
const UserGreeting: React.FC<{ user: any; compact?: boolean }> = ({ user, compact = false }) => {
  // Bestimme den Anzeigenamen
  const getDisplayName = () => {
    if (!user) return 'Gast'
    
    // Prioritätsreihenfolge für Name-Quellen:
    // 1. full_name aus user_metadata
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    
    // 2. name aus user_metadata
    if (user.user_metadata?.name) {
      return user.user_metadata.name
    }
    
    // 3. username aus user_metadata (NEU - höhere Priorität als Email)
    if (user.user_metadata?.username) {
      return user.user_metadata.username
    }
    
    // 4. username direkt am User-Objekt (falls Supabase es dort speichert)
    if (user.username) {
      return user.username
    }
    
    // 5. Email-Teil vor dem @ (Fallback)
    if (user.email) {
      return user.email.split('@')[0]
    }
    
    // 6. Fallback
    return 'Abenteurer'
  }

  // Bestimme Begrüßung basierend auf Tageszeit
  const getGreeting = () => {
    const hour = new Date().getHours()
    
    if (hour >= 5 && hour < 12) return compact ? 'Morgen' : 'Guten Morgen'
    if (hour >= 12 && hour < 18) return compact ? 'Hallo' : 'Guten Tag'
    if (hour >= 18 && hour < 22) return compact ? 'Abend' : 'Guten Abend'
    return compact ? 'Nacht' : 'Gute Nacht'
  }

  const displayName = getDisplayName()
  const greeting = getGreeting()

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-gray-300">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-gray-600"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center border border-gray-600">
              <span className="text-white font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Greeting Text */}
        <div className="hidden sm:block">
          <span className="text-sm">
            {greeting}, <span className="text-white font-medium">{displayName}</span>!
          </span>
        </div>
      </div>
    )
  }

  // Full version für Timeline etc.
  return (
    <div className="bg-gradient-to-r from-gray-800/50 via-gray-700/60 to-gray-800/50 border border-gray-600/40 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {user?.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar"
              className="w-10 h-10 rounded-full border-2 border-blue-500/60"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center border-2 border-blue-500/60">
              <span className="text-white font-bold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Greeting Text */}
        <div className="flex-1">
          <div className="text-gray-200 font-serif">
            <span className="text-gray-100 font-semibold">
              {greeting}, {displayName}! 
            </span>
            <span className="text-gray-300 ml-2">
              Das ist deine Timeline
            </span>
          </div>
          
          {/* Additional Info */}
          {user && (
            <div className="text-gray-400 text-sm mt-1">
              <span className="mr-4">📜 Chronos Codex</span>
              {user.email && (
                <span className="text-gray-500">• {user.email}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Status */}
        <div className="flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs">Gast</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-gray-900 text-white border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Title */}
          <div className="flex-shrink-0">
            <Link href="/" className="font-bold text-xl">
              DND Lore Manager
            </Link>
          </div>

          {/* User Greeting (zwischen Logo und Navigation) */}
          <div className="hidden lg:flex flex-1 justify-center max-w-md">
            <UserGreeting user={user} compact={true} />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-300 hover:text-white transition">
              Home
            </Link>
            <Link href="/ArticleView" className="text-gray-300 hover:text-white transition">
              Articles
            </Link>
            <Link href="/games" className="text-gray-300 hover:text-white transition">
              Games
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/auth/UserHomepage" className="text-gray-300 hover:text-white transition">
                  Profil
                </Link>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Signup
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {/* Mobile User Greeting */}
          <div className="px-3 py-2 border-b border-gray-700 mb-2">
            <UserGreeting user={user} compact={true} />
          </div>
          
          <Link 
            href="/" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link 
            href="/ArticleView" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            Articles
          </Link>
          <Link 
            href="/games" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            Games
          </Link>
        </div>
      </div>
    </header>
  );
}

// Export UserGreeting für Verwendung in anderen Komponenten
export { UserGreeting };