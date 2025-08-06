'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { DailyRecord, DailyRecordInput } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getDateString } from '@/lib/utils'

interface DailyRecordFormProps {
  onSubmit?: (record: DailyRecord) => void
}

export function DailyRecordForm({ onSubmit }: DailyRecordFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [existingRecord, setExistingRecord] = useState<DailyRecord | null>(null)
  
  const [formData, setFormData] = useState<DailyRecordInput>({
    date: getDateString(),
    mood_score: 5,
    energy_level: 5,
    productivity_score: 5,
    gratitude_notes: '',
    achievements: [],
    challenges: [],
    reflections: '',
    goals_completed: 0,
  })

  const [achievementInput, setAchievementInput] = useState('')
  const [challengeInput, setChallengeInput] = useState('')

  useEffect(() => {
    if (user) {
      loadExistingRecord()
    }
  }, [user, formData.date]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadExistingRecord = async () => {
    if (!user) return

    try {
      const record = await DailyRecordService.getRecordByDate(user.id, formData.date)
      if (record) {
        setExistingRecord(record)
        setFormData({
          date: record.date,
          mood_score: record.mood_score,
          energy_level: record.energy_level,
          productivity_score: record.productivity_score,
          gratitude_notes: record.gratitude_notes || '',
          achievements: record.achievements || [],
          challenges: record.challenges || [],
          reflections: record.reflections || '',
          goals_completed: record.goals_completed || 0,
        })
      } else {
        setExistingRecord(null)
      }
    } catch (error) {
      console.error('Error loading existing record:', error)
      // 如果是首次加载记录不存在的错误，不需要显示错误
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST116') {
        console.error('Unexpected error:', error)
      }
      setExistingRecord(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      let savedRecord: DailyRecord

      if (existingRecord) {
        console.log('Updating existing record:', existingRecord.id)
        savedRecord = await DailyRecordService.updateRecord(existingRecord.id, formData)
      } else {
        console.log('Creating new record for user:', user.id)
        savedRecord = await DailyRecordService.createRecord(user.id, formData)
      }

      console.log('Record saved successfully:', savedRecord)
      onSubmit?.(savedRecord)
    } catch (error) {
      console.error('Error saving record:', error)
      // 显示用户友好的错误信息
      alert('保存记录失败，请检查网络连接或稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const addAchievement = () => {
    if (achievementInput.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: [...(prev.achievements || []), achievementInput.trim()]
      }))
      setAchievementInput('')
    }
  }

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements?.filter((_, i) => i !== index) || []
    }))
  }

  const addChallenge = () => {
    if (challengeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        challenges: [...(prev.challenges || []), challengeInput.trim()]
      }))
      setChallengeInput('')
    }
  }

  const removeChallenge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges?.filter((_, i) => i !== index) || []
    }))
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {existingRecord ? '编辑今日记录' : '今日记录'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 日期选择 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">日期</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [color-scheme:dark]"
            />
          </div>

          {/* 评分区域 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                情绪评分 ({formData.mood_score}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.mood_score}
                onChange={(e) => setFormData(prev => ({ ...prev, mood_score: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>糟糕</span>
                <span>一般</span>
                <span>很好</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                精力水平 ({formData.energy_level}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.energy_level}
                onChange={(e) => setFormData(prev => ({ ...prev, energy_level: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>疲惫</span>
                <span>一般</span>
                <span>充沛</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                生产力 ({formData.productivity_score}/10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.productivity_score}
                onChange={(e) => setFormData(prev => ({ ...prev, productivity_score: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>低效</span>
                <span>一般</span>
                <span>高效</span>
              </div>
            </div>
          </div>

          {/* 完成目标数 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">今日完成目标数</label>
            <input
              type="number"
              min="0"
              value={formData.goals_completed}
              onChange={(e) => setFormData(prev => ({ ...prev, goals_completed: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 [color-scheme:dark]"
            />
          </div>

          {/* 成就列表 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">今日成就</label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="添加今日成就..."
                value={achievementInput}
                onChange={(e) => setAchievementInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                className="flex-1"
              />
              <Button type="button" onClick={addAchievement} className="min-w-[80px] whitespace-nowrap">
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {formData.achievements?.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <span>{achievement}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAchievement(index)}>
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 挑战列表 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">今日挑战</label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="添加今日挑战..."
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChallenge())}
                className="flex-1"
              />
              <Button type="button" onClick={addChallenge} className="min-w-[80px] whitespace-nowrap">
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {formData.challenges?.map((challenge, index) => (
                <div key={index} className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <span>{challenge}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeChallenge(index)}>
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 感恩记录 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">感恩记录</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              rows={3}
              placeholder="今天有什么值得感恩的事情..."
              value={formData.gratitude_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, gratitude_notes: e.target.value }))}
            />
          </div>

          {/* 每日反思 */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">每日反思</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              rows={4}
              placeholder="对今天的总结和反思..."
              value={formData.reflections}
              onChange={(e) => setFormData(prev => ({ ...prev, reflections: e.target.value }))}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? '保存中...' : existingRecord ? '更新记录' : '保存记录'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}