'use client'

import { useState } from 'react'
import type { Habit, Completion, UserProfile } from '@/lib/types'
import {
  archiveHabit,
  isHabitScheduledForDate,
  calculateCurrentStreak,
} from '@/lib/firestore'
import { generateHabitHeatmapData, getScheduleLabel, todayString } from '@/lib/utils'
import HeatMap from './HeatMap'
import AddHabitModal from './AddHabitModal'
import toast from 'react-hot-toast'

interface Props {
  user: UserProfile
  habits: Habit[]
  completions: Completion[]
  isDark: boolean
}

export default function StreaksView({ user, habits, completions, isDark }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const today = todayString()
  const todayDate = new Date()

  const completionsByHabit = new Map<string, Completion[]>()
  for (const c of completions) {
    if (!completionsByHabit.has(c.habitId)) {
      completionsByHabit.set(c.habitId, [])
    }
    completionsByHabit.get(c.habitId)!.push(c)
  }

  async function handleArchive(habit: Habit) {
    if (!confirm(`Archive "${habit.name}"? This won't delete your history.`)) return
    try {
      await archiveHabit(habit.id)
      toast.success('Habit archived')
    } catch {
      toast.error('Failed to archive')
    }
  }

  return (
    <div className="page-content px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-5">
        <div>
          <h1
            className="text-2xl font-display font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            My Streaks
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {habits.length} active habit{habits.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
            No habits yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Start tracking your first habit to see your heatmap
          </p>
          <button className="btn-primary px-6 py-3" onClick={() => setShowAdd(true)}>
            Create your first habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const habitCompletions = completionsByHabit.get(habit.id) || []
            const heatData = generateHabitHeatmapData(habit, habitCompletions)
            const isExpanded = expandedId === habit.id
            const isDoneToday = habitCompletions.some(c => c.date === today)
            const isScheduledToday = isHabitScheduledForDate(habit, todayDate)

            // Calculate streak for this habit
            const streak = calculateCurrentStreak(habitCompletions, [habit])
            const totalDone = habitCompletions.length

            // Last 30 days for mini stat
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const thirtyDayStr = thirtyDaysAgo.toISOString().split('T')[0]
            const last30 = habitCompletions.filter(c => c.date >= thirtyDayStr).length

            return (
              <div
                key={habit.id}
                className="card overflow-hidden transition-all duration-300"
                style={{
                  borderColor: isExpanded ? habit.color + '66' : 'var(--border)',
                }}
              >
                {/* Habit header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : habit.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  {/* Status dot */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: `${habit.color}22`,
                      border: `1.5px solid ${habit.color}44`,
                    }}
                  >
                    {habit.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-display font-semibold text-sm truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {habit.name}
                      </span>
                      {isScheduledToday && isDoneToday && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ background: habit.color + '22', color: habit.color }}
                        >
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {getScheduleLabel(habit.schedule)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className="text-lg font-display font-bold"
                        style={{ color: habit.color }}
                      >
                        {streak}🔥
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        streak
                      </div>
                    </div>
                    <div
                      className="transition-transform duration-200"
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <ChevronIcon />
                    </div>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 animate-fade-up">
                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <MiniStat label="All time" value={totalDone} color={habit.color} />
                      <MiniStat label="Last 30d" value={last30} color={habit.color} />
                      <MiniStat label="Streak" value={streak} suffix="🔥" color={habit.color} />
                    </div>

                    {/* Heatmap */}
                    <div
                      className="rounded-xl p-3 overflow-x-auto mb-4"
                      style={{ background: 'var(--input-bg)' }}
                    >
                      <HeatMap
                        data={heatData}
                        isDark={isDark}
                        cellSize={10}
                        gap={2}
                        showLabels={true}
                        accentColor={habit.color}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: 'var(--input-bg)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleArchive(habit)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: 'rgba(224,123,57,0.08)',
                          color: '#E07B39',
                          border: '1px solid rgba(224,123,57,0.2)',
                        }}
                      >
                        🗃️ Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

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
        </div>
      )}

      {editingHabit && (
        <AddHabitModal
          userId={user.uid}
          habitCount={habits.length}
          existingHabit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSaved={() => toast.success('Habit updated!')}
        />
      )}

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

function MiniStat({
  label,
  value,
  suffix = '',
  color,
}: {
  label: string
  value: number
  suffix?: string
  color: string
}) {
  return (
    <div
      className="rounded-xl py-2.5 px-3 text-center"
      style={{ background: `${color}10` }}
    >
      <div className="font-display font-bold text-lg" style={{ color }}>
        {value}{suffix}
      </div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
