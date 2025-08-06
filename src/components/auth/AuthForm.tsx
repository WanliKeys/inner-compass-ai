'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface AuthFormProps {
  mode?: 'signin' | 'signup'
  onSuccess?: () => void
}

export function AuthForm({ mode = 'signin', onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(mode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { signIn, signUp } = useAuth()

  // 组件加载时检查是否有保存的凭据
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials')
    if (savedCredentials) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials)
        setEmail(savedEmail)
        setPassword(savedPassword)
        setRememberMe(true)
      } catch (error) {
        // 如果解析失败，清除无效数据
        localStorage.removeItem('rememberedCredentials')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        await signUp(email, password, fullName)
        // 注册成功后不保存密码，为了安全
      } else {
        await signIn(email, password)
        
        // 登录成功后处理记住密码
        if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
            email,
            password
          }))
        } else {
          localStorage.removeItem('rememberedCredentials')
        }
      }
      onSuccess?.()
    } catch (error: any) {
      setError(error.message)
      // 登录失败时不保存密码
      localStorage.removeItem('rememberedCredentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? '注册账户' : '登录'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Input
              label="姓名"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="请输入姓名"
            />
          )}

          <Input
            label="邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="请输入邮箱地址"
          />

          <Input
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="请输入密码"
          />

          {!isSignUp && (
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                记住密码
              </label>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              // 切换模式时清空表单，避免混乱
              if (!isSignUp) {
                // 切换到注册模式时清空所有字段
                setEmail('')
                setPassword('')
                setFullName('')
                setRememberMe(false)
                localStorage.removeItem('rememberedCredentials')
              } else {
                // 切换到登录模式时检查是否有保存的凭据
                const savedCredentials = localStorage.getItem('rememberedCredentials')
                if (savedCredentials) {
                  try {
                    const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials)
                    setEmail(savedEmail)
                    setPassword(savedPassword)
                    setRememberMe(true)
                  } catch (error) {
                    localStorage.removeItem('rememberedCredentials')
                  }
                }
                setFullName('')
              }
              setError(null)
            }}
            className="text-primary-600 hover:text-primary-700 text-sm"
          >
            {isSignUp ? '已有账户？立即登录' : '没有账户？立即注册'}
          </button>
        </div>
      </div>
    </div>
  )
}