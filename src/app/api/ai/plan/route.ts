import { NextResponse } from 'next/server'
import { deepSeekService } from '@/lib/deepseek'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { GoalService } from '@/lib/services/goalService'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // 获取用户数据
    const [recentRecords, userGoals] = await Promise.all([
      DailyRecordService.getRecentRecords(userId, 7),
      GoalService.getUserGoals(userId, 'active')
    ])

    if (recentRecords.length === 0) {
      return NextResponse.json({
        plan: '欢迎开始记录！建议今天从简单的记录开始：\n\n1. 记录当前的情绪状态\n2. 设定一个小目标\n3. 记录一件值得感恩的事\n4. 写下对今天的期待\n\n每天的小记录会积累成大改变！'
      })
    }

    // 生成个性化计划
    const personalizedPlan = await deepSeekService.generatePersonalizedPlan(recentRecords, userGoals)

    return NextResponse.json({
      plan: personalizedPlan
    })

  } catch (error) {
    console.error('Plan generation error:', error)
    return NextResponse.json(
      { error: 'Plan generation failed' },
      { status: 500 }
    )
  }
}