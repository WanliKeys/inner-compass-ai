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

    // 调用DeepSeek AI分析
    const analysisResult = await deepSeekService.analyzeUserData(recentRecords)

    // 将AI洞察保存到数据库
    const savedInsights = []
    for (const insight of analysisResult.insights) {
      const savedInsight = await AIInsightService.createInsight(userId, {
        insight_type: insight.type,
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