'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DailyRecordService } from '@/lib/services/dailyRecordService'
import { DailyRecord } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DailyRecordForm } from './DailyRecordForm'
import { formatDate } from '@/lib/utils'
import { 
  Calendar, 
  Heart, 
  Zap, 
  TrendingUp, 
  Target,
  ChevronRight,
  Edit,
  Eye,
  RefreshCw
} from 'lucide-react'

export function RecordHistory() {
  const { user } = useAuth()
  const [records, setRecords] = useState<DailyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadRecords()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecords = async () => {
    if (!user) return

    setLoading(true)
    try {
      const recentRecords = await DailyRecordService.getRecentRecords(user.id, 30)
      setRecords(recentRecords)
    } catch (error) {
      console.error('Error loading records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditRecord = (record: DailyRecord) => {
    setSelectedRecord(record)
    setShowEditForm(true)
  }

  const handleViewRecord = (record: DailyRecord) => {
    setSelectedRecord(record)
    setShowViewModal(true)
  }

  const handleFormSubmit = () => {
    setShowEditForm(false)
    setSelectedRecord(null)
    loadRecords() // 重新加载记录列表
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            暂无记录
          </h3>
          <p className="text-gray-500">
            开始你的第一条成长记录吧！
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            历史记录 ({records.length}条)
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRecords}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
        
        {records.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDate(record.date)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(record.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        心情 {record.mood_score}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        精力 {record.energy_level}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        生产力 {record.productivity_score}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        目标 {record.goals_completed || 0}个
                      </span>
                    </div>
                  </div>

                  {/* 成就和挑战预览 */}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {record.achievements && record.achievements.length > 0 && (
                      <span>🎉 {record.achievements.length}个成就</span>
                    )}
                    {record.challenges && record.challenges.length > 0 && (
                      <span>💪 {record.challenges.length}个挑战</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewRecord(record)}
                    title="查看详情"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRecord(record)}
                    title="编辑记录"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑表单模态框 */}
      {showEditForm && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">编辑记录</h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowEditForm(false)
                    setSelectedRecord(null)
                  }}
                >
                  关闭
                </Button>
              </div>
              <DailyRecordForm onSubmit={handleFormSubmit} />
            </div>
          </div>
        </div>
      )}

      {/* 查看详情模态框 */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {formatDate(selectedRecord.date)} 的记录
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedRecord(null)
                  }}
                >
                  关闭
                </Button>
              </div>

              <div className="space-y-6">
                {/* 评分展示 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="font-medium">心情评分</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedRecord.mood_score}/10
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">精力水平</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {selectedRecord.energy_level}/10
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      <span className="font-medium">生产力</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedRecord.productivity_score}/10
                    </div>
                  </div>
                </div>

                {/* 目标完成数 */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className="font-medium">完成目标</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedRecord.goals_completed || 0} 个
                  </div>
                </div>

                {/* 成就列表 */}
                {selectedRecord.achievements && selectedRecord.achievements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">今日成就</h4>
                    <div className="space-y-2">
                      {selectedRecord.achievements.map((achievement, index) => (
                        <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          🎉 {achievement}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 挑战列表 */}
                {selectedRecord.challenges && selectedRecord.challenges.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">今日挑战</h4>
                    <div className="space-y-2">
                      {selectedRecord.challenges.map((challenge, index) => (
                        <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          💪 {challenge}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 感恩记录 */}
                {selectedRecord.gratitude_notes && (
                  <div>
                    <h4 className="font-medium mb-3">感恩记录</h4>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      {selectedRecord.gratitude_notes}
                    </div>
                  </div>
                )}

                {/* 每日反思 */}
                {selectedRecord.reflections && (
                  <div>
                    <h4 className="font-medium mb-3">每日反思</h4>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      {selectedRecord.reflections}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}