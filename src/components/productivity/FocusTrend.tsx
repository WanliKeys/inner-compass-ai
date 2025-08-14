'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FocusService } from '@/lib/services/focusService'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'

export function FocusTrend() {
  const { user } = useAuth()
  const [days, setDays] = useState<7 | 30>(7)
  const [data, setData] = useState<{ date: string; minutes: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      try {
        const list = await FocusService.getFocusMinutesByRange(user.id, days)
        setData(list)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, days])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>专注趋势（分钟）</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={days===7 ? 'secondary' : 'outline'} onClick={()=>setDays(7)}>7天</Button>
            <Button size="sm" variant={days===30 ? 'secondary' : 'outline'} onClick={()=>setDays(30)}>30天</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-500">加载中...</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={Math.ceil(data.length/7)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


