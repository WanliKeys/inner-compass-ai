'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { RefreshCw, Play, Pause, Timer, Coffee, CheckCircle2, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useAuth } from '@/contexts/AuthContext'
import { FocusService } from '@/lib/services/focusService'
import { PointsHistoryService } from '@/lib/services/pointsHistoryService'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { getDateString } from '@/lib/utils'

interface PomodoroTimerProps {
  workMinutes?: number
  breakMinutes?: number
}

export function PomodoroTimer({ workMinutes = 25, breakMinutes = 5 }: PomodoroTimerProps) {
  const { user } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [customMinutes, setCustomMinutes] = useState<number>(workMinutes)
  const [showReview, setShowReview] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const reset = () => {
    setIsRunning(false)
    setIsBreak(false)
    setSecondsLeft(customMinutes * 60)
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
            setShowReview(true)
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
      const nextSeconds = (nextIsBreak ? breakMinutes : customMinutes) * 60
      setSecondsLeft(nextSeconds)
      // 在休息开始时暂停，等待用户手动继续
      setIsRunning(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  // 监听 ESC 退出全屏，恢复样式
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement && document.fullscreenElement === containerRef.current
      setFullscreen(isFs)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    // Safari 兼容（可忽略类型）
    // @ts-ignore
    document.addEventListener('webkitfullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      // @ts-ignore
      document.removeEventListener('webkitfullscreenchange', onFsChange)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? 'fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-8'
          : 'p-4 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20'
      }
    >
      {/* 工具栏 */}
      <div className={`flex items-center justify-between ${fullscreen ? 'absolute top-4 right-4 left-4' : 'mb-2'}`}>
        {!fullscreen && (
          <div className="text-xs text-gray-600 dark:text-gray-300">专注工具</div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <label className={`text-xs flex items-center gap-1 ${fullscreen ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'}`}>
            <input
              type="checkbox"
              className="accent-indigo-600"
              checked={fullscreen}
              onChange={(e) => {
                setFullscreen(e.target.checked)
                try {
                  if (e.target.checked) containerRef.current?.requestFullscreen?.()
                  else document.exitFullscreen?.()
                } catch {}
              }}
            />
            {fullscreen ? '退出沉浸' : '沉浸模式'}
          </label>
        </div>
      </div>
      {/* 任务与时长设置 */}
      {!fullscreen && (
        <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            placeholder="请输入本次专注的任务（可选），例如：撰写周报/整理数据"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />
          <div className="flex items-center gap-2">
            {([25, 50] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setCustomMinutes(m)
                  setSecondsLeft(m * 60)
                }}
                className={`px-3 py-2 rounded border text-sm ${customMinutes === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}
              >
                {m} 分钟
              </button>
            ))}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 dark:text-gray-300">自定义</span>
              <input
                type="number"
                min={5}
                max={180}
                value={customMinutes}
                onChange={(e) => {
                  const v = Math.max(5, Math.min(180, Number(e.target.value) || 25))
                  setCustomMinutes(v)
                  setSecondsLeft(v * 60)
                }}
                className="w-20 px-2 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold text-indigo-700 dark:text-indigo-200">
          {isBreak ? <Coffee className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
          {isBreak ? '休息阶段' : '专注阶段'}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">{customMinutes}/{breakMinutes} 分钟</div>
      </div>
      <div className={`${fullscreen ? 'text-7xl mb-6' : 'text-3xl mb-3'} font-mono text-center tracking-widest`}>{mm}:{ss}</div>
      <div className="flex items-center justify-center gap-3">
        <Button size={fullscreen ? 'lg' : 'sm'} variant={fullscreen ? 'secondary' : 'outline'} onClick={toggle}>
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 mr-1" /> 暂停
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1" /> 开始
            </>
          )}
        </Button>
        <Button size={fullscreen ? 'lg' : 'sm'} variant={fullscreen ? 'ghost' : 'ghost'} onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-1" /> 重置
        </Button>
      </div>

      {/* 复盘弹窗 */}
      {showReview && !isBreak && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">专注完成</div>
              <button onClick={()=>setShowReview(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">复盘一下：完成了什么？有何阻碍或备注？</div>
            <textarea className="w-full h-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-sm" value={reviewNotes} onChange={e=>setReviewNotes(e.target.value)} />
            <div className="flex items-center justify-between gap-2 mt-3">
              <label className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                <input id="write-to-daily" type="checkbox" className="accent-indigo-600" defaultChecked />
                完成后写入今日记录（备注写入“每日反思”）
              </label>
              <Button size="sm" variant="outline" onClick={()=>setShowReview(false)}>稍后</Button>
              <Button size="sm" onClick={async ()=>{
                setShowReview(false)
                try {
                  if (user) {
                    await FocusService.logSession(user.id, {
                      task_title: taskTitle || undefined,
                      planned_minutes: customMinutes,
                      actual_minutes: customMinutes,
                      notes: reviewNotes || undefined,
                      is_success: true,
                    })
                    // 积分：完成专注 +3
                    try { await PointsHistoryService.add(user.id, 3, 'manual', { note: '专注完成' }) } catch {}
                    // 写入今日记录（可选）
                    try {
                      const write = (document.getElementById('write-to-daily') as HTMLInputElement | null)?.checked
                      if (write) {
                        const today = getDateString()
                        const existing = await DailyRecordService.getRecordByDate(user.id, today)
                        if (existing) {
                          await DailyRecordService.updateRecord(existing.id, { reflections: `${existing.reflections || ''}\n[专注复盘] ${reviewNotes}`.trim() })
                        } else {
                          await DailyRecordService.createRecord(user.id, {
                            date: today,
                            mood_score: 5,
                            energy_level: 5,
                            productivity_score: 7,
                            reflections: `[专注复盘] ${reviewNotes}`,
                            gratitude_notes: '',
                            achievements: [],
                            challenges: [],
                            goals_completed: 0,
                          })
                        }
                      }
                    } catch (e) { console.error('write to daily failed', e) }
                  }
                } catch (e) { console.error('log focus failed', e) }
              }}>
                <CheckCircle2 className="w-4 h-4 mr-1"/> 完成
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


