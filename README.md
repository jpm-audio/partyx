# Partyx

Partyx is a lightweight particle system for PixiJS v8, built with TypeScript.

## Features

- Fast and lightweight
- Modular and extensible architecture
- Designed for web games
- TypeScript-first API

## Installation

```bash
npm install partyx
```

> Note: `pixi.js` is a peer dependency. Your app/game must install and control the PixiJS version.

## Usage

```ts
import { ParticleEmitter, ParticleItem } from "partyx";
import { Texture, Rectangle } from "pixi.js";

const emitter = new ParticleEmitter({
  ClassType: ParticleItem,
  initialSize: 200,
  maxParticles: 2000,
  contentFrame: new Rectangle(0, 0, 800, 600),
  spawnOptions: {
    position: { x: [0, 800], y: [0, 600] },
    lifespan: [0.4, 1.2],
    onInit: (p) => {
      // Important: ParticleItem is created with Texture.EMPTY; set the texture here:
      p.texture = Texture.from("particle.png");
    },
  },
  updateOptions: {
    interval: 16,
    spawnRate: { value: 120 },
  },
});

emitter.start(true);
```

## Status

Work in progress. API may change until the first stable release.

## License

SEE LICENSE IN LICENSE.md