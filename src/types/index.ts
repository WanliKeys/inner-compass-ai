export interface User {
  id: string
  email?: string
  full_name?: string | null
  username?: string | null
  avatar_url?: string | null
}

export interface Profile {
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

export interface DailyRecord {
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

export interface Goal {
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

export interface AIInsight {
  id: string
  user_id: string
  insight_type: 'pattern' | 'recommendation' | 'achievement' | 'warning'
  title: string
  content: string
  confidence_score: number
  created_at: string
  is_read: boolean
}

export interface DailyRecordInput {
  date: string
  mood_score: number
  energy_level: number
  productivity_score: number
  gratitude_notes?: string
  achievements?: string[]
  challenges?: string[]
  reflections?: string
  goals_completed?: number
}

export interface GoalInput {
  title: string
  description?: string
  category: string
  target_date?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'active' | 'completed' | 'paused'
  progress?: number
}