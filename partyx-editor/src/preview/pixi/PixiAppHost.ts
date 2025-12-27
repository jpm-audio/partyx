import type { Ticker } from 'pixi.js'
import { Application, Graphics, Text } from 'pixi.js'
import type { PreviewConfig } from '../model/previewConfig'
import { defaultPreviewConfig } from '../model/previewConfig'
import type { PartyxPreviewHandle } from '../../partyx/PartyxAdapter'
import PartyxAdapter from '../../partyx/PartyxAdapter'

/**
 * Manages a Pixi Application lifecycle outside of React.
 */
export class PixiAppHost {
  private readonly container: HTMLElement
  private readonly partyxAdapter?: PartyxAdapter
  private app: Application | null = null
  private resizeObserver?: ResizeObserver
  private backgroundLayer?: Graphics
  private rotationShape?: Graphics
  private label?: Text
  private tickerHandler?: (deltaMS: number) => void
  private tickerListener?: (ticker: Ticker) => void
  private config: PreviewConfig = { ...defaultPreviewConfig }
  private partyxHandle?: PartyxPreviewHandle

  constructor(container: HTMLElement, partyxAdapter?: PartyxAdapter) {
    this.container = container
    this.partyxAdapter = partyxAdapter
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
      backgroundColor: this.toColorNumber(config.backgroundColor),
      antialias: true,
      autoDensity: true,
      resizeTo: this.container,
    })

    this.container.appendChild(app.canvas)
    this.app = app

    this.setupScene()
    await this.attachPartyx()
    this.setupResizeHandling()
  }

  /**
   * Stop the ticker without destroying the app.
   */
  public stop() {
    if (!this.app) return
    this.app.stop()
  }

  /**
   * Resize the renderer to the container and reposition content.
   */
  public resize() {
    if (!this.app) return

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

    if (this.partyxHandle?.updateConfig) {
      this.partyxHandle.updateConfig(config)
    } else if (this.app && this.partyxAdapter && !this.partyxHandle) {
      this.partyxHandle = await this.partyxAdapter.attach(this.app, this.config)
    }
  }

  /**
   * Destroy Pixi resources and observers.
   */
  public destroy() {
    this.stop()

    this.partyxHandle?.destroy?.()
    this.partyxHandle = undefined

    if (this.app && this.tickerListener) {
      this.app.ticker.remove(this.tickerListener)
    }
    this.tickerHandler = undefined
    this.tickerListener = undefined

    this.resizeObserver?.disconnect()
    this.resizeObserver = undefined

    if (this.app) {
      this.app.destroy({ removeView: true }, { children: true, texture: true, textureSource: true, context: true })
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

    this.tickerHandler = (deltaMS) => {
      if (this.rotationShape) {
        const speed = this.config.rotationSpeed ?? 1
        this.rotationShape.rotation += 0.0015 * deltaMS * speed
      }
    }

    this.tickerListener = (ticker) => {
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
    if (!this.app || !this.backgroundLayer) return

    const color = this.toColorNumber(this.config.backgroundColor)
    const { width, height } = this.app.screen

    this.backgroundLayer.clear()
    this.backgroundLayer.rect(0, 0, width, height).fill(color)
  }

  private applyConfigToScene() {
    this.updateBackground()
  }

  private toColorNumber(value: string): number {
    if (!value) return this.toColorNumber(defaultPreviewConfig.backgroundColor)
    const normalized = value.startsWith('#') ? value.slice(1) : value
    const parsed = Number.parseInt(normalized, 16)
    if (Number.isNaN(parsed)) {
      return this.toColorNumber(defaultPreviewConfig.backgroundColor)
    }

    return parsed
  }

  private async attachPartyx() {
    if (!this.app || !this.partyxAdapter) return
    this.partyxHandle = await this.partyxAdapter.attach(this.app, this.config)
  }
}

export default PixiAppHost
