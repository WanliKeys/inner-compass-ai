import { NextResponse } from 'next/server'
import { DailyRecordService } from '@/lib/services/dailyRecordService'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)
    const records = await DailyRecordService.getRecordsByDateRange(
      userId,
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    )

    const total = records.length
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)
    const avgMood = avg(records.map(r => r.mood_score))
    const avgEnergy = avg(records.map(r => r.energy_level))
    const avgProductivity = avg(records.map(r => r.productivity_score))
    const completed = records.reduce((s, r) => s + (r.goals_completed || 0), 0)

    const report = `# 本周周报（${start.toLocaleDateString('zh-CN')} - ${end.toLocaleDateString('zh-CN')}）\n\n记录天数：${total}/7\n平均情绪：${avgMood.toFixed(1)}/10\n平均精力：${avgEnergy.toFixed(1)}/10\n平均生产力：${avgProductivity.toFixed(1)}/10\n完成目标数：${completed}\n\n亮点：\n- 保持了记录习惯，数据在增长\n\n建议：\n- 为下周设定1-2个明确的小目标，持续复盘`

    return NextResponse.json({ report })
  } catch (e) {
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}


