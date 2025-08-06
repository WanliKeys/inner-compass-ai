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

interface AIPlanProps {
  userId?: string
}

export function AIPlan({ userId }: AIPlanProps) {
  const { user } = useAuth()
  const [plan, setPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const currentUserId = userId || user?.id

  useEffect(() => {
    if (currentUserId) {
      generatePlan()
    }
  }, [currentUserId])

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