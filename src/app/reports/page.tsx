'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { WeeklyReport } from '@/components/reports/WeeklyReport'
import { ShareableImage } from '@/components/reports/ShareableImage'
import { Button } from '@/components/ui/Button'

export default function ReportsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.push('/')
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">报告</h1>
          
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>AI 周报</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyReport />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>分享图片</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareableImage />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


