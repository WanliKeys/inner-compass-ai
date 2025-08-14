'use client'

import { useEffect, useState } from 'react'
import { PointsHistoryService, PointsHistoryItem } from '@/lib/services/pointsHistoryService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function PointsHistoryList({ userId }: { userId: string }) {
  const [items, setItems] = useState<PointsHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      // 看门狗：10s 未返回则提示超时
      let timeoutId: any
      try {
        timeoutId = setTimeout(() => {
          setError('加载超时，请稍后重试')
          setLoading(false)
        }, 10000)
        const list = await PointsHistoryService.list(userId, 50)
        clearTimeout(timeoutId)
        setItems(list)
      } catch (e: any) {
        clearTimeout(timeoutId)
        setError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>积分历史（最近50条）</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-gray-500">加载中...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">暂无积分记录</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map(item => (
              <li key={item.id} className="py-2 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{formatSource(item.source)}</span>
                  {item.note ? <span className="ml-2 text-gray-500">{item.note}</span> : null}
                  <span className="ml-3 text-xs text-gray-400">{formatTime(item.created_at)}</span>
                </div>
                <div className={`text-sm font-semibold ${item.points_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.points_delta >= 0 ? '+' : ''}{item.points_delta}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function formatSource(source: PointsHistoryItem['source']): string {
  switch (source) {
    case 'checkin': return '签到'
    case 'record': return '每日记录'
    case 'manual': return '调整'
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}


