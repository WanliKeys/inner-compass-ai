'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Target,
  RefreshCw,
  Lightbulb,
  CheckCircle,
  Clock
} from 'lucide-react'
import { fireConfetti } from '@/lib/celebrate'
import { PomodoroTimer } from '@/components/productivity/PomodoroTimer'
import { DailyRecordService } from '@/lib/services/dailyRecordService'

interface AIPlanProps {
  userId?: string
}

export function AIPlan({ userId }: AIPlanProps) {
  const { user } = useAuth()
  const [plan, setPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([])

  const currentUserId = userId || user?.id
  const todayKey = new Date().toISOString().split('T')[0]
  const storageKey = currentUserId ? `planTasks:${currentUserId}:${todayKey}` : ''

  useEffect(() => {
    if (currentUserId) {
      generatePlan()
    }
  }, [currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  const generatePlan = async () => {
    if (!currentUserId) return

    setGenerating(true)
    try {
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      })

      const result = await response.json()

      if (response.ok) {
        setPlan(result.plan)
        // 计划变更后，如本地无清单则从文本解析
        setTimeout(() => {
          if (!storageKey) return
          const persisted = localStorage.getItem(storageKey)
          if (persisted) {
            try {
              setTasks(JSON.parse(persisted))
              return
            } catch {}
          }
          const parsed = parseTasksFromPlan(result.plan)
          setTasks(parsed)
          localStorage.setItem(storageKey, JSON.stringify(parsed))
        }, 0)
      } else {
        console.error('Plan generation failed:', result.error)
        setPlan('暂时无法生成计划，请稍后再试。')
      }
    } catch (error) {
      console.error('Error generating plan:', error)
      setPlan('生成计划时出现错误，请稍后再试。')
    } finally {
      setGenerating(false)
    }
  }

  // 从计划文本提取任务清单（解析以 - 或 * 开头的行，以及“优先任务/活动安排/效率建议”下的条目）
  const parseTasksFromPlan = (planText: string) => {
    const lines = planText.split('\n')
    const items: string[] = []
    let inListBlock = false
    let currentSection = ''
    for (const raw of lines) {
      const line = raw.trim()
      if (line.startsWith('#')) {
        currentSection = line.replace(/^#+\s*/, '')
        inListBlock = /优先任务|活动安排|效率建议|注意事项/.test(currentSection)
        continue
      }
      if (/^[\-\*]\s+/.test(line)) {
        items.push(line.replace(/^[\-\*]\s+/, ''))
        continue
      }
      if (/^\d+\.\s+/.test(line)) {
        items.push(line.replace(/^\d+\.\s+/, ''))
        continue
      }
      if (inListBlock && line.length > 0) {
        // 某些AI输出可能无前缀，仍然作为任务收集
        items.push(line)
      }
    }
    const unique = Array.from(new Set(items)).filter(Boolean)
    return unique.map((text, i) => ({ id: `${todayKey}-${i}`, text, done: false }))
  }

  // 初次加载：如果本地已有清单，先还原
  useEffect(() => {
    if (!storageKey) return
    const persisted = localStorage.getItem(storageKey)
    if (persisted) {
      try {
        setTasks(JSON.parse(persisted))
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
      const allDone = next.length > 0 && next.every(t => t.done)
      if (allDone) {
        fireConfetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.3 } })
      }
      return next
    })
  }

  const resetTasks = () => {
    setTasks(prev => {
      const next = prev.map(t => ({ ...t, done: false }))
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }

  const completed = tasks.filter(t => t.done).length
  const total = tasks.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  const syncGoalsCompleted = async () => {
    if (!currentUserId) return
    try {
      const today = new Date().toISOString().split('T')[0]
      const record = await DailyRecordService.getRecordByDate(currentUserId, today)
      const goals = completed
      if (record) {
        await DailyRecordService.updateRecord(record.id, { goals_completed: goals })
      }
    } catch (e) {
      console.error('Sync goals_completed failed', e)
    }
  }

  const formatPlan = (planText: string) => {
    // 简单的文本格式化，将换行符转换为段落
    return planText.split('\n').map((line, index) => {
      if (line.trim() === '') return null
      
      // 检查是否是标题（以数字或#开头）
      if (line.match(/^\d+\./) || line.startsWith('#')) {
        return (
          <h4 key={index} className="font-semibold text-gray-900 dark:text-white mt-4 mb-2">
            {line.replace(/^#+\s*/, '')}
          </h4>
        )
      }
      
      // 检查是否是列表项（以-或*开头）
      if (line.match(/^[\-\*]\s/)) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              {line.replace(/^[\-\*]\s*/, '')}
            </span>
          </div>
        )
      }
      
      return (
        <p key={index} className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">
          {line}
        </p>
      )
    }).filter(Boolean)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            AI 个性化计划
          </CardTitle>
          <Button
            onClick={generatePlan}
            disabled={generating}
            variant="outline"
            size="sm"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                重新生成
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {generating ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                AI正在为您量身定制今日计划...
              </p>
            </div>
          </div>
        ) : plan ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                基于您的历史数据和目标生成的个性化计划
              </span>
            </div>

            {/* 今日清单 */}
            {total > 0 && (
              <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-green-700 dark:text-green-200">今日清单</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {completed}/{total} 完成
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <label key={task.id} className="flex items-start gap-2 p-2 rounded hover:bg-green-100/60 dark:hover:bg-green-900/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <span className={`text-sm ${task.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {task.text}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <Button variant="ghost" size="sm" onClick={resetTasks}>重置清单</Button>
                  <Button className="ml-2" variant="outline" size="sm" onClick={syncGoalsCompleted}>同步到今日目标完成数</Button>
                </div>
              </div>
            )}

            {/* 番茄钟 */}
            <PomodoroTimer />
            
            <div className="prose prose-sm max-w-none">
              {formatPlan(plan)}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span>
                  计划生成时间: {new Date().toLocaleString('zh-CN')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-4">暂无个性化计划</p>
            <p className="text-sm mb-4">
              记录更多数据后，AI将为您生成更精准的个性化计划
            </p>
            <Button
              onClick={generatePlan}
              disabled={generating}
              variant="outline"
            >
              生成计划
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}