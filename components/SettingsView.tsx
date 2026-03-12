'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Image from 'next/image'
import type { Habit, Completion, UserProfile } from '@/lib/types'
import {
  exportToCSV,
  downloadCSV,
  importFromCSV,
  updateUserStats,
  calculateCurrentStreak,
  subscribeArchivedHabits,
  unarchiveHabit,
  deleteHabitPermanently,
} from '@/lib/firestore'
import toast from 'react-hot-toast'

interface Props {
  user: UserProfile
  habits: Habit[]
  completions: Completion[]
  isDark: boolean
  onToggleTheme: () => void
  currentStreak: number
}

export default function SettingsView({
  user,
  habits,
  completions,
  isDark,
  onToggleTheme,
  currentStreak,
}: Props) {
  const [importLoading, setImportLoading] = useState(false)
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = subscribeArchivedHabits(user.uid, setArchivedHabits)
    return unsub
  }, [user.uid])

  function handleExport() {
    const csv = exportToCSV(habits, completions)
    downloadCSV(csv, `streaks-export-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('CSV exported!')
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const text = await file.text()
      const { imported, skipped } = await importFromCSV(user.uid, text, habits)
      toast.success(`Imported ${imported} entries${skipped > 0 ? `, skipped ${skipped}` : ''}`)
    } catch {
      toast.error('Failed to import CSV')
    } finally {
      setImportLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleShareStory() {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')!

    // Background
    const bg = isDark ? '#131B24' : '#F4FAFB'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1080, 1920)

    // Gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
    grad.addColorStop(0, 'rgba(8,131,149,0.08)')
    grad.addColorStop(1, 'rgba(9,99,126,0.04)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1920)

    // "S" logo mark
    ctx.fillStyle = '#088395'
    ctx.roundRect(440, 200, 200, 200, 40)
    ctx.fill()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 120px serif'
    ctx.textAlign = 'center'
    ctx.fillText('S', 540, 360)

    // Title
    ctx.fillStyle = isDark ? '#EBF4F6' : '#0D1F2D'
    ctx.font = 'bold 80px serif'
    ctx.textAlign = 'center'
    ctx.fillText('Streaks', 540, 560)

    // Name
    ctx.fillStyle = isDark ? '#7AB2B2' : '#4A7080'
    ctx.font = '48px sans-serif'
    ctx.fillText(user.displayName, 540, 660)

    // Big streak number
    ctx.fillStyle = '#088395'
    ctx.font = 'bold 180px serif'
    ctx.fillText(`${currentStreak}`, 540, 900)

    ctx.fillStyle = isDark ? '#7AB2B2' : '#4A7080'
    ctx.font = '60px sans-serif'
    ctx.fillText('day streak 🔥', 540, 1000)

    // Stats
    ctx.fillStyle = isDark ? '#4A6880' : '#8AAABB'
    ctx.font = '44px sans-serif'
    ctx.fillText(`${habits.length} habits • ${completions.length} total completions`, 540, 1120)

    // App watermark
    ctx.fillStyle = 'rgba(8,131,149,0.5)'
    ctx.font = '36px sans-serif'
    ctx.fillText('streaks.app', 540, 1800)

    canvas.toBlob(blob => {
      if (!blob) return
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'streak.png', { type: 'image/png' })] })) {
        navigator.share({
          files: [new File([blob], 'my-streak.png', { type: 'image/png' })],
          title: `My ${currentStreak}-day streak on Streaks!`,
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'my-streak.png'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Story image downloaded!')
      }
    }, 'image/png')
  }

  async function handleSignOut() {
    if (!confirm('Sign out of Streaks?')) return
    try {
      await signOut(auth)
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="page-content px-4">
      {/* Header */}
      <div className="py-5">
        <h1
          className="text-2xl font-display font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Settings
        </h1>
      </div>

      {/* Profile card */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName}
              width={56}
              height={56}
              className="rounded-full"
              style={{ border: '2px solid var(--border)' }}
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-display font-bold text-xl"
              style={{ background: 'linear-gradient(135deg, #088395, #09637E)', color: '#fff' }}
            >
              {user.displayName[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              {user.displayName}
            </p>
            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
              {user.email}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Joined {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Streak', value: `${currentStreak}🔥` },
            { label: 'Habits', value: habits.length },
            { label: 'Completions', value: completions.length },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <SectionHeader label="Appearance" />
      <div className="card mb-4">
        <SettingRow
          icon={isDark ? '🌙' : '☀️'}
          label={isDark ? 'Dark mode' : 'Light mode'}
          description="Toggle between light and dark"
          action={
            <button
              onClick={onToggleTheme}
              className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
              style={{ background: isDark ? '#088395' : 'var(--border)' }}
            >
              <div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                style={{ transform: isDark ? 'translateX(26px)' : 'translateX(4px)' }}
              />
            </button>
          }
        />
      </div>

      {/* Data */}
      <SectionHeader label="Data" />
      <div className="card mb-4">
        <SettingRow
          icon="📤"
          label="Export as CSV"
          description={`${completions.length} entries`}
          action={
            <button
              onClick={handleExport}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(8,131,149,0.12)', color: '#088395' }}
            >
              Export
            </button>
          }
        />
        <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
        <SettingRow
          icon="📥"
          label="Import from CSV"
          description="Restore from backup"
          action={
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importLoading}
                className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(8,131,149,0.12)', color: '#088395' }}
              >
                {importLoading ? '…' : 'Import'}
              </button>
            </>
          }
        />
      </div>

      {/* Share */}
      <SectionHeader label="Share" />
      <div className="card mb-4">
        <SettingRow
          icon="📱"
          label="Share as Story"
          description="Generate a beautiful recap image"
          action={
            <button
              onClick={handleShareStory}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(8,131,149,0.12)', color: '#088395' }}
            >
              Share
            </button>
          }
        />
        <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
        <SettingRow
          icon="🔗"
          label="Copy invite link"
          description="Invite friends to Streaks"
          action={
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin)
                toast.success('Link copied!')
              }}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(8,131,149,0.12)', color: '#088395' }}
            >
              Copy
            </button>
          }
        />
      </div>

      {/* Archived Habits */}
      <SectionHeader label={`Archived Habits ${archivedHabits.length > 0 ? `(${archivedHabits.length})` : ''}`} />
      <div className="card mb-4">
        {archivedHabits.length === 0 ? (
          <div className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            No archived habits
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🗃️</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {showArchived ? 'Hide' : 'Show'} archived habits
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)', transform: showArchived ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
            </button>

            {showArchived && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {archivedHabits.map(habit => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="text-xl">{habit.emoji}</span>
                    <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {habit.name}
                    </span>
                    <button
                      onClick={async () => {
                        await unarchiveHabit(habit.id)
                        toast.success(`${habit.name} restored!`)
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg mr-2"
                      style={{ background: 'rgba(8,131,149,0.12)', color: '#088395' }}
                    >
                      Restore
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Permanently delete "${habit.name}"? This cannot be undone.`)) return
                        await deleteHabitPermanently(habit.id)
                        toast.success('Habit deleted')
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(224,123,57,0.1)', color: '#E07B39' }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Account */}
      <SectionHeader label="Account" />
      <div className="card mb-8">
        <SettingRow
          icon="🚪"
          label="Sign out"
          description="Come back anytime"
          action={
            <button
              onClick={handleSignOut}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(224,123,57,0.1)', color: '#E07B39' }}
            >
              Sign out
            </button>
          }
        />
      </div>

      <p className="text-center text-xs pb-4" style={{ color: 'var(--text-muted)' }}>
        Streaks v1.0 • Built with 🩵
      </p>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wider px-1 mb-2"
      style={{ color: 'var(--text-muted)' }}
    >
      {label}
    </p>
  )
}

function SettingRow({
  icon,
  label,
  description,
  action,
}: {
  icon: string
  label: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-xl w-8 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
