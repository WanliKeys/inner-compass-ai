'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function PreferencesPanel() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [theme, setTheme] = useState<'system'|'light'|'dark'>('system')
  // 记录相关偏好
  const [autoOpenRecord, setAutoOpenRecord] = useState(false)
  const [reminderTime, setReminderTime] = useState<string>('20:00')
  const [dndStart, setDndStart] = useState<string>('22:00')
  const [dndEnd, setDndEnd] = useState<string>('08:00')
  const [oncePerDay, setOncePerDay] = useState<boolean>(true)

  useEffect(() => {
    try {
      const rm = localStorage.getItem('motion:reduced') === 'true'
      setReducedMotion(rm)
      const savedTheme = (localStorage.getItem('theme:mode') as any) || 'system'
      setTheme(savedTheme)
      applyTheme(savedTheme)
      // 记录相关偏好
      const aor = localStorage.getItem('record:autoOpen')
      setAutoOpenRecord(aor === 'true')
      const rt = localStorage.getItem('record:reminderTime') || '20:00'
      setReminderTime(rt)
      const ds = localStorage.getItem('record:dndStart') || '22:00'
      const de = localStorage.getItem('record:dndEnd') || '08:00'
      setDndStart(ds)
      setDndEnd(de)
      const opd = localStorage.getItem('record:oncePerDay')
      setOncePerDay(opd !== 'false')
    } catch {}
  }, [])

  const applyTheme = (mode: 'system'|'light'|'dark') => {
    const html = document.documentElement
    if (mode === 'system') {
      html.removeAttribute('data-theme')
    } else {
      html.setAttribute('data-theme', mode)
    }
  }

  const save = () => {
    try {
      localStorage.setItem('motion:reduced', String(reducedMotion))
      localStorage.setItem('theme:mode', theme)
      applyTheme(theme)
      // 保存记录相关偏好
      localStorage.setItem('record:autoOpen', String(autoOpenRecord))
      localStorage.setItem('record:reminderTime', reminderTime)
      localStorage.setItem('record:dndStart', dndStart)
      localStorage.setItem('record:dndEnd', dndEnd)
      localStorage.setItem('record:oncePerDay', String(oncePerDay))
      const tip = document.createElement('div')
      tip.textContent = '偏好已保存'
      tip.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded bg-gray-800 text-white shadow-lg'
      document.body.appendChild(tip)
      setTimeout(() => tip.remove(), 1600)
    } catch {}
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>个性化偏好</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <div className="font-medium mb-2">动效强度</div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} />
            减少动效（减少礼花粒子与过渡）
          </label>
        </div>
        <div>
          <div className="font-medium mb-2">主题</div>
          <select value={theme} onChange={e => setTheme(e.target.value as any)} className="px-3 py-2 border rounded bg-white dark:bg-gray-800">
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </div>
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700" />
        <div>
          <div className="font-medium mb-2">记录偏好</div>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" checked={autoOpenRecord} onChange={e => setAutoOpenRecord(e.target.checked)} />
            登录后自动打开记录（仅今天未记录时）
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block mb-1">每日提醒时间</span>
              <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} className="px-3 py-2 border rounded bg-white dark:bg-gray-800 w-full" />
            </label>
            <label className="text-sm">
              <span className="block mb-1">免打扰开始</span>
              <input type="time" value={dndStart} onChange={e => setDndStart(e.target.value)} className="px-3 py-2 border rounded bg-white dark:bg-gray-800 w-full" />
            </label>
            <label className="text-sm">
              <span className="block mb-1">免打扰结束</span>
              <input type="time" value={dndEnd} onChange={e => setDndEnd(e.target.value)} className="px-3 py-2 border rounded bg-white dark:bg-gray-800 w-full" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm mt-2">
            <input type="checkbox" checked={oncePerDay} onChange={e => setOncePerDay(e.target.checked)} />
            限制每天只自动弹一次
          </label>
        </div>
        <div className="pt-2">
          <Button onClick={save}>保存设置</Button>
        </div>
      </CardContent>
    </Card>
  )
}


