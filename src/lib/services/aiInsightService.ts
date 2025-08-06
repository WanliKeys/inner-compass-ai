import { supabase } from '@/lib/supabase'
import { AIInsight } from '@/types'

export class AIInsightService {
  static async createInsight(
    userId: string, 
    insight: Omit<AIInsight, 'id' | 'user_id' | 'created_at' | 'is_read'>
  ): Promise<AIInsight> {
    const { data, error } = await supabase
      .from('ai_insights')
      .insert({
        ...insight,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserInsights(
    userId: string, 
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<AIInsight[]> {
    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async markAsRead(insightId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('id', insightId)

    if (error) throw error
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
  }

  static async deleteInsight(insightId: string): Promise<void> {
    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', insightId)

    if (error) throw error
  }

  static async getInsightsByType(
    userId: string, 
    type: AIInsight['insight_type']
  ): Promise<AIInsight[]> {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('insight_type', type)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}