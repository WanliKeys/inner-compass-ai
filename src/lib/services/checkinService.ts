import { supabase } from '@/lib/supabase'
import { PointsHistoryService } from '@/lib/services/pointsHistoryService'

export class CheckinService {
  // 返回今天是否已签到
  static async hasCheckedInToday(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }

  // 执行签到（若已签到则返回 false）
  static async checkIn(userId: string): Promise<{ created: boolean }> {
    const today = new Date().toISOString().split('T')[0]

    // 先查
    const { data: existing, error: findErr } = await supabase
      .from('daily_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (findErr && findErr.code !== 'PGRST116') throw findErr
    if (existing) return { created: false }

    const { error: insertErr } = await supabase
      .from('daily_checkins')
      .insert({ user_id: userId, date: today })

    if (insertErr) throw insertErr
    // 写入积分历史（签到 +2）
    try { await PointsHistoryService.add(userId, 2, 'checkin', { note: '每日签到' }) } catch {}
    return { created: true }
  }

  // 获取日期范围内的签到记录
  static async getCheckinsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Array<{ id: string; date: string }>> {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('id, date')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  }
}


