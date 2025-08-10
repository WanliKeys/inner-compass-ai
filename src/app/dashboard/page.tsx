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
import { ReminderSettings } from '@/components/notifications/ReminderSettings'
import { WeeklyReport } from '@/components/reports/WeeklyReport'
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
  LogOut
} from 'lucide-react'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { calculateStreak, getDateString } from '@/lib/utils'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ai' | 'achievements'>('overview')
  const [refreshHistory, setRefreshHistory] = useState(0)
  const [overviewStats, setOverviewStats] = useState({
    averageMood: 0,
    averageEnergy: 0,
    averageProductivity: 0,
    totalGoalsCompleted: 0
  })
  const [shouldWarnStreak, setShouldWarnStreak] = useState(false)

  // 监听用户状态变化，如果用户登出则跳转到首页
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
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
        if (!record) {
          setShowRecordForm(true)
        }
      } catch (err) {
        // 忽略错误，不打断首屏体验
      }
    }
    checkTodayRecord()
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

  const handleSignOut = async () => {
    try {
      await signOut()
      // 登出成功后立即跳转
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      // 即使出错也强制跳转
      router.push('/')
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
                title="退出登录"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* 标签导航 */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { key: 'overview', name: '概览', icon: BarChart3 },
                { key: 'analytics', name: '分析', icon: TrendingUp },
                { key: 'ai', name: 'AI助手', icon: Target },
                { key: 'achievements', name: '成就', icon: Award },
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
            <Button size="sm" variant="outline" onClick={() => setShowRecordForm(true)}>现在补记</Button>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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

            {/* 历史记录 */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">记录历史</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">您的所有成长记录</p>
              </div>
              <RecordHistory key={refreshHistory} />
            </div>

            {/* 提醒设置 */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">提醒设置</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">设置每日固定时间提醒你记录或回顾</p>
              </div>
              <ReminderSettings />
            </div>

            {/* 偏好设置 */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">个性化偏好</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">动效强度与主题偏好</p>
              </div>
              <PreferencesPanel />
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

            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI 周报</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">概览最近一周的关键指标与建议，可复制或下载</p>
              </div>
              <WeeklyReport />
            </div>
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