import { ParticleEmitter } from "./ParticleEmitter";
import { ParticleOptionUpdateCallback, ParticleOptionFunction, ParticleEmitterInitData, PoolItem } from "./types";
import { Color, Rectangle, Sprite, Texture } from "pixi.js";

/**
 * Base particle class that extends PIXI Sprite with physics and lifecycle management.
 * Implements the PoolItem interface for efficient memory management through object pooling.
 * Supports position, scale, rotation, alpha, and color animations with various physics properties.
 */
export class ParticleItem extends Sprite implements PoolItem {
    /** Color handlers for smooth color transitions */
    protected _colorHandlers: [Color, Color] = [new Color(), new Color()];
    /** Random seed value for deterministic behavior */
    protected _seed: number = 0;
    /** Factor for environmental effects */
    protected _surfaceFactor: number = 1;

    public inPool: boolean = false;

    /** Mass of the particle for physics calculations */
    public mass: number = 1;
    /** Current velocity in pixels per second along X-axis */
    public velocityX: number = 0;
    /** Current velocity in pixels per second along Y-axis */
    public velocityY: number = 0;
    /** Current acceleration in pixels per second squared along X-axis */
    public accelerationX: number = 0;
    /** Current acceleration in pixels per second squared along Y-axis */
    public accelerationY: number = 0;

    /** Scale velocity along X-axis (scale units per second) */
    public scaleVelocityX: number = 0;
    /** Scale velocity along Y-axis (scale units per second) */
    public scaleVelocityY: number = 0;
    /** Scale acceleration along X-axis (scale units per second squared) */
    public scaleAccelerationX: number = 0;
    /** Scale acceleration along Y-axis (scale units per second squared) */
    public scaleAccelerationY: number = 0;

    /** Rotation velocity in radians per second */
    public rotationVelocity: number = 0;
    /** Rotation acceleration in radians per second squared */
    public rotationAcceleration: number = 0;

    /** Maximum velocity along X-axis (-1 for unlimited) */
    public maxVelocityX: number = -1;
    /** Maximum velocity along Y-axis (-1 for unlimited) */
    public maxVelocityY: number = -1;
    /** Maximum scale velocity along X-axis (-1 for unlimited) */
    public maxScaleVelocityX: number = -1;
    /** Maximum scale velocity along Y-axis (-1 for unlimited) */
    public maxScaleVelocityY: number = -1;
    /** Maximum rotation velocity (-1 for unlimited) */
    public maxRotationVelocity: number = -1;

    /** Initial alpha value when particle was created */
    public initAlpha: number = 0;
    /** Starting alpha value for alpha transitions */
    public alphaStart: number = -1;
    /** Ending alpha value for alpha transitions */
    public alphaEnd: number = -1;
    /** Function to calculate alpha dynamically */
    public alphaGetter: ParticleOptionFunction | null = null;
    /** Starting color value for color transitions */
    public colorStart: number | null = null;
    /** Ending color value for color transitions */
    public colorEnd: number | null = null;
    /** Function to calculate color dynamically */
    public colorGetter: ParticleOptionFunction | null = null;
    /** Starting scale value for scale transitions */
    public scaleStart: number | null = null;
    /** Ending scale value for scale transitions */
    public scaleEnd: number | null = null;
    /** Total lifetime of the particle in seconds */
    public lifespan: number = Infinity; // was 0 (could cause NaN when lifespan isn't provided)
    /** Current age of the particle in seconds */
    public currentLife: number = 0;
    /** Custom update callback function */
    public onUpdate: ParticleOptionUpdateCallback | null = null;

    /** Initial X position when particle was created */
    public initX: number = 0;
    /** Initial Y position when particle was created */
    public initY: number = 0;
    /** Initial X velocity when particle was created */
    public initVelocityX: number = 0;
    /** Initial Y velocity when particle was created */
    public initVelocityY: number = 0;
    /** Initial X scale when particle was created */
    public initScaleX: number = 0;
    /** Initial Y scale when particle was created */
    public initScaleY: number = 0;
    /** Initial rotation when particle was created */
    public initRotation: number = 0;
    /** Initial rotation velocity when particle was created */
    public initRotationVelocity: number = 0;

    /** Reuse buffer to avoid per-frame allocations in color transitions */
    protected _tmpColorTransition: Float32Array = new Float32Array(4);

    /**
     * Gets the random seed value for this particle.
     *
     * @returns The particle's seed value
     */
    public get seed() {
        return this._seed;
    }

    public get surfaceFactor() {
        return this._surfaceFactor;
    }

    /**
     * Creates a new particle with the specified texture.
     * Sets the anchor point to center (0.5, 0.5) for proper rotation and scaling.
     *
     * @param texture - The texture to use for this particle
     */
    constructor(texture: Texture = Texture.EMPTY) {
        super(texture);
        this.anchor.set(0.5);
    }

