'use client'

export type Tab = 'home' | 'streaks' | 'leaderboard' | 'settings'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
  todayProgress: number // 0-1
}

const tabs: {
  id: Tab
  label: string
  icon: (active: boolean, progress?: number) => React.ReactNode
}[] = [
  {
    id: 'home',
    label: 'Today',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          fill={active ? '#088395' : 'none'}
          stroke={active ? '#088395' : 'currentColor'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'streaks',
    label: 'Streaks',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="14" width="3" height="7" rx="1" fill={active ? '#088395' : 'none'} stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" />
        <rect x="7" y="10" width="3" height="11" rx="1" fill={active ? '#088395' : 'none'} stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" />
        <rect x="12" y="5" width="3" height="16" rx="1" fill={active ? '#088395' : 'none'} stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" />
        <rect x="17" y="9" width="3" height="12" rx="1" fill={active ? '#088395' : 'none'} stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: 'leaderboard',
    label: 'Circle',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" fill={active ? '#088395' : 'none'} stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" />
        <circle cx="17" cy="10" r="2.5" fill={active ? '#088395' : 'none'} stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" />
        <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 16c1.8 0.2 3.5 1 4 3" stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" fill={active ? '#088395' : 'none'} stroke={active ? '#088395' : 'currentColor'} strokeWidth="1.8" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke={active ? '#088395' : 'currentColor'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export default function TabBar({ active, onChange, todayProgress }: Props) {
  return (
    <div
      className="tab-bar fixed bottom-0 left-0 right-0 z-40 safe-bottom"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1 max-w-lg mx-auto">
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all duration-200 relative"
              style={{
                color: isActive ? '#088395' : 'var(--text-muted)',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute top-1 w-6 h-0.5 rounded-full"
                  style={{ background: '#088395' }}
                />
              )}

              {/* Progress ring for home tab */}
              {tab.id === 'home' && todayProgress > 0 && !isActive && (
                <div className="relative">
                  <svg
                    className="absolute -inset-1"
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                    style={{ top: -4, left: -4 }}
                  >
                    <circle
                      cx="15" cy="15" r="13"
                      fill="none"
                      stroke="rgba(8,131,149,0.15)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="15" cy="15" r="13"
                      fill="none"
                      stroke="#088395"
                      strokeWidth="2"
                      strokeDasharray={`${todayProgress * 81.68} 81.68`}
                      strokeLinecap="round"
                      transform="rotate(-90 15 15)"
                    />
                  </svg>
                  {tab.icon(isActive)}
                </div>
              )}

              {!(tab.id === 'home' && todayProgress > 0 && !isActive) && tab.icon(isActive)}

              <span
                className="text-xs font-medium"
                style={{ fontSize: 10 }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
