'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/Button'

// 简易海报导出：将内容绘制到Canvas并下载
export function ShareableImage({ title = '我的周报', content = '' }: { title?: string; content?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null)

  const download = () => {
    const canvas = ref.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'report.png'
    a.click()
  }

  const draw = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!
    const width = 1080
    const height = 1350
    canvas.width = width
    canvas.height = height
    // 背景
    const bg = ctx.createLinearGradient(0, 0, 0, height)
    bg.addColorStop(0, '#eef2ff')
    bg.addColorStop(1, '#ffffff')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, width, height)
    // 标题
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 48px system-ui, -apple-system, Segoe UI, Roboto'
    ctx.fillText(title, 60, 100)
    // 正文
    ctx.fillStyle = '#374151'
    ctx.font = '28px system-ui, -apple-system, Segoe UI, Roboto'
    const lines = (content || '').split('\n')
    let y = 160
    for (const line of lines) {
      wrapText(ctx, line, 60, y, width - 120, 36)
      y += 42
      if (y > height - 60) break
    }
    // 角标
    ctx.fillStyle = '#6b7280'
    ctx.font = '24px system-ui, -apple-system, Segoe UI, Roboto'
    const footer = 'Inner Compass AI'
    ctx.fillText(footer, 60, height - 40)
  }

  const onCanvasRef = (el: HTMLCanvasElement | null) => {
    ref.current = el
    if (el) draw(el)
  }

  return (
    <div className="space-y-3">
      <canvas ref={onCanvasRef} className="w-full max-w-2xl border rounded-xl bg-white shadow" />
      <div className="flex justify-end">
        <Button onClick={download} variant="outline">下载海报</Button>
      </div>
    </div>
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y)
      line = words[n] + ' '
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, y)
}