    /**
     * Initialize the particle. It is called from Pool::get method.
     * Sets up all particle properties based on the provided spawn options.
     *
     * @param data - Initialization data containing spawn options and content frame
     */
    public init(data: ParticleEmitterInitData) {
        // Pool-safety: avoid leaking state between reuses
        this.reset();

        const spawnOptions = data.spawnOptions;
        const contentFrame = data.contentFrame;

        this._seed = Math.random();

        // Position
        this.x = ParticleEmitter.randomFromRange(spawnOptions.position.x);
        this.y = ParticleEmitter.randomFromRange(spawnOptions.position.y);

        // Velocity
        if (spawnOptions.position.velocity) {
            const velocity = ParticleEmitter.randomFromRange(spawnOptions.position.velocity);
            this.velocityX = velocity;
            this.velocityY = velocity;
        } else {
            if (spawnOptions.position.velocityX) {
                this.velocityX = ParticleEmitter.randomFromRange(spawnOptions.position.velocityX);
            }
            if (spawnOptions.position.velocityY) {
                this.velocityY = ParticleEmitter.randomFromRange(spawnOptions.position.velocityY);
            }
        }

        // Acceleration
        if (spawnOptions.position.acceleration) {
            const acceleration = ParticleEmitter.randomFromRange(spawnOptions.position.acceleration);
            this.accelerationX = acceleration;
            this.accelerationY = acceleration;
        } else {
            if (spawnOptions.position.accelerationX) {
                this.accelerationX = ParticleEmitter.randomFromRange(spawnOptions.position.accelerationX);
            }
            if (spawnOptions.position.accelerationY) {
                this.accelerationY = ParticleEmitter.randomFromRange(spawnOptions.position.accelerationY);
            }
        }

        // Max Velocities
        if (spawnOptions.position.maxVelocity) {
            this.maxVelocityX = spawnOptions.position.maxVelocity;
            this.maxVelocityY = spawnOptions.position.maxVelocity;
        } else {
            if (spawnOptions.position.maxVelocityX) {
                this.maxVelocityX = spawnOptions.position.maxVelocityX;
            }
            if (spawnOptions.position.maxVelocityY) {
                this.maxVelocityY = spawnOptions.position.maxVelocityY;
            }
        }

        // Scale
        if (spawnOptions.scale) {
            //ParticleOptionRange?
            if (Array.isArray(spawnOptions.scale) || typeof spawnOptions.scale === "number") {
                const scale = ParticleEmitter.randomFromRange(spawnOptions.scale);
                this.scale.x = scale;
                this.scale.y = scale;
            } else if (spawnOptions.scale && "start" in spawnOptions.scale && "end" in spawnOptions.scale) {
                this.scaleStart = ParticleEmitter.randomFromRange(spawnOptions.scale.start);
                this.scaleEnd = ParticleEmitter.randomFromRange(spawnOptions.scale.end);
                // Set initial visual state immediately
                this.scale.set(this.scaleStart);
            }
            // ParticleVector2Physics?
            else if (spawnOptions.scale && "x" in spawnOptions.scale && "y" in spawnOptions.scale) {
                this.scale.x = ParticleEmitter.randomFromRange(spawnOptions.scale.x);
                this.scale.y = ParticleEmitter.randomFromRange(spawnOptions.scale.y);
                if (spawnOptions.scale.velocity) {
                    const scaleVelocity = ParticleEmitter.randomFromRange(spawnOptions.scale.velocity);
                    this.scaleVelocityX = scaleVelocity;
                    this.scaleVelocityY = scaleVelocity;
                } else {
                    if (spawnOptions.scale.velocityX) {
                        this.scaleVelocityX = ParticleEmitter.randomFromRange(spawnOptions.scale.velocityX);
                    }
                    if (spawnOptions.scale.velocityY) {
                        this.scaleVelocityY = ParticleEmitter.randomFromRange(spawnOptions.scale.velocityY);
                    }
                }

                if (spawnOptions.scale.acceleration) {
                    const scaleAcceleration = ParticleEmitter.randomFromRange(spawnOptions.scale.acceleration);
                    this.scaleAccelerationX = scaleAcceleration;
                    this.scaleAccelerationY = scaleAcceleration;
                } else {
                    if (spawnOptions.scale.accelerationX) {
                        this.scaleAccelerationX = ParticleEmitter.randomFromRange(spawnOptions.scale.accelerationX);
                    }
                    if (spawnOptions.scale.accelerationY) {
                        this.scaleAccelerationY = ParticleEmitter.randomFromRange(spawnOptions.scale.accelerationY);
                    }
                }

                if (spawnOptions.scale.maxVelocity) {
                    this.maxScaleVelocityX = spawnOptions.scale.maxVelocity;
                    this.maxScaleVelocityY = spawnOptions.scale.maxVelocity;
                } else {
                    if (spawnOptions.scale.maxVelocityX) {
                        this.maxScaleVelocityX = spawnOptions.scale.maxVelocityX;
                    }
                    if (spawnOptions.scale.maxVelocityY) {
                        this.maxScaleVelocityY = spawnOptions.scale.maxVelocityY;
                    }
                }
            }
            this.updateSurfaceFactor();
        }

        // Rotation
        if (spawnOptions.rotation) {
            this.rotation = ParticleEmitter.randomFromRange(spawnOptions.rotation.value);
            if (spawnOptions.rotation.velocity) {
                this.rotationVelocity = ParticleEmitter.randomFromRange(spawnOptions.rotation.velocity);
            }
            if (spawnOptions.rotation.acceleration) {
                this.rotationAcceleration = ParticleEmitter.randomFromRange(spawnOptions.rotation.acceleration);
            }
            if (spawnOptions.rotation.maxVelocity) {
                this.maxRotationVelocity = spawnOptions.rotation.maxVelocity;
            }
        }

        // Alpha
        if (spawnOptions.alpha) {
            if (typeof spawnOptions.alpha === "function") {
                this.alphaGetter = spawnOptions.alpha;
            } else {
                this.alphaStart = ParticleEmitter.randomFromRange(spawnOptions.alpha.start);
                this.alphaEnd = ParticleEmitter.randomFromRange(spawnOptions.alpha.end);
                // Set initial visual state immediately
                if (this.alphaStart > -1) this.alpha = this.alphaStart;
            }
        }

        // Color
        if (spawnOptions.color) {
            if (typeof spawnOptions.color === "function") {
                this.colorGetter = spawnOptions.color;
            } else if (Array.isArray(spawnOptions.color)) {
                this.tint = spawnOptions.color[Math.floor(this._seed * spawnOptions.color.length)];
            } else if (typeof spawnOptions.color === "number") {
                this.tint = spawnOptions.color;
            } else if (spawnOptions.color.start && spawnOptions.color.end) {
                this.colorStart = ParticleEmitter.randomFromRange(spawnOptions.color.start);
                this.colorEnd = ParticleEmitter.randomFromRange(spawnOptions.color.end);
                // Set initial visual state immediately
                this._colorHandlers[0].value = this.colorStart;
                this.tint = this._colorHandlers[0];
            }
        }

        // Lifespan
        if (spawnOptions.lifespan) {
            this.lifespan = ParticleEmitter.randomFromRange(spawnOptions.lifespan);
        } else {
            this.lifespan = Infinity;
        }
        this.currentLife = 0;

        // On Init
        if (spawnOptions.onInit) {
            spawnOptions.onInit(this, contentFrame);
        }

        // If onInit changed texture/scale, refresh surface factor
        this.updateSurfaceFactor();

        // Capture "created" state after onInit may have touched it
        this.initAlpha = this.alpha;
        this.initX = this.x;
        this.initY = this.y;
        this.initVelocityX = this.velocityX;
        this.initVelocityY = this.velocityY;
        this.initScaleX = this.scale.x;
        this.initScaleY = this.scale.y;
        this.initRotation = this.rotation;
        this.initRotationVelocity = this.rotationVelocity;

        // On Update
        if (spawnOptions.onUpdate) {
            this.onUpdate = spawnOptions.onUpdate;
        }
    }

