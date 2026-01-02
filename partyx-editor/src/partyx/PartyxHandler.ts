import type { Application } from 'pixi.js'
import { ParticleEmitter } from 'partyx-library'
import type { ParticleEmitterOptions } from 'partyx-library'
import type { PreviewConfig } from 'src/preview/model/previewConfig'

export class PartyxHandler {
  private emitter?: ParticleEmitter

  public async attach(app: Application, emitterOptions: PreviewConfig): Promise<ParticleEmitter> {
    if (this.emitter) {
      return this.emitter
    }
    this.emitter = new ParticleEmitter(emitterOptions)
    app.stage.addChild(this.emitter)

    return this.emitter
  }

  public async updateConfig(emitterOptions: PreviewConfig): Promise<void> {
    if (!this.emitter) {
      throw new Error('Emitter not initialized. Call attach() first.')
    }

    //Handle config updates here

    //this.emitter.updateConfig(emitterOptions);
  }

  public destroy(): void {
    if (this.emitter) {
      this.emitter.destroy()
      this.emitter = undefined
    }
  }
}
