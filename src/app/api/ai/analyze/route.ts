import { NextResponse } from 'next/server'
import { deepSeekService } from '@/lib/deepseek'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { AIInsightService } from '@/lib/services/aiInsightService'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // 获取用户的最近记录
    const recentRecords = await DailyRecordService.getRecentRecords(userId, 14) // 最近14天

    if (recentRecords.length === 0) {
      return NextResponse.json({ 
        insights: [],
        message: '需要更多记录数据才能进行AI分析'
      })
    }

    // 调用DeepSeek AI分析（加超时与兜底）
    const withTimeout = <T,>(p: Promise<T>, ms: number) => new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('ai-analyze-timeout')), ms)
      p.then(v => { clearTimeout(id); resolve(v) }).catch(e => { clearTimeout(id); reject(e) })
    })
    let analysisResult
    try {
      analysisResult = await withTimeout(deepSeekService.analyzeUserData(recentRecords), 15000)
    } catch (e) {
      console.warn('DeepSeek analyze timeout/fail, fallback minimal insights')
      analysisResult = {
        insights: [
          {
            type: 'recommendation',
            title: '继续积累数据',
            content: 'AI 服务暂时不可用或超时。建议继续保持每日记录，稍后再试分析。',
            confidence: 0.5,
          },
        ],
        recommendations: [],
        patterns: [],
      }
    }

    // 将AI洞察保存到数据库
    const savedInsights = []
    for (const insight of analysisResult.insights) {
      const typeSafe = ((): 'pattern' | 'recommendation' | 'achievement' | 'warning' => {
        const t = String(insight.type)
        return (['pattern', 'recommendation', 'achievement', 'warning'] as const).includes(t as any)
          ? (t as any)
          : 'recommendation'
      })()
      const savedInsight = await AIInsightService.createInsight(userId, {
        insight_type: typeSafe,
        title: insight.title,
        content: insight.content,
        confidence_score: insight.confidence,
      })
      savedInsights.push(savedInsight)
    }

    return NextResponse.json({
      insights: savedInsights,
      recommendations: analysisResult.recommendations,
      patterns: analysisResult.patterns,
    })

  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { error: 'AI analysis failed' },
      { status: 500 }
    )
  }
}