    public updateSurfaceFactor() {
        this._surfaceFactor = (this.texture.width * this.texture.height * this.scale.x * this.scale.y) / 1000;
    }

    /**
     * Updates the particle's physics, visual properties, and lifecycle.
     * Called every frame by the particle emitter during the update loop.
     *
     * @param elapsedMS - The elapsed time in milliseconds since last update
     * @param contentFrame - Optional content frame for boundary checking
     */
    public updatePhysics(elapsedMS: number, contentFrame?: Rectangle) {
        const elapsedSec = elapsedMS / 1000;

        // Lifespan (safe even when lifespan is 0/invalid)
        const safeLifespan = this.lifespan > 0 ? this.lifespan : Infinity;
        this.currentLife += elapsedSec;
        const lifePercent = safeLifespan === Infinity ? 0 : Math.min(this.currentLife / safeLifespan, 1);

        // Update Position
        this.x += this.velocityX * elapsedSec;
        this.y += this.velocityY * elapsedSec;
        this.velocityX += this.accelerationX * elapsedSec;
        this.velocityY += this.accelerationY * elapsedSec;

        // Update Scale
        if (this.scaleStart !== null && this.scaleEnd !== null) {
            this.scale.x = this.scaleStart + (this.scaleEnd - this.scaleStart) * lifePercent;
            this.scale.y = this.scaleStart + (this.scaleEnd - this.scaleStart) * lifePercent;
            this.updateSurfaceFactor();
        } else {
            this.scale.x += this.scaleVelocityX * elapsedSec;
            this.scale.y += this.scaleVelocityY * elapsedSec;
            this.scaleVelocityX += this.scaleAccelerationX * elapsedSec;
            this.scaleVelocityY += this.scaleAccelerationY * elapsedSec;
            this.updateSurfaceFactor();
        }

        // Update Rotation
        this.rotation += this.rotationVelocity * elapsedSec;
        this.rotationVelocity += this.rotationAcceleration * elapsedSec;

        // Update Alpha
        if (this.alphaGetter) {
            this.alpha = this.alphaGetter(this, elapsedMS);
        } else if (this.alphaStart > -1 && this.alphaEnd > -1) {
            this.alpha = this.alphaStart + (this.alphaEnd - this.alphaStart) * lifePercent;
        }

        // Update Color
        if (this.colorGetter) {
            this._colorHandlers[0].value = this.colorGetter(this, elapsedMS);
            this.tint = this._colorHandlers[0];
        } else if (this.colorStart !== null && this.colorEnd !== null) {
            this._colorHandlers[0].value = this.colorStart;
            this._colorHandlers[1].value = this.colorEnd;

            // Avoid allocating a new array every frame
            this._tmpColorTransition[0] =
                this._colorHandlers[0].red + (this._colorHandlers[1].red - this._colorHandlers[0].red) * lifePercent;
            this._tmpColorTransition[1] =
                this._colorHandlers[0].green +
                (this._colorHandlers[1].green - this._colorHandlers[0].green) * lifePercent;
            this._tmpColorTransition[2] =
                this._colorHandlers[0].blue + (this._colorHandlers[1].blue - this._colorHandlers[0].blue) * lifePercent;
            this._tmpColorTransition[3] =
                this._colorHandlers[0].alpha +
                (this._colorHandlers[1].alpha - this._colorHandlers[0].alpha) * lifePercent;

            this._colorHandlers[0].value = this._tmpColorTransition;
            this.tint = this._colorHandlers[0];
        }

        // Max Velocities (clamp by magnitude so it works with negative speeds too)
        this.velocityX = ParticleItem.clampAbs(this.velocityX, this.maxVelocityX);
        this.velocityY = ParticleItem.clampAbs(this.velocityY, this.maxVelocityY);
        this.scaleVelocityX = ParticleItem.clampAbs(this.scaleVelocityX, this.maxScaleVelocityX);
        this.scaleVelocityY = ParticleItem.clampAbs(this.scaleVelocityY, this.maxScaleVelocityY);
        this.rotationVelocity = ParticleItem.clampAbs(this.rotationVelocity, this.maxRotationVelocity);

        // On Update
        if (this.onUpdate) {
            this.onUpdate(this, elapsedMS, contentFrame);
        }
    }

