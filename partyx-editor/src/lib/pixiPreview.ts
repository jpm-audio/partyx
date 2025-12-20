import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import type { EditorConfig } from "../types";

type Particle = {
  spr: Sprite;
  vx: number;
  vy: number;
  age: number;
  life: number;
};

function hexToNumber(hex: string): number {
  const cleaned = hex.trim().replace(/^#/, "");
  const n = Number.parseInt(cleaned, 16);
  return Number.isFinite(n) ? n : 0xffffff;
}

export class PixiFallbackPreview {
  private app: Application;
  private root = new Container();
  private particles: Particle[] = [];
  private texture: Texture;
  private emitAcc = 0;
  private config: EditorConfig;
  private origin = { x: 0, y: 0 };

  constructor(app: Application, initial: EditorConfig) {
    this.app = app;
    this.config = initial;

    this.texture = this.makeCircleTexture();
    this.app.stage.addChild(this.root);

    this.resize();
    window.addEventListener("resize", this.resize);

    this.app.ticker.add(this.tick);
  }

  setConfig(next: EditorConfig) {
    this.config = next;
  }

  destroy() {
    window.removeEventListener("resize", this.resize);
    this.app.ticker.remove(this.tick);
    this.root.removeChildren();
    this.root.destroy({ children: true });
  }

  private resize = () => {
    const w = this.app.renderer.width;
    const h = this.app.renderer.height;
    this.origin.x = w * 0.5;
    this.origin.y = h * 0.6;
  };

  private makeCircleTexture(): Texture {
    const g = new Graphics()
      .circle(0, 0, 16)
      .fill({ color: 0xffffff, alpha: 1 });

    return this.app.renderer.generateTexture(g);
  }

  private spawnOne() {
    const { speed, spread, lifetime, size, tint } = this.config;

    const a = (-spread * 0.5) + Math.random() * spread; // alrededor de “hacia arriba”
    const base = -Math.PI / 2;
    const dir = base + a;

    const s = Sprite.from(this.texture);
    s.anchor.set(0.5);
    s.x = this.origin.x;
    s.y = this.origin.y;
    s.scale.set(Math.max(0.05, size / 32));
    s.tint = hexToNumber(tint);

    const v = speed * (0.75 + Math.random() * 0.5);
    const p: Particle = {
      spr: s,
      vx: Math.cos(dir) * v,
      vy: Math.sin(dir) * v,
      age: 0,
      life: Math.max(0.05, lifetime * (0.75 + Math.random() * 0.5)),
    };

    this.root.addChild(s);
    this.particles.push(p);
  }

  private tick = (tickerDt: number) => {
    const dt = tickerDt / 60; // pixi ticker: 1 ~ 60fps
    const { emissionRate } = this.config;

    this.emitAcc += emissionRate * dt;
    while (this.emitAcc >= 1) {
      this.emitAcc -= 1;
      this.spawnOne();
    }

    const g = 800; // gravedad px/s^2 (ligera)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;

      p.vy += g * dt;

      p.spr.x += p.vx * dt;
      p.spr.y += p.vy * dt;

      const t = Math.min(1, p.age / p.life);
      p.spr.alpha = 1 - t;

      if (p.age >= p.life) {
        p.spr.destroy();
        this.particles.splice(i, 1);
      }
    }
  };
}
