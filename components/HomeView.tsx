'use client'

import { useState, useCallback } from 'react'
import type { Habit, Completion, UserProfile } from '@/lib/types'
import { toggleCompletion, isHabitScheduledForDate } from '@/lib/firestore'
import { generateHeatmapData, todayString, getScheduleLabel } from '@/lib/utils'
import HeatMap from './HeatMap'
import AddHabitModal from './AddHabitModal'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface Props {
  user: UserProfile
  habits: Habit[]
  completions: Completion[]
  isDark: boolean
  currentStreak: number
}

export default function HomeView({ user, habits, completions, isDark, currentStreak }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)
  const today = todayString()
  const todayDate = new Date()

  const todayHabits = habits.filter(h => isHabitScheduledForDate(h, todayDate))

  const completionsByHabit = new Map<string, string>()
  for (const c of completions) {
    if (c.date === today) {
      completionsByHabit.set(c.habitId, c.id)
    }
  }

  const completedToday = todayHabits.filter(h => completionsByHabit.has(h.id)).length
  const progressRatio = todayHabits.length > 0 ? completedToday / todayHabits.length : 0

  const heatmapData = generateHeatmapData(habits, completions, 364)

  async function handleToggle(habit: Habit) {
    if (completing) return
    setCompleting(habit.id)
    const existingId = completionsByHabit.get(habit.id)
    try {
      const result = await toggleCompletion(user.uid, habit.id, today, existingId)
      if (result === 'added') {
        toast.success(`${habit.emoji} ${habit.name} done!`, { duration: 1500 })
      }
    } catch {
      toast.error('Failed to update')
    } finally {
      setCompleting(null)
    }
  }

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12 ? 'Good morning' :
    greetingHour < 17 ? 'Good afternoon' :
    'Good evening'

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dateLabel = `${dayNames[todayDate.getDay()]}, ${monthNames[todayDate.getMonth()]} ${todayDate.getDate()}`

  return (
    <div className="page-content px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-5">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{dateLabel}</p>
          <h1
            className="text-2xl font-display font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {greeting}
            {user.displayName?.split(' ')[0]
              ? `, ${user.displayName.split(' ')[0]}`
              : ''}
          </h1>
        </div>
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName}
            width={40}
            height={40}
            className="rounded-full"
            style={{ border: '2px solid var(--border)' }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #088395, #09637E)', color: '#fff' }}
          >
            {(user.displayName || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard
          label="Streak"
          value={currentStreak}
          suffix="🔥"
          highlight
        />
        <StatCard
          label="Today"
          value={`${completedToday}/${todayHabits.length}`}
          suffix=""
        />
        <StatCard
          label="Total"
          value={completions.length}
          suffix="✓"
        />
      </div>

      {/* Progress bar */}
      {todayHabits.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Today's progress
            </span>
            <span className="text-xs font-bold gradient-text">
              {Math.round(progressRatio * 100)}%
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--cell-empty)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressRatio * 100}%`,
                background: progressRatio === 1
                  ? 'linear-gradient(90deg, #088395, #09637E)'
                  : 'linear-gradient(90deg, #7AB2B2, #088395)',
              }}
            />
          </div>
        </div>
      )}

      {/* Central Heatmap */}
      <div className="card p-4 mb-5 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              All Habits
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Last 52 weeks
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: level === 0
                    ? 'var(--cell-empty)'
                    : `rgba(8,131,149,${[0.08, 0.25, 0.45, 0.70, 1.0][level]})`,
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="overflow-x-auto pb-1">
          <HeatMap
            data={heatmapData}
            isDark={isDark}
            cellSize={11}
            gap={2}
            showLabels={true}
          />
        </div>
      </div>

      {/* Today's Habits */}
      <div className="mb-4">
        <h2
          className="font-display font-bold text-base mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Today
        </h2>

        {todayHabits.length === 0 ? (
          <div
            className="card p-8 text-center"
            style={{ borderStyle: 'dashed' }}
          >
            <div className="text-4xl mb-3">🌱</div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              No habits scheduled today
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Add your first habit below
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayHabits.map(habit => {
              const done = completionsByHabit.has(habit.id)
              const isLoading = completing === habit.id
              return (
                <button
                  key={habit.id}
                  onClick={() => handleToggle(habit)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 text-left ${done ? 'completion-pop' : ''}`}
                  style={{
                    background: done
                      ? `${habit.color}18`
                      : 'var(--card)',
                    border: `1px solid ${done ? habit.color + '44' : 'var(--border)'}`,
                    transform: isLoading ? 'scale(0.98)' : 'scale(1)',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      background: done
                        ? `linear-gradient(135deg, ${habit.color}, ${habit.color}cc)`
                        : 'transparent',
                      border: `2px solid ${done ? habit.color : 'var(--border)'}`,
                    }}
                  >
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Emoji */}
                  <span className="text-2xl">{habit.emoji}</span>

                  {/* Name + schedule */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm truncate"
                      style={{
                        color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {habit.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {getScheduleLabel(habit.schedule)}
                    </p>
                  </div>

                  {done && (
                    <span className="text-xs font-semibold" style={{ color: habit.color }}>
                      Done ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Add habit inline */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center gap-3 py-4 px-4 rounded-2xl transition-all duration-200"
        style={{
          background: 'transparent',
          border: `1.5px dashed var(--border)`,
          color: 'var(--text-muted)',
          fontFamily: 'Outfit, sans-serif',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#088395'
          ;(e.currentTarget as HTMLButtonElement).style.color = '#088395'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'
        }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ background: 'var(--input-bg)' }}
        >
          +
        </div>
        <span className="text-sm font-medium">Add habit…</span>
      </button>

      {showAdd && (
        <AddHabitModal
          userId={user.uid}
          habitCount={habits.length}
          onClose={() => setShowAdd(false)}
          onSaved={() => toast.success('Habit created!')}
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string
  value: number | string
  suffix: string
  highlight?: boolean
}) {
  return (
    <div
      className="card px-3 py-3 text-center"
      style={{
        background: highlight ? 'rgba(8,131,149,0.08)' : 'var(--card)',
        borderColor: highlight ? 'rgba(8,131,149,0.2)' : 'var(--border)',
      }}
    >
      <div
        className={`text-2xl font-display font-bold ${highlight ? 'streak-shimmer' : ''}`}
        style={!highlight ? { color: 'var(--text-primary)' } : {}}
      >
        {value}
        {suffix && <span className="text-lg ml-0.5">{suffix}</span>}
      </div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  )
}
