import { supabase } from '@/lib/supabase'
import { CheckinService } from '@/lib/services/checkinService'
import { DailyRecord } from '@/types'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  requirement: {
    type: 'streak' | 'total_records' | 'mood_average' | 'goals_completed' | 'special'
    value: number
    period?: number // days
  }
  unlocked: boolean
}

export class GamificationService {
  // 预定义成就列表
  static readonly ACHIEVEMENTS: Omit<Achievement, 'id' | 'unlocked'>[] = [
    {
      title: '初次记录',
      description: '完成第一次每日记录',
      icon: '🌱',
      points: 10,
      requirement: { type: 'total_records', value: 1 }
    },
    {
      title: '坚持一周',
      description: '连续记录7天',
      icon: '📅',
      points: 50,
      requirement: { type: 'streak', value: 7 }
    },
    {
      title: '坚持半月',
      description: '连续记录15天',
      icon: '🔥',
      points: 100,
      requirement: { type: 'streak', value: 15 }
    },
    {
      title: '坚持一月',
      description: '连续记录30天',
      icon: '💎',
      points: 200,
      requirement: { type: 'streak', value: 30 }
    },
    {
      title: '百日成长',
      description: '连续记录100天',
      icon: '🏆',
      points: 500,
      requirement: { type: 'streak', value: 100 }
    },
    {
      title: '积极心态',
      description: '近7天平均心情超过7分',
      icon: '😊',
      points: 30,
      requirement: { type: 'mood_average', value: 7, period: 7 }
    },
    {
      title: '高效达人',
      description: '完成100个目标',
      icon: '🎯',
      points: 150,
      requirement: { type: 'goals_completed', value: 100 }
    },
    {
      title: '记录达人',
      description: '完成50次记录',
      icon: '📝',
      points: 100,
      requirement: { type: 'total_records', value: 50 }
    },
    {
      title: '情绪管理师',
      description: '近30天平均心情超过8分',
      icon: '🧘',
      points: 100,
      requirement: { type: 'mood_average', value: 8, period: 30 }
    }
  ]

