import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]
}

export function calculateStreak(records: Array<{ date: string }>): number {
  if (records.length === 0) return 0
  
  const sortedDates = records
    .map(r => new Date(r.date))
    .sort((a, b) => b.getTime() - a.getTime())
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const recordDate of sortedDates) {
    recordDate.setHours(0, 0, 0, 0)
    
    if (recordDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (recordDate.getTime() < currentDate.getTime()) {
      break
    }
  }
  
  return streak
}

export function calculateLevel(points: number): number {
  return Math.floor(points / 100) + 1
}

export function getPointsForNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints)
  return currentLevel * 100 - currentPoints
}