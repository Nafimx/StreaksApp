'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import type { UserProfile } from '@/lib/types'
import { getAllUsers, addFriend, removeFriend } from '@/lib/firestore'
import toast from 'react-hot-toast'

interface Props {
  user: UserProfile
  currentStreak: number
}

interface LeaderEntry extends UserProfile {
  rank: number
}

export default function LeaderboardView({ user, currentStreak }: Props) {
  const [users, setUsers] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'friends'>('all')
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const all = await getAllUsers()
      const sorted = all
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .map((u, i) => ({ ...u, rank: i + 1 }))
      setUsers(sorted)
    } catch {
      toast.error('Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddFriend(uid: string) {
    setAdding(uid)
    try {
      await addFriend(user.uid, uid)
      toast.success('Friend added!')
      loadUsers()
    } catch {
      toast.error('Failed to add friend')
    } finally {
      setAdding(null)
    }
  }

  async function handleRemoveFriend(uid: string) {
    setAdding(uid)
    try {
      await removeFriend(user.uid, uid)
      toast.success('Removed from friends')
      loadUsers()
    } catch {
      toast.error('Failed to remove friend')
    } finally {
      setAdding(null)
    }
  }

  const myFriends = new Set(user.friends || [])

  const filtered = users.filter(u => {
    if (filter === 'friends' && u.uid !== user.uid && !myFriends.has(u.uid)) return false
    if (search && !u.displayName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const myEntry = users.find(u => u.uid === user.uid)

  return (
    <div className="page-content px-4">
      {/* Header */}
      <div className="py-5">
        <h1
          className="text-2xl font-display font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          Leaderboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {filter === 'friends' ? 'Your circle' : 'Everyone on Streaks'}
        </p>
      </div>

      {/* My rank banner */}
      {myEntry && (
        <div
          className="card p-4 mb-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(8,131,149,0.12), rgba(9,99,126,0.08))',
            borderColor: 'rgba(8,131,149,0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-2xl"
              style={{ background: 'rgba(8,131,149,0.2)', color: '#088395' }}
            >
              #{myEntry.rank}
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                Your rank
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {currentStreak} day streak • {user.totalCompletions} total completions
              </p>
            </div>
            <div className="text-2xl font-display font-bold streak-shimmer">
              {currentStreak}🔥
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="flex gap-2 mb-3">
        {(['all', 'friends'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
            style={{
              background: filter === f ? '#088395' : 'var(--input-bg)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {f === 'all' ? 'Everyone' : 'Friends'}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          className="input w-full px-4 py-3 text-sm"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Leaderboard list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="skeleton w-8 h-8 rounded-full" />
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1">
                <div className="skeleton w-32 h-4 rounded mb-2" />
                <div className="skeleton w-20 h-3 rounded" />
              </div>
              <div className="skeleton w-12 h-8 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👥</div>
          <p style={{ color: 'var(--text-secondary)' }}>No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => {
            const isMe = entry.uid === user.uid
            const isFriend = myFriends.has(entry.uid)
            const isAdding = adding === entry.uid

            const medalEmoji =
              entry.rank === 1 ? '🥇' :
              entry.rank === 2 ? '🥈' :
              entry.rank === 3 ? '🥉' : null

            return (
              <div
                key={entry.uid}
                className="card p-3 flex items-center gap-3"
                style={{
                  background: isMe ? 'rgba(8,131,149,0.06)' : 'var(--card)',
                  borderColor: isMe ? 'rgba(8,131,149,0.25)' : 'var(--border)',
                  animationDelay: `${i * 40}ms`,
                }}
              >
                {/* Rank */}
                <div
                  className="w-8 text-center font-display font-bold text-sm flex-shrink-0"
                  style={{ color: entry.rank <= 3 ? '#088395' : 'var(--text-muted)' }}
                >
                  {medalEmoji || `#${entry.rank}`}
                </div>

                {/* Avatar */}
                {entry.photoURL ? (
                  <Image
                    src={entry.photoURL}
                    alt={entry.displayName}
                    width={40}
                    height={40}
                    className="rounded-full flex-shrink-0"
                    style={{ border: '2px solid var(--border)' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #088395, #09637E)',
                      color: '#fff',
                    }}
                  >
                    {entry.displayName[0]?.toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="font-medium text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.displayName}
                    </p>
                    {isMe && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(8,131,149,0.15)', color: '#088395' }}
                      >
                        You
                      </span>
                    )}
                    {isFriend && !isMe && (
                      <span className="text-xs flex-shrink-0">👥</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {entry.totalCompletions} completions
                  </p>
                </div>

                {/* Streak */}
                <div className="text-right flex-shrink-0">
                  <div
                    className="font-display font-bold text-lg"
                    style={{ color: entry.currentStreak > 0 ? '#088395' : 'var(--text-muted)' }}
                  >
                    {entry.currentStreak}🔥
                  </div>
                </div>

                {/* Add/Remove friend */}
                {!isMe && (
                  <button
                    onClick={() => isFriend ? handleRemoveFriend(entry.uid) : handleAddFriend(entry.uid)}
                    disabled={isAdding}
                    className="ml-1 w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all"
                    style={{
                      background: isFriend ? 'rgba(224,123,57,0.1)' : 'rgba(8,131,149,0.1)',
                    }}
                    title={isFriend ? 'Remove friend' : 'Add friend'}
                  >
                    {isAdding ? '…' : isFriend ? '✕' : '+'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Refresh */}
      <button
        onClick={loadUsers}
        className="w-full mt-4 py-3 rounded-2xl text-sm font-medium transition-all"
        style={{
          background: 'var(--input-bg)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        ↻ Refresh leaderboard
      </button>
    </div>
  )
}
