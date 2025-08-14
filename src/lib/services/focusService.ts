import { supabase } from '@/lib/supabase'

export interface FocusSessionInput {
  task_title?: string
  planned_minutes: number
  actual_minutes: number
  is_success?: boolean
  notes?: string
}

export class FocusService {
  static async logSession(userId: string, input: FocusSessionInput) {
    const { error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: userId,
        task_title: input.task_title || null,
        planned_minutes: input.planned_minutes,
        actual_minutes: input.actual_minutes,
        is_success: input.is_success ?? true,
        notes: input.notes || null,
      })
    if (error) throw error
  }

  static async getTodayTotalMinutes(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('actual_minutes, started_at')
      .eq('user_id', userId)
      .gte('started_at', `${today}T00:00:00Z`)
    if (error) throw error
    return (data || []).reduce((sum, s: any) => sum + (s.actual_minutes || 0), 0)
  }

  static async getFocusMinutesByRange(userId: string, days: number = 7): Promise<Array<{ date: string; minutes: number }>> {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('actual_minutes, started_at')
      .eq('user_id', userId)
      .gte('started_at', `${startStr}T00:00:00Z`)
      .lte('started_at', `${endStr}T23:59:59Z`)
    if (error) throw error
    const map = new Map<string, number>()
    const cursor = new Date(start)
    while (cursor <= end) {
      const ymd = cursor.toISOString().split('T')[0]
      map.set(ymd, 0)
      cursor.setDate(cursor.getDate() + 1)
    }
    ;(data || []).forEach((row: any) => {
      const ymd = new Date(row.started_at).toISOString().split('T')[0]
      map.set(ymd, (map.get(ymd) || 0) + (row.actual_minutes || 0))
    })
    return Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }))
  }
}


