import { DailyRecord, AIInsight } from '@/types'

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface AnalysisResult {
  insights: Array<{
    type: 'pattern' | 'recommendation' | 'achievement' | 'warning'
    title: string
    content: string
    confidence: number
  }>
  recommendations: string[]
  patterns: string[]
}

export class DeepSeekService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || ''
    this.baseUrl = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com'
  }

  private async callAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的个人成长AI助手，专门分析用户的每日记录数据，提供个性化的洞察和建议。请用中文回复，并且回复要准确、有用、积极向上。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`)
      }

      const data: DeepSeekResponse = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('DeepSeek API call failed:', error)
      throw error
    }
  }

  async analyzeUserData(records: DailyRecord[]): Promise<AnalysisResult> {
    if (records.length === 0) {
      return {
        insights: [],
        recommendations: [],
        patterns: []
      }
    }

    const analysisPrompt = this.buildAnalysisPrompt(records)
    const response = await this.callAPI(analysisPrompt)
    
    return this.parseAnalysisResponse(response)
  }

  async generatePersonalizedPlan(records: DailyRecord[], goals: any[]): Promise<string> {
    const planPrompt = this.buildPlanPrompt(records, goals)
    return await this.callAPI(planPrompt)
  }

  private buildAnalysisPrompt(records: DailyRecord[]): string {
    const recentRecords = records.slice(-7) // 最近7天
    const dataString = recentRecords.map(record => {
      return `日期: ${record.date}
情绪评分: ${record.mood_score}/10
精力水平: ${record.energy_level}/10  
生产力: ${record.productivity_score}/10
感恩记录: ${record.gratitude_notes || '无'}
成就: ${record.achievements?.join(', ') || '无'}
挑战: ${record.challenges?.join(', ') || '无'}
反思: ${record.reflections || '无'}
完成目标数: ${record.goals_completed}`
    }).join('\n\n')

    return `请分析以下用户的每日记录数据，并提供洞察和建议：

${dataString}

请以JSON格式回复，包含以下字段：
{
  "insights": [
    {
      "type": "pattern|recommendation|achievement|warning",
      "title": "洞察标题",
      "content": "详细内容",
      "confidence": 0.8
    }
  ],
  "recommendations": ["建议1", "建议2"],
  "patterns": ["模式1", "模式2"]
}

重点关注：
1. 情绪、精力、生产力的变化趋势
2. 积极和消极的行为模式
3. 可操作的改进建议
4. 值得庆祝的成就和进步`
  }

  private buildPlanPrompt(records: DailyRecord[], goals: any[]): string {
    const recentTrends = this.analyzeTrends(records)
    const goalsList = goals.map(g => `${g.title} (${g.status})`).join(', ')

    return `基于用户的历史数据和当前目标，制定一个个性化的今日计划：

最近趋势：
${recentTrends}

当前目标：${goalsList || '无特定目标'}

请提供一个结构化的今日计划，包括：
1. 优先任务（基于历史表现和目标）
2. 建议的活动安排
3. 提升情绪和精力的具体建议
4. 需要注意的事项

计划应该现实可行，符合用户的行为模式。`
  }

  private analyzeTrends(records: DailyRecord[]): string {
    if (records.length < 3) return '数据不足以分析趋势'

    const recent = records.slice(-7)
    const avgMood = recent.reduce((sum, r) => sum + r.mood_score, 0) / recent.length
    const avgEnergy = recent.reduce((sum, r) => sum + r.energy_level, 0) / recent.length
    const avgProductivity = recent.reduce((sum, r) => sum + r.productivity_score, 0) / recent.length

    return `平均情绪: ${avgMood.toFixed(1)}/10
平均精力: ${avgEnergy.toFixed(1)}/10
平均生产力: ${avgProductivity.toFixed(1)}/10`
  }

  private parseAnalysisResponse(response: string): AnalysisResult {
    try {
      const parsed = JSON.parse(response)
      return {
        insights: parsed.insights || [],
        recommendations: parsed.recommendations || [],
        patterns: parsed.patterns || []
      }
    } catch (error) {
      console.error('Failed to parse DeepSeek response:', error)
      return {
        insights: [{
          type: 'recommendation',
          title: '继续记录',
          content: '继续每日记录，积累更多数据以获得更准确的分析。',
          confidence: 0.8
        }],
        recommendations: ['继续每日记录', '保持积极心态'],
        patterns: []
      }
    }
  }
}

export const deepSeekService = new DeepSeekService()