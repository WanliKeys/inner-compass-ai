'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DailyRecordForm } from '@/components/daily/DailyRecordForm'
import { RecordHistory } from '@/components/daily/RecordHistory'
import { AIInsights } from '@/components/ai/AIInsights'
import { AIPlan } from '@/components/ai/AIPlan'
import { GamificationPanel } from '@/components/gamification/GamificationPanel'
import { Button } from '@/components/ui/Button'
import { WeeklyReport } from '@/components/reports/WeeklyReport'
import { ShareableImage } from '@/components/reports/ShareableImage'
import { FocusTrend } from '@/components/productivity/FocusTrend'
import { PreferencesPanel } from '@/components/settings/PreferencesPanel'
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Award,
  Activity,
  Heart,
  Zap,
  BarChart3,
  LogOut,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { calculateStreak, getDateString } from '@/lib/utils'
import { fireConfetti } from '@/lib/celebrate'
import { FocusService } from '@/lib/services/focusService'
import { CheckinService } from '@/lib/services/checkinService'
import type { DailyRecord } from '@/types'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ai' | 'achievements' | 'reports' | 'settings'>('overview')
  const [signingOut, setSigningOut] = useState(false)
  const [refreshHistory, setRefreshHistory] = useState(0)
  const [overviewStats, setOverviewStats] = useState({
    averageMood: 0,
    averageEnergy: 0,
    averageProductivity: 0,
    totalGoalsCompleted: 0
  })
  const [shouldWarnStreak, setShouldWarnStreak] = useState(false)
  const [hasTodayRecord, setHasTodayRecord] = useState<boolean>(false)
  const [checkedInToday, setCheckedInToday] = useState<boolean | null>(null)
  const [recentOverviewRecords, setRecentOverviewRecords] = useState<DailyRecord[]>([])
  const [todayFocusMinutes, setTodayFocusMinutes] = useState<number>(0)

  // 监听用户状态变化，如果用户登出则跳转到首页
  useEffect(() => {
    if (!user) {
      // 退出后强制回首页
      router.replace('/')
      // 二次保险，避免路由缓存
      const id = setTimeout(() => { try { if (window.location.pathname !== '/') window.location.href = '/' } catch {} }, 50)
      return () => clearTimeout(id)
    }
  }, [user, router])

  // 进入面板时，如今天没有记录，自动打开记录表单（仅在已登录时）
  useEffect(() => {
    const checkTodayRecord = async () => {
      if (!user) return
      try {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const record = await DailyRecordService.getRecordByDate(user.id, todayStr)

        // 读取偏好
        const autoOpen = localStorage.getItem('record:autoOpen') === 'true'
        const oncePerDay = localStorage.getItem('record:oncePerDay') !== 'false'
        const reminderTime = localStorage.getItem('record:reminderTime') || '20:00'
        const dndStart = localStorage.getItem('record:dndStart') || '22:00'
        const dndEnd = localStorage.getItem('record:dndEnd') || '08:00'
        const snoozeUntil = localStorage.getItem('record:snoozeUntil')

        if (record) {
          setHasTodayRecord(true)
          return
        } else {
          setHasTodayRecord(false)
        }

        // 频控：当天是否已经弹过
        if (oncePerDay) {
          const shownAt = localStorage.getItem('record:autoShownAt')
          if (shownAt === todayStr) return
        }

        // 免打扰
        if (isInDnd(new Date(), dndStart, dndEnd)) return

        // 接近提醒时间窗口（±30分钟）
        const nearReminder = isNearReminder(new Date(), reminderTime, 30)

        // 若用户主动开启自动打开 或 接近提醒时间，则弹
        if (autoOpen || nearReminder) {
          // 若存在“稍后提醒”snooze，则在未到期前不弹
          if (snoozeUntil && Date.now() < Number(snoozeUntil)) return
          setShowRecordForm(true)
          try { localStorage.setItem('record:autoShownAt', todayStr) } catch {}
        }
      } catch (err) {
        // 忽略错误，不打断首屏体验
      }
    }
    checkTodayRecord()
  }, [user])

  // 查询今日是否已签到（用于首屏状态条）
  useEffect(() => {
    const loadCheckin = async () => {
      if (!user) return
      try {
        const ok = await CheckinService.hasCheckedInToday(user.id)
        setCheckedInToday(ok)
      } catch {
        setCheckedInToday(null)
      }
    }
    loadCheckin()
  }, [user, refreshHistory])

  // 概览：今日专注累计
  useEffect(() => {
    const loadFocus = async () => {
      if (!user) return
      try {
        const minutes = await FocusService.getTodayTotalMinutes(user.id)
        setTodayFocusMinutes(minutes)
      } catch {}
    }
    loadFocus()
  }, [user, refreshHistory])

  function isInDnd(now: Date, startHHMM: string, endHHMM: string): boolean {
    const [sh, sm] = startHHMM.split(':').map(Number)
    const [eh, em] = endHHMM.split(':').map(Number)
    const start = new Date(now)
    start.setHours(sh || 0, sm || 0, 0, 0)
    const end = new Date(now)
    end.setHours(eh || 0, em || 0, 0, 0)
    if (start <= end) {
      return now >= start && now <= end
    } else {
      // 跨天，如 22:00-08:00
      return now >= start || now <= end
    }
  }

  function isNearReminder(now: Date, hhmm: string, windowMinutes: number): boolean {
    const [h, m] = hhmm.split(':').map(Number)
    const target = new Date(now)
    target.setHours(h || 0, m || 0, 0, 0)
    const diff = Math.abs(now.getTime() - target.getTime()) / (60 * 1000)
    return diff <= windowMinutes
  }

  // 登录后 Dashboard 首次渲染时，如存在待展示的签到积分提示，则展示礼花与气泡
  useEffect(() => {
    if (!user) return
    try {
      const val = localStorage.getItem('checkin:pendingPoints')
      if (val) {
        const points = parseInt(val) || 2
        // 放礼花
        fireConfetti({ particleCount: 80, spread: 80, origin: { x: 0.5, y: 0.3 } })
        // 简易气泡
        const toast = document.createElement('div')
        toast.textContent = `签到成功！+${points} 积分`
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded bg-blue-600 text-white shadow-lg'
        document.body.appendChild(toast)
        setTimeout(() => toast.remove(), 2200)
        localStorage.removeItem('checkin:pendingPoints')
      }
    } catch {}
  }, [user])

  // 快捷键：按 R 打开记录表单
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault()
      setShowRecordForm(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])

  // 加载概览统计
  useEffect(() => {
    const loadOverview = async () => {
      if (!user) return
      try {
        const { records } = await DailyRecordService.getAnalyticsData(user.id, 30)
        if (records.length === 0) {
          setOverviewStats({ averageMood: 0, averageEnergy: 0, averageProductivity: 0, totalGoalsCompleted: 0 })
          return
        }
        const averageMood = records.reduce((s, r) => s + r.mood_score, 0) / records.length
        const averageEnergy = records.reduce((s, r) => s + r.energy_level, 0) / records.length
        const averageProductivity = records.reduce((s, r) => s + r.productivity_score, 0) / records.length
        const totalGoalsCompleted = records.reduce((s, r) => s + (r.goals_completed || 0), 0)
        setOverviewStats({ averageMood, averageEnergy, averageProductivity, totalGoalsCompleted })

        // 晚间断签提醒：若今天尚未记录且当前时间 >= 20:00
        const today = getDateString()
        const hasToday = records.some(r => r.date === today)
        const now = new Date()
        const isEvening = now.getHours() >= 20
        setShouldWarnStreak(isEvening && !hasToday)
      } catch (err) {
        console.error('Failed to load overview stats', err)
      }
    }
    loadOverview()
  }, [user, refreshHistory])

  // 概览：最近5条简版历史
  useEffect(() => {
    const loadRecent = async () => {
      if (!user) return
      try {
        const list = await DailyRecordService.getRecentRecords(user.id, 5)
        setRecentOverviewRecords(list)
      } catch {}
    }
    loadRecent()
  }, [user, refreshHistory])

  const handleSignOut = async () => {
    try {
      console.log('[dashboard] handleSignOut clicked')
      setSigningOut(true)
      const t0 = performance.now()
      await signOut()
      const t1 = performance.now()
      console.log('[dashboard] signOut awaited', Math.round(t1 - t0), 'ms; navigating to /')
      // 强制刷新，避免路由缓存残留
      router.replace('/')
      setTimeout(() => { try { window.location.href = '/' } catch {} }, 50)
    } catch (error) {
      console.error('[dashboard] Sign out error:', error)
      router.replace('/')
    } finally {
      setSigningOut(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                欢迎回来，{profile?.full_name || user.email || '用户'}！
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                今天是记录成长的好日子
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">连续天数</div>
                <div className="text-2xl font-bold text-primary-600">{profile?.streak_count || 0}天</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">等级</div>
                <div className="text-2xl font-bold text-secondary-600">Lv.{profile?.level || 1}</div>
              </div>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                disabled={signingOut}
                title="退出登录"
              >
                <LogOut className={`w-5 h-5 ${signingOut ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* 标签导航 */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { key: 'overview', name: '概览', icon: BarChart3 },
                { key: 'analytics', name: '分析', icon: TrendingUp },
                { key: 'reports', name: '报告', icon: FileText },
                { key: 'achievements', name: '成就', icon: Award },
                { key: 'ai', name: 'AI助手', icon: Target },
                { key: 'settings', name: '设置', icon: SettingsIcon },
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`${
                      activeTab === tab.key
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 快速操作区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                今日记录
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                记录您的成长和收获
              </p>
            </div>
          </div>
          <Button onClick={() => setShowRecordForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="w-4 h-4 mr-2" />
            开始记录
          </Button>
        </div>
        {shouldWarnStreak && (
          <div className="mt-3 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 flex items-center justify-between">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
            今天还没有记录，可能会断签。现在补记，保持连续！
            </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowRecordForm(true)}>现在补记</Button>
            <Button size="sm" variant="ghost" onClick={() => {
              // 稍后提醒：本地延后30分钟
              try { localStorage.setItem('record:snoozeUntil', String(Date.now() + 30 * 60 * 1000)) } catch {}
            }}>稍后提醒</Button>
          </div>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 今日状态条 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">今日记录</div>
              <div className={`text-sm font-semibold ${hasTodayRecord ? 'text-green-600' : 'text-yellow-600'}`}>
                {hasTodayRecord ? '已完成' : '未完成'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">今日签到</div>
              <div className={`text-sm font-semibold ${checkedInToday ? 'text-green-600' : 'text-gray-500'}`}>
                {checkedInToday ? '已签到' : '未签到'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">积分/等级/连续</div>
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {(profile?.total_points ?? 0)} / Lv.{profile?.level ?? 1} / {(profile?.streak_count ?? 0)}天
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">今日专注</div>
              <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {todayFocusMinutes} 分钟
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标签内容 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 晚间断签提醒条 */}
            <EveningStreakWarning />
            {/* 统计卡片 */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">数据概览</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">您的个人成长数据统计</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">平均心情</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewStats.averageMood.toFixed(1)}</p>
                      </div>
                      <Heart className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">平均精力</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewStats.averageEnergy.toFixed(1)}</p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">平均生产力</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewStats.averageProductivity.toFixed(1)}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">完成目标</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewStats.totalGoalsCompleted}</p>
                      </div>
                      <Target className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 最近历史（简版，最多5条） */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">最近历史</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">最近5条记录概览</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setActiveTab('analytics')}>查看全部历史</Button>
              </div>
              <div className="space-y-3">
                {recentOverviewRecords.length === 0 ? (
                  <div className="text-sm text-gray-500">暂无记录</div>
                ) : (
                  recentOverviewRecords.map(r => (
                    <Card key={r.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <div className="font-medium">{new Date(r.date).toLocaleDateString('zh-CN')}</div>
                          <div className="mt-1 opacity-80">心情 {r.mood_score}/10 · 精力 {r.energy_level}/10 · 生产力 {r.productivity_score}/10 · 目标 {r.goals_completed || 0}</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setActiveTab('analytics')}>详情</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">智能分析</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">让AI帮您分析成长数据，发现行为模式</p>
              </div>
              <AIInsights />
            </div>
            
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">历史数据</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">用于分析的原始记录数据</p>
              </div>
              <RecordHistory key={refreshHistory} />
            </div>

            <FocusTrend />

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-medium">需要更系统的报告？</div>
                  <div className="text-sm text-gray-500 mt-1">前往报告中心生成并分享周报</div>
                </div>
                <Button onClick={() => router.push('/reports')}>前往报告</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-8">
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI智能助手</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">获取个性化建议和成长计划</p>
              </div>
              <AIPlan />
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">成就系统</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">追踪您的成长里程碑，解锁各种称号</p>
            </div>
            <GamificationPanel />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>AI 周报</CardTitle>
              </CardHeader>
              <CardContent>
                <WeeklyReport />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle>个性化偏好</CardTitle>
              </CardHeader>
              <CardContent>
                <PreferencesPanel />
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* 记录表单模态框 */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">每日记录</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowRecordForm(false)}
                >
                  关闭
                </Button>
              </div>
              <DailyRecordForm onSubmit={() => {
                setShowRecordForm(false)
                // 触发历史记录刷新
                setRefreshHistory(prev => prev + 1)
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 轻组件：晚间断签提醒（已直接集成在上方，不单独导出）
function EveningStreakWarning() {
  return null
}