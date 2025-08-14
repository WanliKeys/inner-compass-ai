'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DailyRecord } from '@/types'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { CheckinService } from '@/lib/services/checkinService'

interface DayCell {
  date: string
  hasRecord: boolean
}

// 最近6周的 7x6 简易热力日历（周一至周日）
export function StreakCalendar() {
  const { user } = useAuth()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [checkinDates, setCheckinDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - 41) // 42天窗口
        const dateStr = (d: Date) => d.toISOString().split('T')[0]
        const list = await DailyRecordService.getRecordsByDateRange(
          user.id,
          dateStr(start),
          dateStr(end)
        )
        setRecords(list)

        const checkins = await CheckinService.getCheckinsByDateRange(
          user.id,
          dateStr(start),
          dateStr(end)
        )
        setCheckinDates(new Set(checkins.map(c => c.date)))
      } catch (e: any) {
        setError(e?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const cells: DayCell[] = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 41)
    const set = new Set(records.map(r => r.date))
    const arr: DayCell[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const ymd = cursor.toISOString().split('T')[0]
      const hasActivity = set.has(ymd) || checkinDates.has(ymd)
      arr.push({ date: ymd, hasRecord: hasActivity })
      cursor.setDate(cursor.getDate() + 1)
    }
    return arr
  }, [records, checkinDates])

  if (!user) return null

  return (
    <div>
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">连续记录热力图（最近6周）</div>
      {loading ? (
        <div className="h-16 flex items-center justify-center text-gray-400">加载中...</div>
      ) : error ? (
        <div className="h-16 flex items-center justify-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => (
            <div
              key={cell.date}
              title={cell.date}
              className={`h-4 rounded ${cell.hasRecord ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            />
          ))}
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">浅色=未记录，深绿=已记录</div>
    </div>
  )
}


