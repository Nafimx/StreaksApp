'use client'

import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  subscribeHabits,
  subscribeCompletions,
  subscribeUserProfile,
  calculateCurrentStreak,
  updateUserStats,
} from '@/lib/firestore'
import { todayString } from '@/lib/utils'
import type { Habit, Completion, UserProfile } from '@/lib/types'

import AuthScreen from '@/components/AuthScreen'
import HomeView from '@/components/HomeView'
import StreaksView from '@/components/StreaksView'
import LeaderboardView from '@/components/LeaderboardView'
import SettingsView from '@/components/SettingsView'
import TabBar, { Tab } from '@/components/TabBar'

export default function App() {
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [isDark, setIsDark] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // Theme init
  useEffect(() => {
    const stored = localStorage.getItem('streaks-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored ? stored === 'dark' : prefersDark
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('streaks-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setAuthUser(user)
      if (!user) setIsReady(true)
    })
    return unsub
  }, [])

  // User profile subscription
  useEffect(() => {
    if (!authUser) return
    const unsub = subscribeUserProfile(authUser.uid, profile => {
      setUserProfile(profile)
      setIsReady(true)
    })
    return unsub
  }, [authUser])

  // Habits subscription
  useEffect(() => {
    if (!authUser) return
    const unsub = subscribeHabits(authUser.uid, setHabits)
    return unsub
  }, [authUser])

  // Completions subscription (last 400 days)
  useEffect(() => {
    if (!authUser) return
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 400)
    const startStr = startDate.toISOString().split('T')[0]
    const unsub = subscribeCompletions(authUser.uid, startStr, setCompletions)
    return unsub
  }, [authUser])

  // Calculate and sync streak
  useEffect(() => {
    if (!authUser || habits.length === 0) return
    const streak = calculateCurrentStreak(completions, habits)
    setCurrentStreak(streak)

    // Update user stats in Firestore (debounced via habit/completion changes)
    const timeout = setTimeout(() => {
      if (authUser) {
        updateUserStats(authUser.uid, {
          currentStreak: streak,
          longestStreak: Math.max(streak, userProfile?.longestStreak || 0),
          totalCompletions: completions.length,
        }).catch(() => {})
      }
    }, 2000)
    return () => clearTimeout(timeout)
  }, [completions, habits, authUser])

  // Today's progress for tab bar
  const today = todayString()
  const todayDate = new Date()
  const todayHabits = habits.filter(h => {
    const { schedule } = h
    switch (schedule.type) {
      case 'daily': return true
      case 'weekly':
      case 'specific_days': return schedule.days.includes(todayDate.getDay())
      case 'monthly': return schedule.dates.includes(todayDate.getDate())
      default: return true
    }
  })
  const todayCompletedCount = completions.filter(
    c => c.date === today && todayHabits.some(h => h.id === c.habitId)
  ).length
  const todayProgress = todayHabits.length > 0 ? todayCompletedCount / todayHabits.length : 0

  // Loading state
  if (authUser === undefined || !isReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #088395, #09637E)' }}
          >
            <span className="text-3xl font-display font-bold text-white">S</span>
          </div>
          <div
            className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#088395', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    )
  }

  if (!authUser) {
    return <AuthScreen />
  }

  if (!userProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#088395', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen max-w-lg mx-auto"
      style={{ background: 'var(--bg)' }}
    >
      {/* Page content */}
      <div className="relative">
        {activeTab === 'home' && (
          <HomeView
            user={userProfile}
            habits={habits}
            completions={completions}
            isDark={isDark}
            currentStreak={currentStreak}
          />
        )}
        {activeTab === 'streaks' && (
          <StreaksView
            user={userProfile}
            habits={habits}
            completions={completions}
            isDark={isDark}
          />
        )}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            user={userProfile}
            currentStreak={currentStreak}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView
            user={userProfile}
            habits={habits}
            completions={completions}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            currentStreak={currentStreak}
          />
        )}
      </div>

      {/* Bottom tab bar */}
      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        todayProgress={todayProgress}
      />
    </div>
  )
}
