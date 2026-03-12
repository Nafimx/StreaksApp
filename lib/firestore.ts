import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, where, orderBy, onSnapshot, setDoc, getDoc,
  serverTimestamp, Timestamp, writeBatch
} from 'firebase/firestore'
import { db } from './firebase'
import type { Habit, Completion, UserProfile, Schedule } from './types'
import { format } from 'date-fns'

// ─── User Profile ────────────────────────────────────────────────

export async function createOrUpdateUserProfile(user: {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || '',
      friends: [],
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      joinedAt: new Date().toISOString(),
    })
  } else {
    await updateDoc(ref, {
      displayName: user.displayName || snap.data().displayName,
      email: user.email || snap.data().email,
      photoURL: user.photoURL || snap.data().photoURL,
    })
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export function subscribeUserProfile(uid: string, cb: (p: UserProfile) => void) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) cb(snap.data() as UserProfile)
  })
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map(d => d.data() as UserProfile)
}

export async function addFriend(myUid: string, friendUid: string) {
  const ref = doc(db, 'users', myUid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const friends: string[] = snap.data().friends || []
  if (!friends.includes(friendUid)) {
    await updateDoc(ref, { friends: [...friends, friendUid] })
  }
}

export async function removeFriend(myUid: string, friendUid: string) {
  const ref = doc(db, 'users', myUid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const friends: string[] = snap.data().friends || []
  await updateDoc(ref, { friends: friends.filter(f => f !== friendUid) })
}

// ─── Habits ──────────────────────────────────────────────────────

export function subscribeHabits(userId: string, cb: (habits: Habit[]) => void) {
  const q = query(
    collection(db, 'habits'),
    where('userId', '==', userId),
    where('archived', '==', false),
    orderBy('order', 'asc')
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Habit))
  })
}

export async function createHabit(userId: string, data: {
  name: string
  emoji: string
  color: string
  schedule: Schedule
  order: number
}): Promise<string> {
  const ref = await addDoc(collection(db, 'habits'), {
    userId,
    ...data,
    archived: false,
    createdAt: new Date().toISOString(),
  })
  return ref.id
}

export async function updateHabit(habitId: string, data: Partial<Habit>) {
  await updateDoc(doc(db, 'habits', habitId), data as Record<string, unknown>)
}

export async function archiveHabit(habitId: string) {
  await updateDoc(doc(db, 'habits', habitId), { archived: true })
}

export async function unarchiveHabit(habitId: string) {
  await updateDoc(doc(db, 'habits', habitId), { archived: false })
}

export async function deleteHabitPermanently(habitId: string) {
  await deleteDoc(doc(db, 'habits', habitId))
}

export function subscribeArchivedHabits(userId: string, cb: (habits: Habit[]) => void) {
  const q = query(
    collection(db, 'habits'),
    where('userId', '==', userId),
    where('archived', '==', true)
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Habit))
  })
}

// ─── Completions ─────────────────────────────────────────────────

export function subscribeCompletions(
  userId: string,
  startDate: string,
  cb: (completions: Completion[]) => void
) {
  const q = query(
    collection(db, 'completions'),
    where('userId', '==', userId),
    where('date', '>=', startDate)
  )
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Completion))
  })
}

export async function getUserCompletions(userId: string, startDate: string): Promise<Completion[]> {
  const q = query(
    collection(db, 'completions'),
    where('userId', '==', userId),
    where('date', '>=', startDate)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Completion)
}

export async function toggleCompletion(
  userId: string,
  habitId: string,
  date: string,
  existingId?: string
): Promise<'added' | 'removed'> {
  if (existingId) {
    await deleteDoc(doc(db, 'completions', existingId))
    return 'removed'
  } else {
    await addDoc(collection(db, 'completions'), {
      userId,
      habitId,
      date,
      completedAt: new Date().toISOString(),
    })
    return 'added'
  }
}

// ─── Stats ────────────────────────────────────────────────────────

export function calculateCurrentStreak(
  completions: Completion[],
  habits: Habit[]
): number {
  if (habits.length === 0) return 0

  const today = format(new Date(), 'yyyy-MM-dd')
  const completionsByDate = new Map<string, Set<string>>()

  for (const c of completions) {
    if (!completionsByDate.has(c.date)) {
      completionsByDate.set(c.date, new Set())
    }
    completionsByDate.get(c.date)!.add(c.habitId)
  }

  let streak = 0
  const current = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(current)
    d.setDate(d.getDate() - i)
    const dateStr = format(d, 'yyyy-MM-dd')

    const dayHabits = habits.filter(h => isHabitScheduledForDate(h, d))
    if (dayHabits.length === 0) continue

    const completedIds = completionsByDate.get(dateStr) || new Set()
    const allDone = dayHabits.every(h => completedIds.has(h.id))

    if (allDone) {
      streak++
    } else if (dateStr !== today) {
      break
    }
  }

  return streak
}

export function isHabitScheduledForDate(habit: Habit, date: Date): boolean {
  const { schedule } = habit
  switch (schedule.type) {
    case 'daily':
      return true
    case 'weekly':
    case 'specific_days':
      return schedule.days.includes(date.getDay())
    case 'monthly':
      return schedule.dates.includes(date.getDate())
    case 'times_per_week':
      return true // simplified: show every day, user completes N times
    default:
      return true
  }
}

export async function updateUserStats(userId: string, stats: {
  currentStreak: number
  longestStreak: number
  totalCompletions: number
}) {
  await updateDoc(doc(db, 'users', userId), stats)
}

// ─── CSV Export/Import ────────────────────────────────────────────

export function exportToCSV(habits: Habit[], completions: Completion[]): string {
  const rows: string[] = ['date,habit_name,habit_emoji,completed']
  const habitMap = new Map(habits.map(h => [h.id, h]))

  for (const c of completions) {
    const h = habitMap.get(c.habitId)
    if (h) {
      rows.push(`${c.date},"${h.name}","${h.emoji}",true`)
    }
  }

  return rows.join('\n')
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromCSV(
  userId: string,
  csvContent: string,
  existingHabits: Habit[]
): Promise<{ imported: number; skipped: number }> {
  const lines = csvContent.trim().split('\n').slice(1) // skip header
  const batch = writeBatch(db)
  let imported = 0
  let skipped = 0

  const habitMap = new Map(existingHabits.map(h => [h.name.toLowerCase(), h]))

  for (const line of lines) {
    const parts = line.split(',')
    if (parts.length < 3) { skipped++; continue }
    const [date, rawName] = parts
    const name = rawName.replace(/"/g, '').trim()

    let habit = habitMap.get(name.toLowerCase())
    if (!habit) { skipped++; continue }

    const ref = doc(collection(db, 'completions'))
    batch.set(ref, {
      userId,
      habitId: habit.id,
      date: date.trim(),
      completedAt: new Date().toISOString(),
    })
    imported++
  }

  await batch.commit()
  return { imported, skipped }
}
