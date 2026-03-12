'use client'

import { useMemo, useState } from 'react'
import type { DayData } from '@/lib/types'
import { getHeatLevel, getHeatColor } from '@/lib/types'
import { getWeeksArray, getMonthLabels, formatDate } from '@/lib/utils'

interface HeatMapProps {
  data: DayData[]
  isDark?: boolean
  cellSize?: number
  gap?: number
  showLabels?: boolean
  accentColor?: string // override for individual habit heatmaps
}

interface TooltipState {
  x: number
  y: number
  day: DayData
}

export default function HeatMap({
  data,
  isDark = false,
  cellSize = 10,
  gap = 2,
  showLabels = true,
  accentColor,
}: HeatMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const weeks = useMemo(() => getWeeksArray(data), [data])
  const monthLabels = useMemo(() => getMonthLabels(data), [data])
  const dayLabels = ['', 'M', '', 'W', '', 'F', '']

  function getCellColor(day: DayData): string {
    if (!day.date) return 'transparent'
    if (day.totalCount === 0) return isDark ? 'rgba(122,178,178,0.07)' : 'rgba(8,131,149,0.07)'

    if (accentColor) {
      const alpha = day.ratio === 0 ? 0.08 : 0.15 + day.ratio * 0.85
      const hex = accentColor.replace('#', '')
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return `rgba(${r},${g},${b},${alpha})`
    }

    const level = getHeatLevel(day.ratio, day.totalCount > 0)
    return getHeatColor(level, isDark)
  }

  const totalWidth = weeks.length * (cellSize + gap) - gap
  const totalHeight = 7 * (cellSize + gap) - gap

  return (
    <div className="relative">
      {/* Month labels */}
      {showLabels && (
        <div
          className="relative mb-1"
          style={{ height: 14, width: totalWidth + 18 + gap, marginLeft: 18 + gap }}
        >
          {monthLabels.map(({ label, col }) => (
            <span
              key={`${label}-${col}`}
              className="absolute text-xs"
              style={{
                left: col * (cellSize + gap),
                top: 0,
                color: 'var(--text-muted)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-0" style={{ gap }}>
        {/* Day labels */}
        {showLabels && (
          <div
            className="flex flex-col"
            style={{ gap, marginRight: gap, width: 14 }}
          >
            {dayLabels.map((label, i) => (
              <div
                key={i}
                style={{
                  height: cellSize,
                  lineHeight: `${cellSize}px`,
                  fontSize: 9,
                  color: 'var(--text-muted)',
                  fontFamily: 'Outfit, sans-serif',
                  textAlign: 'right',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Heatmap grid */}
        <div className="flex" style={{ gap }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap }}>
              {week.map((day, di) => {
                const isToday = day.date === today
                const isEmpty = !day.date
                const color = getCellColor(day)

                return (
                  <div
                    key={di}
                    className="heat-cell relative"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: color,
                      borderRadius: Math.max(1, cellSize * 0.2),
                      outline: isToday ? '2px solid #088395' : 'none',
                      outlineOffset: '1px',
                      cursor: isEmpty ? 'default' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!day.date) return
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        day,
                      })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="px-3 py-2 rounded-xl text-xs whitespace-nowrap"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            <div className="font-medium">{formatDate(tooltip.day.date)}</div>
            {tooltip.day.totalCount > 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>
                {tooltip.day.completedCount}/{tooltip.day.totalCount} tasks
                {' '}
                <span className="gradient-text font-semibold">
                  {Math.round(tooltip.day.ratio * 100)}%
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No tasks scheduled</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
