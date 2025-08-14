'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GamificationService, Achievement } from '@/lib/services/gamificationService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Trophy,
  Star,
  Target,
  Flame,
  Award,
  TrendingUp,
  RefreshCw
} from 'lucide-react'
import { fireConfetti } from '@/lib/celebrate'
import { StreakCalendar } from './StreakCalendar'
import { PointsHistoryList } from './PointsHistoryList'

interface GamificationPanelProps {
  userId?: string
}

export function GamificationPanel({ userId }: GamificationPanelProps) {
  const { user, profile, updateProfile } = useAuth()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [pointsToNext, setPointsToNext] = useState(100)
  const [loading, setLoading] = useState(false)
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([])
  

  const currentUserId = userId || user?.id

  useEffect(() => {
    if (currentUserId) {
      loadGameData()
    }
  }, [currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  // 无调试模式逻辑

  const loadGameData = async () => {
    if (!currentUserId || loading) return

    setLoading(true)
    try {
      // 加载成就
      const userAchievements = await GamificationService.checkAchievements(currentUserId)
      
      // 检查新解锁的成就
      const previouslyUnlocked = achievements.filter(a => a.unlocked).map(a => a.id)
      const newUnlocked = userAchievements
        .filter(a => a.unlocked && !previouslyUnlocked.includes(a.id))
      
      if (newUnlocked.length > 0) {
        setNewAchievements(newUnlocked)
      }

      setAchievements(userAchievements)

      // 计算积分和等级
      const points = await GamificationService.calculateUserPoints(currentUserId)
      const level = GamificationService.getUserLevel(points)
      const toNext = GamificationService.getPointsToNextLevel(points)

      setUserPoints(points)
      setUserLevel(level)
      setPointsToNext(toNext)

      // 更新数据库中的用户统计数据（放到后台，不阻塞前端 loading）
      Promise.resolve()
        .then(() => GamificationService.updateUserGameStats(currentUserId))
        .catch((e) => console.error('Update game stats (background) failed:', e))

    } catch (error) {
      console.error('Error loading game data:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissNewAchievements = () => {
    setNewAchievements([])
  }

  // 成就解锁烟花动效
  useEffect(() => {
    if (newAchievements.length > 0) {
      // 连续三次不同角度与粒度的礼花
      const burst = (particleCount: number, spread: number, startVelocity: number) => {
        fireConfetti({
          particleCount,
          spread,
          startVelocity,
          origin: { x: 0.5, y: 0.3 }
        })
      }
      burst(60, 60, 35)
      setTimeout(() => burst(80, 80, 45), 200)
      setTimeout(() => burst(100, 100, 55), 400)
    }
  }, [newAchievements])

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)
  const levelProgressPercent = Math.max(0, Math.min(100, 100 - pointsToNext))
  const achievementsProgressPercent = achievements.length > 0
    ? Math.max(0, Math.min(100, (unlockedAchievements.length / achievements.length) * 100))
    : 0

  return (
    <div className="space-y-6">
      {/* 积分历史 */}
      {currentUserId && (
        <PointsHistoryList userId={currentUserId} />
      )}
      {/* 新成就通知 */}
      {newAchievements.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                    🎉 新成就解锁！
                  </h3>
                  <p className="text-yellow-600 dark:text-yellow-300">
                    {newAchievements.map(a => a.title).join(', ')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissNewAchievements}
              >
                知道了
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 用户统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">总积分</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.total_points || userPoints}
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">等级</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  Lv.{profile?.level || userLevel}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${levelProgressPercent}%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                还需 {pointsToNext} 积分升级
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">连续天数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.streak_count || 0}
                </p>
              </div>
              <Flame className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 成就系统 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              成就系统
            </CardTitle>
            <Button
              onClick={loadGameData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  刷新中...
                </>
              ) : (
                '刷新'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-8">
            <StreakCalendar />
          </div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">成就进度</span>
              <span className="text-sm text-gray-500">
                {unlockedAchievements.length} / {achievements.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${achievementsProgressPercent}%`
                }}
              ></div>
            </div>
          </div>

          {/* 已解锁成就 */}
          {unlockedAchievements.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 text-green-600">已解锁成就</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unlockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{achievement.title}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-green-600 font-medium">
                        +{achievement.points} 积分
                      </span>
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 未解锁成就 */}
          {lockedAchievements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-gray-600 dark:text-gray-300">待解锁成就</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-4 border border-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-75"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl grayscale">{achievement.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-gray-600 dark:text-gray-300">
                          {achievement.title}
                        </h5>
                        <p className="text-xs text-gray-500">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        +{achievement.points} 积分
                      </span>
                      <Target className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {achievements.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无成就数据，开始记录来解锁成就吧！</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}