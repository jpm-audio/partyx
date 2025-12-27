import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import useProjectStore from '../../editor/store/useProjectStore'
import PreviewCanvas from '../../preview/components/PreviewCanvas'
import ParametersPanel from '../../preview/components/ParametersPanel'
import { normalizePreviewConfig } from '../../preview/model/previewConfig'

function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const projects = useProjectStore((state) => state.projects)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const setActiveProject = useProjectStore((state) => state.setActiveProject)

  useEffect(() => {
    if (projects.length === 0) {
      loadProjects()
    }
  }, [projects.length, loadProjects])

  useEffect(() => {
    setActiveProject(id ?? null)
    return () => setActiveProject(null)
  }, [id, setActiveProject])

  const project = useMemo(() => projects.find((p) => p.id === id) ?? null, [projects, id])
  const previewConfig = useMemo(() => normalizePreviewConfig(project?.config), [project?.config])

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="rounded-xl border bg-white px-8 py-10 shadow-sm">
          <p className="text-lg font-semibold">Project not found</p>
          <p className="mt-2 text-sm text-slate-600">The requested project could not be located.</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Back to projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Project</p>
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            Back
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-h-[420px]">
            <PreviewCanvas config={previewConfig} />
          </div>
          <div className="min-h-[420px]">
            <ParametersPanel projectId={project.id} config={previewConfig} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectPage
