import { nanoid } from 'nanoid'
import { create } from 'zustand'
import type { Project } from '../model/projectTypes'
import * as repo from '../persistence/localStorageRepo'
import {
  defaultPreviewConfig,
  normalizePreviewConfig,
  type PreviewConfig,
} from '../../preview/model/previewConfig'

type ProjectState = {
  projects: Project[]
  activeProjectId: string | null
  loadProjects: () => void
  createProject: (name?: string) => Project
  deleteProject: (id: string) => void
  setActiveProject: (id: string | null) => void
  updateProjectMeta: (id: string, patch: { name?: string }) => void
  updateProjectConfig: (id: string, patch: Partial<PreviewConfig>) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  loadProjects: () => {
    const loaded = repo.list()
    set((state) => ({
      projects: loaded,
      activeProjectId:
        state.activeProjectId && loaded.some((p) => p.id === state.activeProjectId)
          ? state.activeProjectId
          : null,
    }))
  },
  createProject: (name = 'New Project') => {
    const now = Date.now()
    const newProject: Project = {
      id: nanoid(),
      name,
      createdAt: now,
      updatedAt: now,
      config: { ...defaultPreviewConfig },
    }

    const saved = repo.create(newProject)
    set((state) => ({ projects: [...state.projects, saved], activeProjectId: saved.id }))
    return saved
  },
  deleteProject: (id: string) => {
    const removed = repo.remove(id)
    if (!removed) return

    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }))
  },
  setActiveProject: (id: string | null) => set({ activeProjectId: id }),
  updateProjectMeta: (id: string, patch: { name?: string }) => {
    const updated = repo.update(id, patch)
    if (!updated) return

    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }))
  },
  updateProjectConfig: (id: string, patch: Partial<PreviewConfig>) => {
    const current = get().projects.find((p) => p.id === id)
    if (!current) return

    const mergedConfig = {
      ...normalizePreviewConfig(current.config),
      ...patch,
    }

    const updated = repo.update(id, { config: mergedConfig })
    if (!updated) return

    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }))
  },
}))

export default useProjectStore
