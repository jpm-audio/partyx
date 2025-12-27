import type { Project } from '../model/projectTypes'

const STORAGE_KEY = 'partyx:projects'

const readAll = (): Project[] => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Project[]
  } catch (error) {
    console.error('Failed to parse projects from localStorage', error)
    return []
  }
}

const writeAll = (projects: Project[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export const list = (): Project[] => readAll()

export const get = (id: string): Project | null => readAll().find((p) => p.id === id) ?? null

export const create = (project: Project): Project => {
  const now = Date.now()
  const newProject: Project = {
    ...project,
    createdAt: project.createdAt ?? now,
    updatedAt: now,
  }

  const projects = readAll()
  projects.push(newProject)
  writeAll(projects)
  return newProject
}

export const update = (
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>> & { config?: unknown; name?: string },
): Project | null => {
  const projects = readAll()
  const index = projects.findIndex((p) => p.id === id)
  if (index === -1) return null

  const updated: Project = {
    ...projects[index],
    ...patch,
    updatedAt: Date.now(),
  }

  projects[index] = updated
  writeAll(projects)
  return updated
}

export const remove = (id: string): boolean => {
  const projects = readAll()
  const filtered = projects.filter((p) => p.id !== id)
  if (filtered.length === projects.length) return false

  writeAll(filtered)
  return true
}
