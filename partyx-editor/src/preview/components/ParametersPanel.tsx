import type { PreviewConfig } from '../model/previewConfig'
import useProjectStore from '../../editor/store/useProjectStore'

type ParametersPanelProps = {
  projectId: string
  config: PreviewConfig
}

function ParametersPanel({ projectId, config }: ParametersPanelProps) {
  const updateProjectConfig = useProjectStore((state) => state.updateProjectConfig)

  const handleBackgroundChange = (value: string) => {
    updateProjectConfig(projectId, { backgroundColor: value })
  }

  const handleSpeedChange = (value: number) => {
    updateProjectConfig(projectId, { rotationSpeed: value })
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Parameters</p>
        <p className="text-lg font-bold text-slate-900">Preview controls</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Background color
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              value={config.backgroundColor}
              onChange={(e) => handleBackgroundChange(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white"
            />
            <input
              type="text"
              value={config.backgroundColor}
              onChange={(e) => handleBackgroundChange(e.target.value)}
              className="flex-1 rounded border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Rotation speed
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={config.rotationSpeed}
              onChange={(e) => handleSpeedChange(Number.parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 text-xs text-slate-500">{config.rotationSpeed.toFixed(2)}x</div>
          </div>
        </label>
      </div>
    </div>
  )
}

export default ParametersPanel
