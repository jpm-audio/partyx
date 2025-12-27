import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useProjectStore from '../../editor/store/useProjectStore'

function MainPage() {
  const navigate = useNavigate()
  const projects = useProjectStore((state) => state.projects)
  const loadProjects = useProjectStore((state) => state.loadProjects)
  const createProject = useProjectStore((state) => state.createProject)
  const deleteProject = useProjectStore((state) => state.deleteProject)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleCreate = () => {
    const project = createProject('New Project')
    navigate(`/project/${project.id}`)
  }

  const handleDelete = (id: string, name: string) => {
    const confirmed = window.confirm(`Delete project "${name}"?`)
    if (!confirmed) return
    deleteProject(id)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Dashboard</p>
            <h1 className="text-3xl font-bold">Partyx Editor</h1>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
          >
            New Project
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">
          {projects.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">No projects yet. Create a new project to get started.</div>
          ) : (
            <ul className="divide-y">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{project.name}</p>
                    <p className="text-sm text-slate-500">
                      Updated {new Date(project.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(project.id, project.name)}
                      className="rounded-lg border border-transparent px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default MainPage
