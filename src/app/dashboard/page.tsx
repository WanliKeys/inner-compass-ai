'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DailyRecordForm } from '@/components/daily/DailyRecordForm'
import { RecordHistory } from '@/components/daily/RecordHistory'
import { Button } from '@/components/ui/Button'
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

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ai' | 'achievements'>('overview')
  const [refreshHistory, setRefreshHistory] = useState(0)

  // 监听用户状态变化，如果用户登出则跳转到首页
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
  }, [user, router])

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 今日记录状态 */}
        <div className="mb-8">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                      开始今日记录
                    </h3>
                    <p className="text-blue-600 dark:text-blue-300">
                      记录今天的成长和收获
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowRecordForm(true)}>
                  开始记录
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标签内容 */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">平均心情</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">0.0</p>
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
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">0.0</p>
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
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">0.0</p>
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
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 欢迎信息 */}
            <Card>
              <CardHeader>
                <CardTitle>🎉 欢迎使用 Inner Compass AI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    您已经成功注册并登录！现在可以开始您的个人成长之旅：
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📝 开始记录</h4>
                      <p className="text-blue-600 dark:text-blue-300 text-sm">
                        点击&quot;开始记录&quot;按钮，记录您今天的情绪、精力和成就
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🎯 设定目标</h4>
                      <p className="text-green-600 dark:text-green-300 text-sm">
                        制定个人成长目标，让AI帮助您制定达成计划
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 历史记录 */}
            <RecordHistory key={refreshHistory} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">数据分析</h3>
              <p className="text-gray-500 mb-6">记录更多数据后，这里将显示您的成长分析</p>
            </div>
            
            {/* 也在分析页显示历史记录 */}
            <RecordHistory key={refreshHistory} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">AI助手</h3>
            <p className="text-gray-500 mb-4">积累更多记录后，AI将为您提供个性化建议</p>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">成就系统</h3>
            <p className="text-gray-500 mb-4">开始记录来解锁您的第一个成就！</p>
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