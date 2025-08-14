import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 开发期一次性输出，便于排查 "Failed to fetch"（不打印完整 key）
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    // 避免在生产泄露敏感信息，仅打印长度和域名
    const host = (() => { try { return new URL(supabaseUrl).host } catch { return supabaseUrl } })()
    // eslint-disable-next-line no-console
    console.log('[supabase] url host=', host, 'anonKey.length=', supabaseAnonKey ? String(supabaseAnonKey).length : 0)
  } catch {}
}

// 全局 fetch 超时包装，防止请求挂起导致前端一直 loading
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) {
  const timeoutMs = (init as any)?.timeoutMs ?? 8000
  return new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('fetch-timeout')), timeoutMs)
    fetch(input, init)
      .then((res) => { clearTimeout(timer); resolve(res) })
      .catch((err) => { clearTimeout(timer); reject(err) })
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout as any },
})

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
          reminder_hour: number | null
          reminder_minute: number | null
          reminder_timezone: string | null
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
          reminder_hour?: number | null
          reminder_minute?: number | null
          reminder_timezone?: string | null
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
          reminder_hour?: number | null
          reminder_minute?: number | null
          reminder_timezone?: string | null
        }
      }
      focus_sessions: {
        Row: {
          id: string
          user_id: string
          task_title: string | null
          planned_minutes: number
          actual_minutes: number
          is_success: boolean
          notes: string | null
          started_at: string
          ended_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_title?: string | null
          planned_minutes: number
          actual_minutes: number
          is_success?: boolean
          notes?: string | null
          started_at?: string
          ended_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_title?: string | null
          planned_minutes?: number
          actual_minutes?: number
          is_success?: boolean
          notes?: string | null
          started_at?: string
          ended_at?: string
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
      daily_checkins: {
        Row: {
          id: string
          user_id: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          created_at?: string
        }
      }
      points_history: {
        Row: {
          id: string
          user_id: string
          created_at: string
          points_delta: number
          source: 'checkin' | 'record' | 'manual'
          reference_id: string | null
          note: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          points_delta: number
          source: 'checkin' | 'record' | 'manual'
          reference_id?: string | null
          note?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          points_delta?: number
          source?: 'checkin' | 'record' | 'manual'
          reference_id?: string | null
          note?: string | null
        }
      }
    }
  }
}