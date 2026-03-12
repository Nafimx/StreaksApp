'use client'

import { useState } from 'react'
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { createOrUpdateUserProfile } from '@/lib/firestore'

export default function AuthScreen() {
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null)
  const [error, setError] = useState('')

  async function signInWith(provider: 'google' | 'facebook') {
    setLoading(provider)
    setError('')
    try {
      const authProvider =
        provider === 'google'
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider()

      const result = await signInWithPopup(auth, authProvider)
      await createOrUpdateUserProfile({
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      })
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string }
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Sign in failed. Try again.')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background decoration */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -20%, rgba(8,131,149,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(9,99,126,0.08) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, #088395, #09637E)',
              boxShadow: '0 8px 32px rgba(8,131,149,0.35)',
            }}
          >
            <span className="text-3xl font-display font-bold text-white">S</span>
            {/* Pulse ring */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                animation: 'pulseRing 2s cubic-bezier(0.24, 0, 0.38, 1) infinite',
                border: '2px solid rgba(8,131,149,0.4)',
              }}
            />
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-display font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Streaks
          </h1>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Track every habit.{' '}
            <span className="gradient-text font-medium">See your momentum grow.</span>
          </p>
        </div>

        {/* Sign in buttons */}
        <div className="space-y-3">
          <button
            onClick={() => signInWith('google')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl transition-all duration-200"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 500,
              fontSize: 15,
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--teal)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            }}
          >
            {loading === 'google' ? (
              <LoadingSpinner />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <button
            onClick={() => signInWith('facebook')}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl transition-all duration-200"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 500,
              fontSize: 15,
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(24,119,242,0.5)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            }}
          >
            {loading === 'facebook' ? (
              <LoadingSpinner />
            ) : (
              <FacebookIcon />
            )}
            Continue with Facebook
          </button>
        </div>

        {error && (
          <p
            className="mt-4 text-sm text-center"
            style={{ color: '#E07B39' }}
          >
            {error}
          </p>
        )}

        <p
          className="mt-8 text-xs text-center leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          By signing in, you agree to track your habits and{' '}
          maybe change your life a little.
        </p>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="var(--border)"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="#088395"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
