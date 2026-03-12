import { format, startOfWeek, eachDayOfInterval, subDays, addDays } from 'date-fns'
import type { Completion, Habit, DayData } from './types'
import { isHabitScheduledForDate } from './firestore'

export function generateHeatmapData(
  habits: Habit[],
  completions: Completion[],
  days = 364
): DayData[] {
  const today = new Date()
  const start = subDays(today, days - 1)
  const result: DayData[] = []

  const completionsByDate = new Map<string, Set<string>>()
  for (const c of completions) {
    if (!completionsByDate.has(c.date)) {
      completionsByDate.set(c.date, new Set())
    }
    completionsByDate.get(c.date)!.add(c.habitId)
  }

  for (let i = 0; i < days; i++) {
    const date = addDays(start, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const scheduledHabits = habits.filter(h => isHabitScheduledForDate(h, date))
    const completedIds = completionsByDate.get(dateStr) || new Set()
    const completedCount = scheduledHabits.filter(h => completedIds.has(h.id)).length
    const totalCount = scheduledHabits.length

    result.push({
      date: dateStr,
      completedCount,
      totalCount,
      ratio: totalCount > 0 ? completedCount / totalCount : 0,
    })
  }

  return result
}

export function generateHabitHeatmapData(
  habit: Habit,
  completions: Completion[],
  days = 364
): DayData[] {
  const today = new Date()
  const start = subDays(today, days - 1)
  const completionDates = new Set(completions.filter(c => c.habitId === habit.id).map(c => c.date))

  const result: DayData[] = []
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const scheduled = isHabitScheduledForDate(habit, date)
    const completed = completionDates.has(dateStr)

    result.push({
      date: dateStr,
      completedCount: completed ? 1 : 0,
      totalCount: scheduled ? 1 : 0,
      ratio: scheduled && completed ? 1 : 0,
    })
  }

  return result
}

export function getWeeksArray(data: DayData[]): DayData[][] {
  const weeks: DayData[][] = []
  let week: DayData[] = []

  // Pad to start on Sunday
  if (data.length > 0) {
    const firstDate = new Date(data[0].date + 'T00:00:00')
    const dayOfWeek = firstDate.getDay()
    for (let i = 0; i < dayOfWeek; i++) {
      week.push({ date: '', completedCount: 0, totalCount: 0, ratio: 0 })
    }
  }

  for (const day of data) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) weeks.push(week)
  return weeks
}

export function getMonthLabels(data: DayData[]): { label: string; col: number }[] {
  const weeks = getWeeksArray(data)
  const labels: { label: string; col: number }[] = []
  let lastMonth = -1

  weeks.forEach((week, col) => {
    const firstValid = week.find(d => d.date)
    if (!firstValid) return
    const month = new Date(firstValid.date + 'T00:00:00').getMonth()
    if (month !== lastMonth) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      labels.push({ label: monthNames[month], col })
      lastMonth = month
    }
  })

  return labels
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr + 'T00:00:00'), 'MMM d, yyyy')
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function getScheduleLabel(schedule: Habit['schedule']): string {
  switch (schedule.type) {
    case 'daily':
      return 'Every day'
    case 'weekly':
    case 'specific_days': {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return schedule.days.map(d => dayNames[d]).join(', ')
    }
    case 'monthly':
      return `Monthly (${schedule.dates.join(', ')})`
    case 'times_per_week':
      return `${schedule.count}× per week`
    default:
      return 'Custom'
  }
}

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
