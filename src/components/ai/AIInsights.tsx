'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AIInsightService } from '@/lib/services/aiInsightService'
import { AIInsight } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Brain,
  TrendingUp,
  Award,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'

interface AIInsightsProps {
  userId?: string
}

export function AIInsights({ userId }: AIInsightsProps) {
  const { user } = useAuth()
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const currentUserId = userId || user?.id

  useEffect(() => {
    if (currentUserId) {
      loadInsights()
    }
  }, [currentUserId])

  const loadInsights = async () => {
    if (!currentUserId) return

    setLoading(true)
    try {
      const userInsights = await AIInsightService.getUserInsights(currentUserId, 10)
      setInsights(userInsights)
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerAnalysis = async () => {
    if (!currentUserId) return

    setAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId }),
      })

      const result = await response.json()

      if (response.ok) {
        await loadInsights() // 重新加载洞察
      } else {
        console.error('Analysis failed:', result.error)
      }
    } catch (error) {
      console.error('Error triggering analysis:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const markAsRead = async (insightId: string) => {
    try {
      await AIInsightService.markAsRead(insightId)
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, is_read: true }
            : insight
        )
      )
    } catch (error) {
      console.error('Error marking insight as read:', error)
    }
  }

  const getInsightIcon = (type: AIInsight['insight_type']) => {
    switch (type) {
      case 'pattern':
        return TrendingUp
      case 'recommendation':
        return Brain
      case 'achievement':
        return Award
      case 'warning':
        return AlertTriangle
      default:
        return Brain
    }
  }

  const getInsightColor = (type: AIInsight['insight_type']) => {
    switch (type) {
      case 'pattern':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      case 'recommendation':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'achievement':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'warning':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getInsightTypeText = (type: AIInsight['insight_type']) => {
    switch (type) {
      case 'pattern':
        return '行为模式'
      case 'recommendation':
        return '建议'
      case 'achievement':
        return '成就'
      case 'warning':
        return '提醒'
      default:
        return '洞察'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI 智能洞察
          </CardTitle>
          <Button
            onClick={triggerAnalysis}
            disabled={analyzing}
            variant="outline"
            size="sm"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                分析中...
              </>
            ) : (
              '重新分析'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.insight_type)
              const colorClass = getInsightColor(insight.insight_type)
              const typeText = getInsightTypeText(insight.insight_type)

              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${
                    insight.is_read ? 'opacity-75' : 'border-l-4 border-l-primary-500'
                  } ${colorClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wide">
                          {typeText}
                        </span>
                        <span className="text-xs text-gray-500">
                          置信度: {Math.round(insight.confidence_score * 100)}%
                        </span>
                      </div>
                      <h4 className="font-semibold mb-2">{insight.title}</h4>
                      <p className="text-sm leading-relaxed">{insight.content}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(insight.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col items-center gap-2">
                      {!insight.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(insight.id)}
                          title="标记为已读"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {insight.is_read && (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-4">暂无AI洞察</p>
            <p className="text-sm mb-4">记录更多数据后，AI将为您提供个性化洞察和建议</p>
            <Button
              onClick={triggerAnalysis}
              disabled={analyzing}
              variant="outline"
            >
              {analyzing ? '分析中...' : '开始AI分析'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}