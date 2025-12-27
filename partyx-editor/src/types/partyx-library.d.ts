declare module 'partyx-library' {
  import type { Application } from 'pixi.js'
  import type { PreviewConfig } from '../preview/model/previewConfig'

  export type PartyxPreviewFactoryArgs = { app: Application; config: PreviewConfig }
  export type PartyxPreviewHandle = {
    updateConfig?: (config: PreviewConfig) => void
    destroy?: () => void
  }

  /**
   * Optional factory to attach Partyx rendering into a Pixi application.
   * This is intentionally loose to allow the library to evolve without breaking the editor.
   */
  export const createPreview:
    | ((args: PartyxPreviewFactoryArgs) => PartyxPreviewHandle | Promise<PartyxPreviewHandle>)
    | undefined

  const _default: unknown
  export default _default
}