  // 计算用户当前积分
  static async calculateUserPoints(userId: string): Promise<number> {
    // 从数据库获取用户记录
    const { data: records, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    const totalRecords = records?.length || 0
    const streak = await this.calculateUnifiedStreak(userId, records || [])
    
    // 基础积分计算
    let points = 0
    
    // 每次记录得分
    points += totalRecords * 5
    
    // 连续记录奖励
    points += Math.floor(streak / 7) * 20 // 每连续7天额外20分
    
    // 质量奖励
    records?.forEach(record => {
      if (record.mood_score >= 8) points += 2
      if (record.energy_level >= 8) points += 2
      if (record.productivity_score >= 8) points += 2
      if (record.goals_completed > 0) points += record.goals_completed * 3
    })

    // 签到积分（每次签到 +2）
    try {
      const { count: checkinCount } = await supabase
        .from('daily_checkins')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (typeof checkinCount === 'number') {
        points += checkinCount * 2
      }
    } catch {}

    return points
  }

  // 检查用户成就解锁情况
  static async checkAchievements(userId: string): Promise<Achievement[]> {
    const { data: records, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error

    const totalRecords = records?.length || 0
    const streak = this.calculateStreak(records || [])
    const totalGoalsCompleted = records?.reduce((sum, r) => sum + (r.goals_completed || 0), 0) || 0

    // 计算平均心情（不同时间段）
    const recent7Days = records?.slice(0, 7) || []
    const recent30Days = records?.slice(0, 30) || []
    
    const avgMood7Days = recent7Days.length > 0 
      ? recent7Days.reduce((sum, r) => sum + r.mood_score, 0) / recent7Days.length
      : 0

    const avgMood30Days = recent30Days.length > 0 
      ? recent30Days.reduce((sum, r) => sum + r.mood_score, 0) / recent30Days.length
      : 0

    return this.ACHIEVEMENTS.map((achievement, index) => {
      let unlocked = false

      switch (achievement.requirement.type) {
        case 'total_records':
          unlocked = totalRecords >= achievement.requirement.value
          break
        case 'streak':
          unlocked = streak >= achievement.requirement.value
          break
        case 'goals_completed':
          unlocked = totalGoalsCompleted >= achievement.requirement.value
          break
        case 'mood_average':
          if (achievement.requirement.period === 7) {
            unlocked = avgMood7Days >= achievement.requirement.value
          } else if (achievement.requirement.period === 30) {
            unlocked = avgMood30Days >= achievement.requirement.value
          }
          break
      }

      return {
        ...achievement,
        id: `achievement_${index}`,
        unlocked
      }
    })
  }

  // 获取用户等级
  static getUserLevel(points: number): number {
    return Math.floor(points / 100) + 1
  }

  // 获取下一等级所需积分
  static getPointsToNextLevel(points: number): number {
    const currentLevel = this.getUserLevel(points)
    const pointsForNextLevel = currentLevel * 100
    return pointsForNextLevel - points
  }

  // 计算连续天数
  static calculateStreak(records: DailyRecord[]): number {
    if (records.length === 0) return 0

    const sortedRecords = records.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const record of sortedRecords) {
      const recordDate = new Date(record.date)
      recordDate.setHours(0, 0, 0, 0)

      if (recordDate.getTime() === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (recordDate.getTime() < currentDate.getTime()) {
        break
      }
    }

    return streak
  }

  // 合并每日记录与签到记录，计算连续天数
  static async calculateUnifiedStreak(userId: string, records: DailyRecord[]): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 收集记录日期集合
    const recordDates = new Set(
      (records || []).map(r => {
        const d = new Date(r.date)
        d.setHours(0, 0, 0, 0)
        return d.toISOString().split('T')[0]
      })
    )

    // 向后最多看 60 天的签到（足够用于 streak 计算）
    const start = new Date()
    start.setDate(today.getDate() - 60)
    const startStr = start.toISOString().split('T')[0]
    const endStr = today.toISOString().split('T')[0]
    let checkinDates = new Set<string>()
    try {
      const checkins = await supabase
        .from('daily_checkins')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false })
      if (checkins.error) throw checkins.error
      checkinDates = new Set((checkins.data || []).map(c => c.date))
    } catch {}

    let streak = 0
    const cursor = new Date(today)
    while (true) {
      const ymd = cursor.toISOString().split('T')[0]
      const hasActivity = recordDates.has(ymd) || checkinDates.has(ymd)
      if (hasActivity) {
        streak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  // 获取记录奖励积分
  static getRecordReward(record: DailyRecord): number {
    let points = 5 // 基础记录分

    // 质量奖励
    if (record.mood_score >= 8) points += 2
    if (record.energy_level >= 8) points += 2
    if (record.productivity_score >= 8) points += 2
    
    // 目标完成奖励
    if (record.goals_completed > 0) {
      points += record.goals_completed * 3
    }

    // 内容丰富度奖励
    if (record.achievements && record.achievements.length > 0) points += 2
    if (record.reflections && record.reflections.length > 50) points += 3
    if (record.gratitude_notes && record.gratitude_notes.length > 20) points += 2

    return points
  }

  // 更新用户积分和等级
  static async updateUserGameStats(userId: string): Promise<void> {
    const points = await this.calculateUserPoints(userId)
    const level = this.getUserLevel(points)

    // 计算连续天数
    const { data: records } = await supabase
      .from('daily_records')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    const streak = await this.calculateUnifiedStreak(userId, (records?.map(r => ({
      ...r,
      id: '',
      user_id: userId,
      mood_score: 5,
      energy_level: 5,
      productivity_score: 5,
      goals_completed: 0,
      gratitude_notes: '',
      achievements: [],
      challenges: [],
      reflections: '',
      created_at: '',
      updated_at: ''
    })) || []))

    await supabase
      .from('profiles')
      .update({
        total_points: points,
        level: level,
        streak_count: streak,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
  }
}