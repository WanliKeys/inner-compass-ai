'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'
import { CheckinService } from '@/lib/services/checkinService'
import { GamificationService } from '@/lib/services/gamificationService'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const withTimeout = <T,>(p: Promise<T>, ms: number) =>
      new Promise<T>((resolve, reject) => {
        const id = setTimeout(() => reject(new Error('auth init timeout')), ms)
        p.then((v) => { clearTimeout(id); resolve(v) }).catch((e) => { clearTimeout(id); reject(e) })
      })

    // 获取初始会话（加超时兜底）
    withTimeout(supabase.auth.getSession(), 5000)
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      })
      .catch((e) => {
        console.warn('auth init failed', e?.message || e)
        setLoading(false)
      })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try { console.log('[auth] onAuthStateChange event=', event, 'hasSession=', !!session?.user) } catch {}
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // 若本地未保存“记住密码”数据，则至少存下邮箱，用于下次预填
        try {
          const saved = localStorage.getItem('rememberedCredentials')
          if (!saved && session.user.email) {
            localStorage.setItem('rememberedCredentials', JSON.stringify({ email: session.user.email, password: '' }))
          }
        } catch {}
        await fetchProfile(session.user.id)
        // 任意方式登录/恢复会话后，自动签到（幂等）并刷新统计
        let created = false
        try {
          const res = await CheckinService.checkIn(session.user.id)
          created = !!res.created
        } catch (e) {
          console.error('Auto check-in (onAuthStateChange) failed:', e)
        } finally {
          try {
            await GamificationService.updateUserGameStats(session.user.id)
            await fetchProfile(session.user.id)
            if (created) showCheckinCelebration(2)
          } catch (e) {
            console.error('Update game stats (onAuthStateChange) failed:', e)
          }
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
      
      // 如果是登出事件，立即清除状态
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setSession(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const showCheckinCelebration = (points: number = 2) => {
    // 延后到 Dashboard 页面统一展示，避免登录后立即路由跳转导致提示被打断
    try { localStorage.setItem('checkin:pendingPoints', String(points)) } catch {}
  }

  const fetchProfile = async (userId: string) => {
    try {
      // 允许无行返回而不抛错
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        // 本地项目可能未启用触发器；兜底创建一条 profile
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert({ id: userId })
        if (insertErr && insertErr.code !== '23505') { // 23505: unique_violation
          throw insertErr
        }
        const { data: created } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        setProfile(created || null)
      } else {
        setProfile(data)
      }
    } catch (err: any) {
      try {
        // 降级为 warn，避免在 DevTools 中误触发 Error Overlay
        // 并提供更可读的信息
        console.warn('fetchProfile warning', JSON.stringify({
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
        }))
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    // 登录成功后自动签到（幂等）并刷新 gamification 统计
    const user = (await supabase.auth.getUser()).data.user
    if (user) {
      let created = false
      try {
        const res = await CheckinService.checkIn(user.id)
        created = !!res.created
      } catch (e) {
        console.error('Auto check-in failed:', e)
      } finally {
        try {
          await GamificationService.updateUserGameStats(user.id)
          await fetchProfile(user.id)
          if (created) showCheckinCelebration(2)
        } catch (e) {
          console.error('Update game stats failed:', e)
        }
      }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    setLoading(true)
    try {
      // getSession 偶发挂起，这里加 1s 保险，不阻塞退出
      const before = (await Promise.race([
        supabase.auth.getSession(),
        new Promise<any>((resolve) => setTimeout(() => resolve({ data: { session: null } }), 1000)),
      ])) as { data: { session: any } }
      try { console.log('[auth] signOut start, hasSessionBefore=', !!before?.data?.session) } catch {}
      // 若本地无会话，直接本地清理并返回，不等待 4s
      if (!before?.data?.session) {
        try { await supabase.auth.signOut({ scope: 'local' } as any) } catch {}
        try { localStorage.setItem('auth:justSignedOut', '1') } catch {}
        setUser(null)
        setProfile(null)
        setSession(null)
        setLoading(false)
        try { console.log('[auth] signOut short-circuit: no local session, cleared locally') } catch {}
        return
      }
      let resolved = false
      const signOutPromise = supabase.auth.signOut().then(() => { resolved = true })
      const raceResult = await Promise.race([
        signOutPromise.then(() => 'ok'),
        new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 4000)),
      ])
      try { console.log('[auth] signOut result=', raceResult, 'resolvedFlag=', resolved) } catch {}
      if (raceResult !== 'ok') {
        // 网络失败时至少清本地 token
        try { await supabase.auth.signOut({ scope: 'local' } as any) } catch {}
      }
    } catch (e) {
      try { console.warn('[auth] signOut error/timeout', (e as any)?.message || e) } catch {}
      try { await supabase.auth.signOut({ scope: 'local' } as any) } catch {}
    } finally {
      try { localStorage.setItem('auth:justSignedOut', '1') } catch {}
      try {
        // 非阻塞地探测退出后的会话状态，最多等待 800ms，避免卡在这里
        Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((resolve) => setTimeout(() => resolve({ data: { session: null } }), 800)),
        ])
        .then((after: any) => {
          try { console.log('[auth] signOut finally, hasSessionAfter=', !!after?.data?.session) } catch {}
        })
        .catch(() => {})
      } catch {}
      setUser(null)
      setProfile(null)
      setSession(null)
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    setProfile(prev => prev ? { ...prev, ...updates } : null)
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}