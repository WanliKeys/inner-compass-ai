import { supabase } from '@/lib/supabase'
import { DailyRecord, DailyRecordInput } from '@/types'

export class DailyRecordService {
  static async createRecord(userId: string, record: DailyRecordInput): Promise<DailyRecord> {
    try {
      console.log('Creating record for user:', userId, 'with data:', record)
      const { data, error } = await supabase
        .from('daily_records')
        .insert({
          ...record,
          user_id: userId,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase create error:', error)
        throw error
      }
      
      console.log('Record created successfully:', data)
      return data
    } catch (error) {
      console.error('Error in createRecord:', error)
      throw error
    }
  }

  static async updateRecord(recordId: string, updates: Partial<DailyRecordInput>): Promise<DailyRecord> {
    const { data, error } = await supabase
      .from('daily_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getRecordByDate(userId: string, date: string): Promise<DailyRecord | null> {
    try {
      console.log('Fetching record for user:', userId, 'date:', date)
      const { data, error } = await supabase
        .from('daily_records')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (error) {
        console.log('Supabase error details:', error)
        if (error.code === 'PGRST116') {
          // 记录不存在，这是正常情况
          console.log('No record found for this date (expected behavior)')
          return null
        }
        throw error
      }
      
      console.log('Record found:', data)
      return data
    } catch (error) {
      console.error('Error in getRecordByDate:', error)
      throw error
    }
  }

  static async getRecentRecords(userId: string, limit: number = 30): Promise<DailyRecord[]> {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getRecordsByDateRange(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<DailyRecord[]> {
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async deleteRecord(recordId: string): Promise<void> {
    const { error } = await supabase
      .from('daily_records')
      .delete()
      .eq('id', recordId)

    if (error) throw error
  }

  static async getAnalyticsData(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const records = await this.getRecordsByDateRange(
      userId,
      startDate.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    )

    const analytics = {
      totalRecords: records.length,
      averageMood: records.length > 0 
        ? records.reduce((sum, r) => sum + r.mood_score, 0) / records.length
        : 0,
      averageEnergy: records.length > 0 
        ? records.reduce((sum, r) => sum + r.energy_level, 0) / records.length
        : 0,
      averageProductivity: records.length > 0 
        ? records.reduce((sum, r) => sum + r.productivity_score, 0) / records.length
        : 0,
      totalGoalsCompleted: records.reduce((sum, r) => sum + (r.goals_completed || 0), 0),
      streak: this.calculateStreak(records),
    }

    return { records, analytics }
  }

  private static calculateStreak(records: DailyRecord[]): number {
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
}