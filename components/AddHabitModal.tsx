'use client'

import { useState } from 'react'
import { createHabit, updateHabit } from '@/lib/firestore'
import { HABIT_COLORS } from '@/lib/types'
import type { Habit, Schedule } from '@/lib/types'

const EMOJIS = [
  '🏃', '💪', '📚', '🧘', '💧', '🥗', '😴', '✍️',
  '🎯', '🎸', '🧠', '💊', '🚴', '🌅', '🍎', '🧹',
  '💰', '📱', '🎨', '🌿', '☕', '🏊', '🤸', '📝',
  '🎵', '💻', '🌙', '🏋️', '🚶', '🫧', '🍵', '🙏',
]

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  userId: string
  habitCount: number
  existingHabit?: Habit
  onClose: () => void
  onSaved?: () => void
}

export default function AddHabitModal({
  userId,
  habitCount,
  existingHabit,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(existingHabit?.name || '')
  const [emoji, setEmoji] = useState(existingHabit?.emoji || '🎯')
  const [color, setColor] = useState(existingHabit?.color || HABIT_COLORS[0])
  const [scheduleType, setScheduleType] = useState<Schedule['type']>(
    existingHabit?.schedule.type || 'daily'
  )
  const [selectedDays, setSelectedDays] = useState<number[]>(
    existingHabit?.schedule.type === 'weekly' || existingHabit?.schedule.type === 'specific_days'
      ? existingHabit.schedule.days
      : [1, 2, 3, 4, 5]
  )
  const [timesPerWeek, setTimesPerWeek] = useState(
    existingHabit?.schedule.type === 'times_per_week' ? existingHabit.schedule.count : 3
  )
  const [loading, setLoading] = useState(false)

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  function buildSchedule(): Schedule {
    switch (scheduleType) {
      case 'daily':
        return { type: 'daily' }
      case 'weekly':
        return { type: 'weekly', days: selectedDays }
      case 'specific_days':
        return { type: 'specific_days', days: selectedDays }
      case 'times_per_week':
        return { type: 'times_per_week', count: timesPerWeek }
      default:
        return { type: 'daily' }
    }
  }

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const schedule = buildSchedule()
      if (existingHabit) {
        await updateHabit(existingHabit.id, { name: name.trim(), emoji, color, schedule })
      } else {
        await createHabit(userId, {
          name: name.trim(),
          emoji,
          color,
          schedule,
          order: habitCount,
        })
      }
      onSaved?.()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-md animate-slide-up rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'var(--border)' }}
          />
        </div>

        <div className="px-6 pb-8 pt-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-xl font-display font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {existingHabit ? 'Edit Habit' : 'New Habit'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>

          {/* Emoji preview + Name */}
          <div className="flex gap-3 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ background: color + '22', border: `2px solid ${color}44` }}
            >
              {emoji}
            </div>
            <input
              className="input flex-1 px-4 py-3 text-base"
              placeholder="Habit name…"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={40}
              autoFocus
            />
          </div>

          {/* Emoji picker */}
          <div className="mb-5">
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Pick an emoji
            </label>
            <div className="grid grid-cols-8 gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                  style={{
                    background: emoji === e ? 'rgba(8,131,149,0.15)' : 'var(--input-bg)',
                    border: emoji === e ? '1.5px solid #088395' : '1.5px solid transparent',
                    transform: emoji === e ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="mb-5">
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Accent color
            </label>
            <div className="flex gap-2 flex-wrap">
              {HABIT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: color === c ? 'scale(1.25)' : 'scale(1)',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Schedule
            </label>

            {/* Schedule type pills */}
            <div className="flex gap-2 flex-wrap mb-3">
              {[
                { value: 'daily', label: 'Daily' },
                { value: 'specific_days', label: 'Specific days' },
                { value: 'times_per_week', label: '× per week' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setScheduleType(opt.value as Schedule['type'])}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: scheduleType === opt.value ? '#088395' : 'var(--input-bg)',
                    color: scheduleType === opt.value ? '#fff' : 'var(--text-secondary)',
                    border: `1.5px solid ${scheduleType === opt.value ? '#088395' : 'transparent'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Day selector */}
            {(scheduleType === 'specific_days' || scheduleType === 'weekly') && (
              <div className="flex gap-2">
                {DAY_NAMES.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: selectedDays.includes(i) ? '#088395' : 'var(--input-bg)',
                      color: selectedDays.includes(i) ? '#fff' : 'var(--text-muted)',
                    }}
                    title={DAY_FULL[i]}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}

            {/* Times per week */}
            {scheduleType === 'times_per_week' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTimesPerWeek(Math.max(1, timesPerWeek - 1))}
                  className="w-10 h-10 rounded-xl text-xl font-bold"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                >
                  −
                </button>
                <span
                  className="text-2xl font-display font-bold w-8 text-center"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {timesPerWeek}
                </span>
                <button
                  onClick={() => setTimesPerWeek(Math.min(7, timesPerWeek + 1))}
                  className="w-10 h-10 rounded-xl text-xl font-bold"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                >
                  +
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>times per week</span>
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!name.trim() || loading}
            className="btn-primary w-full py-4 text-base"
          >
            {loading ? 'Saving…' : existingHabit ? 'Save changes' : 'Add habit'}
          </button>
        </div>
      </div>
    </div>
  )
}
