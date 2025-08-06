import { supabase } from '@/lib/supabase'
import { Goal, GoalInput } from '@/types'

export class GoalService {
  static async createGoal(userId: string, goal: GoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goal,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateGoal(goalId: string, updates: Partial<GoalInput>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getGoal(goalId: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }

  static async getUserGoals(userId: string, status?: Goal['status']): Promise<Goal[]> {
    let query = supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)

    if (error) throw error
  }

  static async updateGoalProgress(goalId: string, progress: number): Promise<Goal> {
    const updates: Partial<GoalInput> = { progress }
    
    if (progress >= 100) {
      updates.status = 'completed'
    }

    return this.updateGoal(goalId, updates)
  }

  static async getGoalAnalytics(userId: string) {
    const goals = await this.getUserGoals(userId)
    
    const analytics = {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      completedGoals: goals.filter(g => g.status === 'completed').length,
      pausedGoals: goals.filter(g => g.status === 'paused').length,
      averageProgress: goals.length > 0 
        ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length
        : 0,
      categoryCounts: goals.reduce((acc, goal) => {
        acc[goal.category] = (acc[goal.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      priorityCounts: goals.reduce((acc, goal) => {
        acc[goal.priority] = (acc[goal.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return { goals, analytics }
  }
}