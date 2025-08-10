'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function PreferencesPanel() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [theme, setTheme] = useState<'system'|'light'|'dark'>('system')

  useEffect(() => {
    try {
      const rm = localStorage.getItem('motion:reduced') === 'true'
      setReducedMotion(rm)
      const savedTheme = (localStorage.getItem('theme:mode') as any) || 'system'
      setTheme(savedTheme)
      applyTheme(savedTheme)
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
        <div className="pt-2">
          <Button onClick={save}>保存设置</Button>
        </div>
      </CardContent>
    </Card>
  )
}


