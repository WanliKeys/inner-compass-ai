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

    // 如果缺少 DeepSeek API Key，或调用失败，则回退到本地生成方案
    const buildLocalPlan = () => {
      const recent = recentRecords.slice(-7)
      const avg = (arr: number[]) => (arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length) : 0)
      const avgMood = avg(recent.map(r => r.mood_score))
      const avgEnergy = avg(recent.map(r => r.energy_level))
      const avgProductivity = avg(recent.map(r => r.productivity_score))
      const totalGoalsCompleted = recent.reduce((s, r) => s + (r.goals_completed || 0), 0)
      const today = new Date().toLocaleDateString('zh-CN')
      const goalsLine = userGoals && userGoals.length > 0
        ? userGoals.map(g => `- ${g.title}（${g.category}｜优先级：${g.priority}｜进度：${g.progress}%）`).join('\n')
        : '- 暂无活跃目标，可添加一个今天能完成的微目标'

      const energyAdvice = avgEnergy < 6
        ? '- 今天优先安排高价值但低耗的任务，避免长时间高强度专注\n- 安排1-2次短暂散步/拉伸（每次5-10分钟）'
        : '- 安排一段深度工作（25-45分钟），配合短休息\n- 下午加入一次户外轻运动提升状态'

      const moodAdvice = avgMood < 6
        ? '- 用3分钟做情绪标注，写下1-2条具体诱因\n- 做一条感恩记录或给朋友发条问候信息'
        : '- 记录一件值得庆祝的小进步\n- 分享给未来的自己一句鼓励话'

      const productivityAdvice = avgProductivity < 6
        ? '- 用番茄钟（25/5）完成一个小块任务\n- 把“大目标”拆成3个今天能推进的步骤'
        : '- 继续保持，将关键任务前置，减少上下文切换'

      return `# 今日个性化计划（${today}）\n\n概览：\n- 近7天 平均情绪：${avgMood.toFixed(1)}/10｜平均精力：${avgEnergy.toFixed(1)}/10｜平均生产力：${avgProductivity.toFixed(1)}/10\n- 近7天 完成目标数：${totalGoalsCompleted}\n\n## 优先任务（基于当前活跃目标）\n${goalsLine}\n\n## 活动安排（建议）\n- 上午：专注推进最重要的一项（30-60分钟）\n- 下午：复盘与微调，处理沟通/回复类事务（30分钟）\n- 晚间：10分钟日终回顾，记录今日1个亮点与1个改进点\n\n## 提升情绪与精力\n${energyAdvice}\n${moodAdvice}\n\n## 效率建议\n${productivityAdvice}\n\n## 注意事项\n- 别把计划做满：预留20%-30%机动时间\n- 记录一次“最分心的瞬间”，帮助AI后续识别干扰模式\n\n完成以上计划后，回到仪表盘勾选并记录收获，积累积分与连续天数。`
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({ plan: buildLocalPlan() })
    }

    try {
      // 生成个性化计划（远端）
      const personalizedPlan = await deepSeekService.generatePersonalizedPlan(recentRecords, userGoals)
      return NextResponse.json({ plan: personalizedPlan })
    } catch (err) {
      console.error('Plan generation error, fallback to local plan:', err)
      return NextResponse.json({ plan: buildLocalPlan() })
    }

  } catch (error) {
    console.error('Plan generation error:', error)
    // 最外层兜底：返回简要本地计划，避免 500
    return NextResponse.json({
      plan: '今日建议：\n\n1. 选择一项最重要的小目标并推进30分钟\n2. 中午或下午安排一次短时散步/拉伸\n3. 晚上进行10分钟日终回顾与记录\n\n说明：当前AI服务暂不可用，已为你提供可执行的临时计划。'
    })
  }
}