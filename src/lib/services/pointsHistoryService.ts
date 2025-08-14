import { supabase } from '@/lib/supabase'

export type PointsSource = 'checkin' | 'record' | 'manual'

export interface PointsHistoryItem {
  id: string
  user_id: string
  created_at: string
  points_delta: number
  source: PointsSource
  reference_id: string | null
  note: string | null
}

export class PointsHistoryService {
  static async add(userId: string, delta: number, source: PointsSource, options?: { referenceId?: string; note?: string }) {
    const { error } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        points_delta: delta,
        source,
        reference_id: options?.referenceId || null,
        note: options?.note || null,
      })

    if (error) throw error
  }

  static async list(userId: string, limit: number = 50): Promise<PointsHistoryItem[]> {
    const { data, error } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}


