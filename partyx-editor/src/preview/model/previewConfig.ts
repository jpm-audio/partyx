export type PreviewConfig = {
  backgroundColor: string
  rotationSpeed: number
}

export const defaultPreviewConfig: PreviewConfig = {
  backgroundColor: '#0f172a',
  rotationSpeed: 1,
}

export const normalizePreviewConfig = (config: unknown): PreviewConfig => {
  const fallback = { ...defaultPreviewConfig }
  if (!config || typeof config !== 'object') return fallback

  const candidate = config as Record<string, unknown>
  const backgroundColor = typeof candidate.backgroundColor === 'string' ? candidate.backgroundColor : fallback.backgroundColor
  const rotationSpeedRaw = candidate.rotationSpeed
  const rotationSpeed = typeof rotationSpeedRaw === 'number' && Number.isFinite(rotationSpeedRaw) ? rotationSpeedRaw : fallback.rotationSpeed

  return {
    backgroundColor,
    rotationSpeed,
  }
}
