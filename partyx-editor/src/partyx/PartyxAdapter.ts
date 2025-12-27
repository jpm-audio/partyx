import type { Application } from 'pixi.js'
import type { PreviewConfig } from '../preview/model/previewConfig'

export type PartyxPreviewHandle = {
  updateConfig?: (config: PreviewConfig) => void
  destroy?: () => void
}

/**
 * Loads the Partyx library at runtime and conditionally attaches it to Pixi.
 * All interactions are feature-detected to avoid hard coupling to the Partyx API surface.
 */
export class PartyxAdapter {
  private modulePromise: Promise<unknown | null> | null = null

  private async loadModule(): Promise<unknown | null> {
    if (!this.modulePromise) {
      this.modulePromise = import('partyx-library').catch((error) => {
        console.warn('[PartyxAdapter] Failed to load partyx-library', error)
        return null
      })
    }

    return this.modulePromise
  }

  /**
   * Attempts to attach Partyx to a Pixi Application. If the library does not expose
   * a compatible entry point, a no-op handle is returned to keep the preview stable.
   */
  public async attach(app: Application, config: PreviewConfig): Promise<PartyxPreviewHandle> {
    const module = await this.loadModule()
    if (!module) return {}

    const factory = this.selectFactory(module)
    if (!factory) return {}

    try {
      const maybeHandle = await factory({ app, config })
      return this.normalizeHandle(maybeHandle)
    } catch (error) {
      console.warn('[PartyxAdapter] Failed to attach Partyx preview', error)
      return {}
    }
  }

  private selectFactory(module: unknown):
    | ((args: { app: Application; config: PreviewConfig }) => unknown | Promise<unknown>)
    | null {
    const candidate = module as Record<string, unknown>
    const createPreview = candidate.createPreview
    const defaultExport = candidate.default

    if (typeof createPreview === 'function') {
      return createPreview as (args: { app: Application; config: PreviewConfig }) => unknown
    }

    if (typeof defaultExport === 'function') {
      return defaultExport as (args: { app: Application; config: PreviewConfig }) => unknown
    }

    return null
  }

  private normalizeHandle(handle: unknown): PartyxPreviewHandle {
    const maybeObject = handle as Record<string, unknown> | null | undefined
    if (!maybeObject) return {}

    const updateConfig = maybeObject.updateConfig
    const destroy = maybeObject.destroy

    return {
      updateConfig:
        typeof updateConfig === 'function'
          ? (config: PreviewConfig) => {
              try {
                ;(updateConfig as (config: PreviewConfig) => void)(config)
              } catch (error) {
                console.warn('[PartyxAdapter] updateConfig failed', error)
              }
            }
          : undefined,
      destroy:
        typeof destroy === 'function'
          ? () => {
              try {
                ;(destroy as () => void)()
              } catch (error) {
                console.warn('[PartyxAdapter] destroy failed', error)
              }
            }
          : undefined,
    }
  }
}

export default PartyxAdapter
