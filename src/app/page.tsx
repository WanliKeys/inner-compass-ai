'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const { user, loading, signIn } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const featuresRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
      return
    }
    // 无会话但有本地记住的凭据时，自动静默登录一次
    if (!user && !loading) {
      try {
        // 若刚退出，跳过本次静默登录
        const just = localStorage.getItem('auth:justSignedOut')
        if (just) { localStorage.removeItem('auth:justSignedOut'); return }
        const saved = localStorage.getItem('rememberedCredentials')
        if (saved) {
          const { email, password } = JSON.parse(saved)
          if (email && password) {
            (async () => {
              try { await signIn(email, password) } catch {}
            })()
          }
        }
      } catch {}
    }
  }, [user, loading, router, signIn])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    ) // 重定向中的loading状态
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-30 bg-primary-400/40" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-30 bg-secondary-400/40" />
      </div>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-primary-600/10 text-primary-600 ring-1 ring-primary-600/20">
              AI 驱动 · 习惯养成 · 可视化洞察
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              内在罗盘，指引你的长期成长
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              记录每日心情、精力与产出，AI 持续分析趋势并给出行动建议。以积分、连续天数与成就激励，帮助你形成可持续的成长习惯。
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button onClick={() => setShowAuthModal(true)} className="px-6 py-3 bg-primary-600 hover:bg-primary-700">
                开始记录成长
              </Button>
              <Button
                variant="outline"
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="px-6 py-3"
              >
                了解功能
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 p-4">
                <div className="text-xl font-bold text-gray-900 dark:text-white">7天</div>
                <div className="text-xs text-gray-500">趋势可视化</div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 p-4">
                <div className="text-xl font-bold text-gray-900 dark:text-white">AI</div>
                <div className="text-xs text-gray-500">洞察与计划</div>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 p-4">
                <div className="text-xl font-bold text-gray-900 dark:text-white">+积分</div>
                <div className="text-xs text-gray-500">成就激励</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl h-72 sm:h-96 w-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center shadow-2xl ring-1 ring-white/20">
              <div className="text-center text-white">
                <div className="text-7xl font-bold mb-4 drop-shadow">📈</div>
                <div className="text-2xl font-semibold drop-shadow">智能成长记录平台</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">功能特色</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              每日记录 • AI分析 • 个性化成长
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
              科学的成长记录系统
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">多维度记录</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                  记录情绪、精力、生产力、成就、挑战和反思，全方位追踪成长轨迹
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">AI智能分析</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                  基于DeepSeek-R1，深度分析行为模式，提供个性化洞察和建议
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">成瘾机制</h3>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                  积分、等级、连续天数，游戏化设计让成长记录变成习惯
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-end items-center mb-4">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <AuthForm onSuccess={() => {
                setShowAuthModal(false)
                router.push('/dashboard')
              }} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}