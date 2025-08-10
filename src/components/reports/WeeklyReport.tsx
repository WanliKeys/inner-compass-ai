'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RefreshCw, FileText, Copy, Image } from 'lucide-react'
import { ShareableImage } from './ShareableImage'

export function WeeklyReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState('')

  const generate = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch('/api/reports/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await res.json()
      if (res.ok) setReport(data.report || '')
      else setReport('暂无法生成周报。')
    } catch {
      setReport('生成周报失败，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report)
      tip('已复制到剪贴板')
    } catch {}
  }

  const downloadMd = () => {
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'weekly-report.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tip = (text: string) => {
    const el = document.createElement('div')
    el.textContent = text
    el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded bg-blue-600 text-white shadow-lg'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1600)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI 周报（基础版）</CardTitle>
          <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
            {loading ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin"/> 生成中...</>) : (<><RefreshCw className="w-4 h-4 mr-2"/> 重新生成</>)}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {report ? (
          <div className="space-y-3">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">{report}</pre>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyReport}><Copy className="w-4 h-4 mr-1"/> 复制</Button>
              <Button size="sm" onClick={downloadMd}><FileText className="w-4 h-4 mr-1"/> 下载Markdown</Button>
            </div>
            <div className="pt-2">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2"><Image className="w-4 h-4"/> 生成分享海报</div>
              <ShareableImage title="本周周报" content={report} />
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">暂无周报</div>
        )}
      </CardContent>
    </Card>
  )
}


