'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RefreshCw, Play, Pause, Timer, Coffee } from 'lucide-react'
import confetti from 'canvas-confetti'

interface PomodoroTimerProps {
  workMinutes?: number
  breakMinutes?: number
}

export function PomodoroTimer({ workMinutes = 25, breakMinutes = 5 }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const reset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setSecondsLeft(workMinutes * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const toggle = () => setIsRunning(prev => !prev)

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // 阶段结束
          if (!isBreak) {
            // 工作结束，进入休息
            confetti({ particleCount: 100, spread: 70, origin: { x: 0.5, y: 0.3 } })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, isBreak])

  useEffect(() => {
    if (secondsLeft === 0) {
      // 自动切换阶段
      const nextIsBreak = !isBreak
      setIsBreak(nextIsBreak)
      const nextSeconds = (nextIsBreak ? breakMinutes : workMinutes) * 60
      setSecondsLeft(nextSeconds)
      // 在休息开始时暂停，等待用户手动继续
      setIsRunning(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold text-indigo-700 dark:text-indigo-200">
          {isBreak ? <Coffee className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
          {isBreak ? '休息阶段' : '专注阶段'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{workMinutes}/{breakMinutes} 分钟</div>
      </div>
      <div className="text-3xl font-mono text-center mb-3">{mm}:{ss}</div>
      <div className="flex items-center justify-center gap-2">
        <Button size="sm" variant="outline" onClick={toggle}>
          {isRunning ? (<><Pause className="w-4 h-4 mr-1" />暂停</>) : (<><Play className="w-4 h-4 mr-1" />开始</>)}
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-1" /> 重置
        </Button>
      </div>
    </div>
  )
}


