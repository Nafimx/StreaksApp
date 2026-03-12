export type Schedule =
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] } // 0=Sun, 1=Mon, ..., 6=Sat
  | { type: 'specific_days'; days: number[] }
  | { type: 'monthly'; dates: number[] } // 1-31
  | { type: 'times_per_week'; count: number }

export interface Habit {
  id: string
  userId: string
  name: string
  emoji: string
  color: string // hex color for individual accent
  schedule: Schedule
  createdAt: string // ISO date string
  archived: boolean
  order: number
}

export interface Completion {
  id: string
  habitId: string
  userId: string
  date: string // YYYY-MM-DD
  completedAt: string // ISO timestamp
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string
  friends: string[] // array of friend UIDs
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  joinedAt: string
}

export interface DayData {
  date: string // YYYY-MM-DD
  completedCount: number
  totalCount: number
  ratio: number // 0-1
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4

export function getHeatLevel(ratio: number, hasData: boolean): HeatLevel {
  if (!hasData || ratio === 0) return 0
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function getHeatColor(level: HeatLevel, isDark: boolean): string {
  const opacity = isDark
    ? [0.09, 0.25, 0.45, 0.70, 1.0]
    : [0.07, 0.22, 0.42, 0.68, 1.0]
  return `rgba(8, 131, 149, ${opacity[level]})`
}

export const HABIT_COLORS = [
  '#088395', '#09637E', '#7AB2B2',
  '#0EA5A5', '#0B8B76', '#1B7A9E',
  '#5E8DC9', '#7B62D4', '#C4528A',
  '#E07B39', '#D4A017', '#5C9E3A',
]

export const DAYS_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const MONTHS_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
