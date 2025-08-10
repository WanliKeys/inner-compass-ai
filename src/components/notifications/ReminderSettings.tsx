'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

export function ReminderSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [hour, setHour] = useState<string>('21')
  const [minute, setMinute] = useState<string>('30')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      const saved = localStorage.getItem('reminderTime')
      if (saved) {
        try {
          const { hour: h, minute: m } = JSON.parse(saved)
          setHour(h)
          setMinute(m)
        } catch {}
      }
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setPermission(perm)
  }

  const saveTime = () => {
    localStorage.setItem('reminderTime', JSON.stringify({ hour, minute }))
    // 轻提示
    const tip = document.createElement('div')
    tip.textContent = `已保存提醒时间：${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
    tip.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded bg-blue-600 text-white shadow-lg'
    document.body.appendChild(tip)
    setTimeout(() => tip.remove(), 2000)
  }

  // 简易本地“提醒”：打开页面时命中时间窗口则给出通知（非 Service Worker）
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const saved = localStorage.getItem('reminderTime')
        if (!saved) return
        const { hour: h, minute: m } = JSON.parse(saved)
        const now = new Date()
        if (String(now.getHours()) === String(h) && String(now.getMinutes()) === String(m)) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('到点记录一下今天吧', { body: '打开 Inner Compass AI 记录心情与收获。' })
          }
        }
      } catch {}
    }, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="font-semibold mb-2">提醒设置</div>
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        每日固定时间提醒你进行记录/回顾（浏览器本地通知）。
      </div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="number"
          min={0}
          max={23}
          value={hour}
          onChange={e => setHour(e.target.value)}
          className="w-20 px-2 py-1 border rounded"
        />
        <span>:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={minute}
          onChange={e => setMinute(e.target.value)}
          className="w-20 px-2 py-1 border rounded"
        />
        <Button size="sm" variant="outline" onClick={saveTime}>保存时间</Button>
      </div>
      <div>
        <Button size="sm" onClick={requestPermission} disabled={permission === 'granted'}>
          {permission === 'granted' ? '已授权通知' : '授权浏览器通知'}
        </Button>
      </div>
    </div>
  )
}


