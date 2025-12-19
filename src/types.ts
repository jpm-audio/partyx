import type { Texture, ICanvas, Rectangle, Ticker } from "pixi.js";
import type { ParticleItem } from "./ParticleItem";

/**
 * Represents a range of values that can be either a fixed number or a range with min/max values.
 * When using an array, a random value between min and max will be selected.
 */
export type ParticleOptionRange = [number, number] | number;

/**
 * Function type for dynamic particle property calculations based on particle state and time.
 * @param particle - The particle instance
 * @param elapsedMS - Elapsed time in milliseconds since last update
 * @returns The calculated value for the property
 */
export type ParticleOptionFunction = (particle: ParticleItem, elapsedMS: number) => number;

/**
 * Callback function executed when a particle is initialized.
 * @param particle - The particle being initialized
 * @param contentFrame - Optional content frame for boundary checking
 */
export type ParticleOptionInitCallback = (particle: ParticleItem, contentFrame?: Rectangle) => void;

/**
 * Constructor type for pool items that implement the PoolItem interface.
 * Pool items are constructed with no args and initialized via `init(data)`.
 */
export type PoolItemConstructor<T extends PoolItem> = new () => T;

/**
 * Interface for pool items. Objects implementing this interface can be managed by the ParticlePool.
 */
export interface PoolItem {
    inPool: boolean;
    /**
     * Initializes the pool item with the provided data.
     * This method should be called by ParticlePool when retrieving an item from the pool.
     * @param data - Initialization data for the item
     */
    init(data: any): void;

    /**
     * Resets the pool item to its default state for reuse.
     * This method should called by ParticlePool when returning an item to the pool.
     */
    reset(): void;

    /**
     * Destroys the pool item, cleaning up resources and references.
     * This method should be called when ParticlePool is destroyed
     */
    destroy(): void;
}

export interface SpriteParticleItemOptions {
    frameRate: number;
    imageSources: (string | Texture | HTMLImageElement | HTMLVideoElement | ImageBitmap | ICanvas)[];
}

/**
 * Callback function executed during particle updates.
 * @param particle - The particle being updated
 * @param elapsedMS - Elapsed time in milliseconds since last update
 * @param contentFrame - Optional content frame for boundary checking
 */
export type ParticleOptionUpdateCallback = (
    particle: ParticleItem,
    elapsedMS: number,
    contentFrame?: Rectangle
) => void;

/**
 * Defines a property that transitions from a start value to an end value over the particle's lifetime.
 */
export interface ParticleOptionStartEnd {
    /** Initial value at particle spawn */
    start: ParticleOptionRange;
    /** Final value at particle death */
    end: ParticleOptionRange;
}

/**
 * Physics configuration for a single-dimensional property (like rotation).
 * Supports initial value, velocity, acceleration, and maximum velocity constraints.
 */
export interface ParticleVector1Physics {
    /** Initial value for the property */
    value: ParticleOptionRange;
    /** Rate of change per second (optional) */
    velocity?: ParticleOptionRange;
    /** Rate of velocity change per second (optional) */
    acceleration?: ParticleOptionRange;
    /** Maximum allowed velocity (optional, -1 for unlimited) */
    maxVelocity?: number;
}

/**
 * Physics configuration for a two-dimensional property (like position or scale).
 * Supports independent X/Y values or unified settings for both axes.
 */
export interface ParticleVector2Physics {
    /** Initial X coordinate/value */
    x: ParticleOptionRange;
    /** Initial Y coordinate/value */
    y: ParticleOptionRange;
    /** Unified velocity for both X and Y axes (optional) */
    velocity?: ParticleOptionRange;
    /** X-axis velocity (optional) */
    velocityX?: ParticleOptionRange;
    /** Y-axis velocity (optional) */
    velocityY?: ParticleOptionRange;
    /** Unified acceleration for both X and Y axes (optional) */
    acceleration?: ParticleOptionRange;
    /** X-axis acceleration (optional) */
    accelerationX?: ParticleOptionRange;
    /** Y-axis acceleration (optional) */
    accelerationY?: ParticleOptionRange;
    /** Maximum unified velocity for both axes (optional) */
    maxVelocity?: number;
    /** Maximum X-axis velocity (optional) */
    maxVelocityX?: number;
    /** Maximum Y-axis velocity (optional) */
    maxVelocityY?: number;
}

/**
 * Configuration options for individual particle spawn behavior.
 * Defines all the visual and physical properties a particle can have when created.
 */
export interface ParticleSpawnOptions {
    /** Position configuration with physics properties */
    position: ParticleVector2Physics;
    /** Scale configuration - can be uniform, start/end transition, or full 2D physics */
    scale?: ParticleOptionStartEnd | ParticleVector2Physics | ParticleOptionRange;
    /** Rotation configuration with physics properties */
    rotation?: ParticleVector1Physics;
    /** Alpha transparency - can be start/end transition or dynamic function */
    alpha?: ParticleOptionStartEnd | ParticleOptionFunction;
    /** Color tint - can be start/end transition, dynamic function, array of colors, or single color */
    color?: ParticleOptionStartEnd | ParticleOptionFunction | number[] | number;
    /** Callback executed when particle is initialized */
    onInit?: ParticleOptionInitCallback;
    /** Callback executed every frame during particle update */
    onUpdate?: ParticleOptionUpdateCallback;
    /** Particle lifetime in seconds */
    lifespan?: ParticleOptionRange;
}

/**
 * Configuration for particle emitter update behavior and environmental effects.
 * Controls emission rate, physics environment, and automatic spawn duration.
 */
export interface ParticleUpdateOptions {
    /** Number of particles spawned per second with physics properties */
    spawnRate: ParticleVector1Physics;
    /** Update interval in milliseconds for particle system updates */
    interval: number;
    /** Environmental physics affecting all particles (optional) */
    environment?: {
        /** Whether particle surface area affects environmental forces */
        affectSurface?: boolean;
        /** Downward gravitational acceleration */
        gravity?: number;
        /** Air resistance coefficient (opposes movement) */
        airResistance?: number;
        /** Horizontal wind force */
        windX?: number;
        /** Vertical wind force */
        windY?: number;
    };
    /** Automatic spawn duration in milliseconds - stops emitting after this time (optional) */
    spawnDuration?: number;
}

/**
 * Complete configuration for creating a particle emitter system.
 * Combines particle class type, pool settings, spawn behavior, and update behavior.
 */
export interface ParticleEmitterOptions {
    /** Constructor for the particle class to be used in the pool */
    ClassType: PoolItemConstructor<ParticleItem>;
    /** Initial number of particles to pre-allocate in the pool */
    initialSize: number;
    /** Maximum number of particles that can exist simultaneously (optional, -1 for unlimited) */
    maxParticles?: number;
    /** Configuration for individual particle spawn behavior */
    spawnOptions: ParticleSpawnOptions;
    /** Configuration for emitter update behavior and environment */
    updateOptions: ParticleUpdateOptions;
    /** Boundary rectangle for particle containment and out-of-bounds checking (optional) */
    contentFrame?: Rectangle;
    /** Ticker instance for managing update timing (optional). By default Ticker.shared is used */
    ticker?: Ticker;
}

/**
 * Data structure passed to particles during initialization.
 * Contains spawn configuration and boundary information.
 */
export interface ParticleEmitterInitData {
    /** Configuration for individual particle spawn behavior */
    spawnOptions: ParticleSpawnOptions;
    /** Boundary rectangle for particle containment (optional) */
    contentFrame?: Rectangle;
}
