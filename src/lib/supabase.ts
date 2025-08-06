import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          streak_count: number
          total_points: number
          level: number
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          streak_count?: number
          total_points?: number
          level?: number
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          streak_count?: number
          total_points?: number
          level?: number
        }
      }
      daily_records: {
        Row: {
          id: string
          user_id: string
          date: string
          mood_score: number
          energy_level: number
          productivity_score: number
          gratitude_notes: string | null
          achievements: string[] | null
          challenges: string[] | null
          reflections: string | null
          goals_completed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          mood_score: number
          energy_level: number
          productivity_score: number
          gratitude_notes?: string | null
          achievements?: string[] | null
          challenges?: string[] | null
          reflections?: string | null
          goals_completed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          mood_score?: number
          energy_level?: number
          productivity_score?: number
          gratitude_notes?: string | null
          achievements?: string[] | null
          challenges?: string[] | null
          reflections?: string | null
          goals_completed?: number
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string
          target_date: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'active' | 'completed' | 'paused'
          progress: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category: string
          target_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'active' | 'completed' | 'paused'
          progress?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string
          target_date?: string | null
          priority?: 'low' | 'medium' | 'high'
          status?: 'active' | 'completed' | 'paused'
          progress?: number
          created_at?: string
          updated_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: 'pattern' | 'recommendation' | 'achievement' | 'warning'
          title: string
          content: string
          confidence_score: number
          created_at: string
          is_read: boolean
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: 'pattern' | 'recommendation' | 'achievement' | 'warning'
          title: string
          content: string
          confidence_score: number
          created_at?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          insight_type?: 'pattern' | 'recommendation' | 'achievement' | 'warning'
          title?: string
          content?: string
          confidence_score?: number
          created_at?: string
          is_read?: boolean
        }
      }
    }
  }
}