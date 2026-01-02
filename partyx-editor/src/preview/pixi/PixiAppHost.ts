import type { Ticker } from 'pixi.js'
import { Application, Graphics, Text } from 'pixi.js'
import type { PreviewConfig } from '../model/previewConfig'
import { defaultPreviewConfig } from '../model/previewConfig'
import { PartyxHandler } from 'src/partyx/PartyxHandler'

/**
 * Manages a Pixi Application lifecycle outside of React.
 */
export class PixiAppHost {
  private readonly container: HTMLElement
  private partyxHandler: PartyxHandler
  private app: Application | null = null
  private resizeObserver?: ResizeObserver
  private backgroundLayer?: Graphics
  private rotationShape?: Graphics
  private label?: Text
  private tickerHandler?: (deltaMS: number) => void
  private tickerListener?: (ticker: Ticker) => void
  private config: PreviewConfig = { ...defaultPreviewConfig }

  constructor(container: HTMLElement) {
    this.container = container
    this.partyxHandler = new PartyxHandler()
  }

  /**
   * Initialize and start rendering the Pixi scene.
   */
  public async start(config: PreviewConfig) {
    if (this.app) {
      await this.updateConfig(config)
      return
    }

    this.config = config

    const app = new Application()
    await app.init({
      backgroundColor: config.backgroundColor,
      antialias: true,
      autoDensity: true,
      resizeTo: this.container,
    })

    this.container.appendChild(app.canvas)
    this.app = app

    this.setupScene()
    await this.partyxHandler.attach(this.app, this.config)
    this.setupResizeHandling()
  }

  /**
   * Stop the ticker without destroying the app.
   */
  public stop() {
    if (!this.app) {
      return
    }
    this.app.stop()
  }

  /**
   * Resize the renderer to the container and reposition content.
   */
  public resize() {
    if (!this.app) {
      return
    }

    const { width, height } = this.container.getBoundingClientRect()
    this.app.renderer.resize(width, height)
    this.positionScene()
  }

  /**
   * Update rendering options based on config changes and forward to Partyx if attached.
   */
  public async updateConfig(config: PreviewConfig) {
    this.config = config
    this.applyConfigToScene()

    await this.partyxHandler.updateConfig(config)
  }

  /**
   * Destroy Pixi resources and observers.
   */
  public destroy() {
    this.stop()

    this.partyxHandler.destroy()
    //this.partyxHandler = undefined

    if (this.app && this.tickerListener) {
      this.app.ticker.remove(this.tickerListener)
    }
    this.tickerHandler = undefined
    this.tickerListener = undefined

    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined

    if (this.app) {
      this.app.destroy(
        { removeView: true },
        { children: true, texture: true, textureSource: true, context: true },
      )
      this.app = null
    }

    this.rotationShape = undefined
  }

  private setupScene() {
    if (!this.app) return

    this.backgroundLayer = new Graphics()

    const shape = new Graphics()
    shape.circle(0, 0, 60).fill(0x6366f1)
    shape.alpha = 0.9

    const label = new Text({
      text: 'Pixi Preview',
      style: {
        fill: '#e2e8f0',
        fontSize: 22,
        fontWeight: '700',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      },
    })
    label.anchor.set(0.5)

    this.app.stage.addChild(this.backgroundLayer)
    this.rotationShape = shape
    this.label = label

    this.app.stage.addChild(shape)
    this.app.stage.addChild(label)

    this.tickerHandler = deltaMS => {
      if (this.rotationShape) {
        const speed = this.config.rotationSpeed ?? 1
        this.rotationShape.rotation += 0.0015 * deltaMS * speed
      }
    }

    this.tickerListener = ticker => {
      this.tickerHandler?.(ticker.deltaMS)
    }

    this.app.ticker.add(this.tickerListener)

    this.positionScene()
    this.applyConfigToScene()
  }

  private positionScene() {
    if (!this.app) return

    const centerX = this.app.screen.width / 2
    const centerY = this.app.screen.height / 2

    if (this.rotationShape) {
      this.rotationShape.position.set(centerX, centerY - 20)
    }

    if (this.label) {
      this.label.position.set(centerX, centerY + 90)
    }

    this.updateBackground()
  }

  private setupResizeHandling() {
    this.resize()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.container)
  }

  private updateBackground() {
    if (!this.app || !this.backgroundLayer) {
      return
    }

    const { width, height } = this.app.screen

    this.backgroundLayer.clear()
    this.backgroundLayer.rect(0, 0, width, height).fill(this.config.backgroundColor)
  }

  private applyConfigToScene() {
    this.updateBackground()
  }
}

export default PixiAppHost
