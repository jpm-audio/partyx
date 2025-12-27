import { useEffect, useRef } from 'react'
import type { PreviewConfig } from '../model/previewConfig'
import PixiAppHost from '../pixi/PixiAppHost'
import PartyxAdapter from '../../partyx/PartyxAdapter'

type PreviewCanvasProps = {
  config: PreviewConfig
}

function PreviewCanvas({ config }: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<PixiAppHost | null>(null)
  const adapterRef = useRef(new PartyxAdapter())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const host = new PixiAppHost(container, adapterRef.current)
    hostRef.current = host
    void host.start(config)

    return () => {
      host.destroy()
      hostRef.current = null
    }
  }, [])

  useEffect(() => {
    hostRef.current?.updateConfig(config)
  }, [config])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-slate-800/70 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
        Preview
      </div>
    </div>
  )
}

export default PreviewCanvas
