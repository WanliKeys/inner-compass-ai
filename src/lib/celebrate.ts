import confetti, { Options as ConfettiOptions } from 'canvas-confetti'

function getMotionScale(): number {
  try {
    const reduced = localStorage.getItem('motion:reduced')
    if (reduced === 'true') return 0.4
  } catch {}
  return 1
}

export function fireConfetti(options: ConfettiOptions & { particleCount?: number }) {
  const scale = getMotionScale()
  const particleCount = Math.max(0, Math.round((options.particleCount || 80) * scale))
  confetti({ ...options, particleCount })
}