    /**
     * Reset all particle values to default. It is called from Pool::return method.
     * Prepares the particle for reuse by clearing all state and returning to initial values.
     */
    public reset() {
        this.x = 0;
        this.y = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.accelerationX = 0;
        this.accelerationY = 0;
        this.scale.x = 1;
        this.scale.y = 1;
        this.scaleVelocityX = 0;
        this.scaleVelocityY = 0;
        this.scaleAccelerationX = 0;
        this.scaleAccelerationY = 0;
        this.rotation = 0;
        this.rotationVelocity = 0;
        this.rotationAcceleration = 0;
        this.maxVelocityX = -1;
        this.maxVelocityY = -1;
        this.maxScaleVelocityX = -1;
        this.maxScaleVelocityY = -1;
        this.maxRotationVelocity = -1;
        this.alphaStart = -1;
        this.alphaEnd = -1;
        this.alphaGetter = null;
        this.alpha = 1;
        this.tint = 0xffffff;

        // Clear transitions/callbacks to avoid state leaking across pooled reuses
        this.onUpdate = null;

        this.colorStart = null;
        this.colorEnd = null;
        this.colorGetter = null;

        this.scaleStart = null;
        this.scaleEnd = null;

        this.lifespan = Infinity;
        this.currentLife = 0;

        this.initAlpha = 0;
        this.initX = 0;
        this.initY = 0;
        this.initVelocityX = 0;
        this.initVelocityY = 0;
        this.initScaleX = 0;
        this.initScaleY = 0;
        this.initRotation = 0;
        this.initRotationVelocity = 0;
    }

    private static clampAbs(value: number, maxAbs: number) {
        if (maxAbs < 0) return value;
        if (value > maxAbs) return maxAbs;
        if (value < -maxAbs) return -maxAbs;
        return value;
    }
}
