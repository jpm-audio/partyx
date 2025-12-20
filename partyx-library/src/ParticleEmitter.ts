import { Rectangle, PointData, DestroyOptions, ParticleContainer, Ticker } from "pixi.js";
import { ParticleItem } from "./ParticleItem";
import { ParticleEmitterOptions, ParticleSpawnOptions, ParticleUpdateOptions } from "./types";
import { ParticlePool } from "./ParticlePool";

/**
 * Particle emitter system that manages the creation, update, and destruction of particles.
 * Extends ParticleContainer for optimal rendering performance and provides comprehensive
 * particle lifecycle management with physics simulation and environmental effects.
 */
export class ParticleEmitter extends ParticleContainer {
    /** Collection of easing functions for smooth animations */
    public static easing = {
        parabolic: (point: number, distance: number) => {
            return 1 - Math.pow(point / distance - 1, 2);
        },
        sinusoidal: (point: number, distance: number) => {
            return Math.sin(((point / distance - 1) * Math.PI) / 2);
        },
        exponential: (point: number, distance: number) => {
            return Math.pow(point / distance, 2);
        },
        circular: (point: number, distance: number) => {
            return 1 - Math.sqrt(1 - Math.pow(point / distance - 1, 2));
        },
    };

    /** Object pool for efficient particle memory management */
    protected _pool: ParticlePool<ParticleItem>;
    /** Whether the emitter is connected to the game clock for updates */
    protected _clockConnected: boolean = false;
    /** Ticker instance for managing update timing */
    protected _ticker: Ticker;
    /** Boundary rectangle for particle containment */
    protected _contentFrame: Rectangle | null = null;
    /** Configuration for individual particle spawn behavior */
    protected _spawnOptions: ParticleSpawnOptions;
    /** Configuration for emitter update behavior and environment */
    protected _updateOptions: ParticleUpdateOptions;
    /** Accumulated time since last update cycle */
    protected _updateElapsed: number = 0;
    /** Accumulated time since last spawn attempt */
    protected _spawnElapsed: number = 0;
    /** Current spawn interval in milliseconds */
    protected _spawnInterval: number = 0;
    /** Current spawn rate (particles per second) */
    protected _spawnRate: number = 0;
    /** Spawn rate velocity (particles per second per second) */
    protected _spawnRateVelocity: number = 0;
    /** Spawn rate acceleration (particles per second per second^2) */
    protected _spawnRateAcceleration: number = 0;
    /** Max abs spawn rate velocity (-1 unlimited) */
    protected _spawnRateMaxVelocity: number = -1;
    /** Accumulated time for automatic spawn duration */
    protected _spawnDurationElapsed: number = 0;
    /** Whether the emitter is currently running */
    protected _isRunning: boolean = false;
    /** Whether the emitter is currently paused */
    protected _isPaused: boolean = false;

    /** Duration in milliseconds for automatic spawn termination */
    public spawnDuration: number = 0;
    /** Whether the emitter should spawn new particles */
    public spawn: boolean = false;
    /** Environmental physics settings affecting all particles */
    protected _environment = {
        affectSurface: false,
        gravity: 0,
        airResistance: 0,
        windX: 0,
        windY: 0,
    };

    /**
     * Sets the content frame for particle boundary checking.
     *
     * @param frame - Rectangle defining the particle containment area
     */
    public set contentFrame(frame: Rectangle) {
        this._contentFrame = frame;
    }

    /**
     * Gets the current content frame.
     *
     * @returns The current content frame or null if not set
     */
    public get contentFrame(): Rectangle | null {
        return this._contentFrame;
    }

    /**
     * Gets the current environment settings.
     *
     * @returns The environment configuration object
     */
    public get environment() {
        return this._environment;
    }

    /**
     * Sets the wind force affecting particles.
     *
     * @param value - Point data containing X and Y wind forces
     */
    public set wind(value: PointData) {
        this._environment.windX = value.x;
        this._environment.windY = value.y;
    }

    /**
     * Sets the gravity force affecting particles.
     *
     * @param value - Gravity acceleration value (positive for downward)
     */
    public set gravity(value: number) {
        this._environment.gravity = value;
    }

    /**
     * Sets the air resistance coefficient affecting particles.
     *
     * @param value - Air resistance coefficient (higher values = more resistance)
     */
    public set airResistance(value: number) {
        this._environment.airResistance = value;
    }

    /**
     * Sets whether environmental forces should be affected by particle surface area.
     *
     * @param value - True if surface area should affect environmental forces
     */
    public set affectSurface(value: boolean) {
        this._environment.affectSurface = value;
    }

    /**
     * Gets whether the emitter is currently running.
     *
     * @returns True if the emitter is running
     */
    public get isRunning() {
        return this._isRunning;
    }

    /**
     * Gets whether the emitter is currently paused.
     *
     * @returns True if the emitter is paused
     */
    public get isPaused() {
        return this._isPaused;
    }

    /**
     * Gets whether the emitter is currently emitting new particles.
     *
     * @returns True if the emitter is spawning particles
     */
    public get isEmitting() {
        return this.spawn;
    }

    /**
     * Gets the maximum number of particles allowed in the pool.
     */
    public get maxPoolSize(): number {
        return this._pool.maxPoolSize;
    }

    /**
     * Sets the maximum number of particles allowed in the pool.
     */
    public set maxPoolSize(value: number) {
        this._pool.maxPoolSize = value;
    }

    /**
     * Creates a new particle emitter with the specified configuration.
     * Initializes the particle pool, environment settings, and spawn parameters.
     *
     * @param options - Complete configuration for the particle emitter
     * @throws Error if neither lifespan nor contentFrame is defined
     */
    constructor(options: ParticleEmitterOptions) {
        super();

        if (!options.spawnOptions.lifespan && !options.contentFrame) {
            throw new Error("ParticleEmitter - You must define a lifespan or a contentFrame");
        }

        // Create Pool
        this._pool = new ParticlePool(options.ClassType, options.initialSize, options.maxParticles);

        // Content Frame
        if (options.contentFrame) {
            this._contentFrame = options.contentFrame;
        }

        // Spawn and Update options
        this._spawnOptions = options.spawnOptions;
        this._updateOptions = options.updateOptions;

        // Environment
        if (options.updateOptions.environment) {
            this._environment.gravity = options.updateOptions.environment.gravity || 0;
            this._environment.airResistance = options.updateOptions.environment.airResistance || 0;
            this._environment.windX = options.updateOptions.environment.windX || 0;
            this._environment.windY = options.updateOptions.environment.windY || 0;
            this._environment.affectSurface = options.updateOptions.environment.affectSurface || false;
        }

        // Spawn Duration
        if (options.updateOptions.spawnDuration) {
            this.spawnDuration = options.updateOptions.spawnDuration;
        }

        // Ticker
        this._ticker = options.ticker || Ticker.shared;

        this.reset();
    }

    /**
     * Generates a random value from a range specification.
     * If the range is an array, returns a random value between min and max.
     * If the range is a number, returns that number directly.
     *
     * @param range - Either a fixed number or [min, max] array
     * @returns A random value within the specified range
     */
    public static randomFromRange(range: [number, number] | number = 0) {
        if (Array.isArray(range)) {
            return Math.random() * (range[1] - range[0]) + range[0];
        } else {
            return range;
        }
    }

    protected _recalcSpawnInterval() {
        // Avoid division by zero / negative rates
        const rate = Math.max(this._spawnRate, 0);
        this._spawnInterval = rate > 0 ? 1000 / rate : 0;
    }

    protected _updateSpawnRate(elapsedMS: number) {
        const elapsedSec = elapsedMS / 1000;

        // Integrate velocity (clamp by magnitude)
        if (this._spawnRateAcceleration) {
            this._spawnRateVelocity += this._spawnRateAcceleration * elapsedSec;
        }
        if (this._spawnRateMaxVelocity >= 0) {
            const max = this._spawnRateMaxVelocity;
            this._spawnRateVelocity = Math.max(-max, Math.min(max, this._spawnRateVelocity));
        }

        // Integrate rate
        if (this._spawnRateVelocity) {
            this._spawnRate += this._spawnRateVelocity * elapsedSec;
            if (this._spawnRate < 0) this._spawnRate = 0;
        }

        this._recalcSpawnInterval();
    }

    /**
     * Handles particle spawning based on spawn rate and timing.
     * Checks spawn conditions and creates new particles when appropriate.
     *
     * @param elapsedMS - Elapsed time in milliseconds since last spawn check
     */
    protected _spawn(elapsedMS: number) {
        if (!this.spawn || !this._spawnInterval) return;

        this._spawnElapsed += elapsedMS;
        if (this._spawnElapsed < this._spawnInterval) return;

        const numSpawns = Math.floor(this._spawnElapsed / this._spawnInterval);
        if (numSpawns <= 0) return;

        for (let i = 0; i < numSpawns; i++) this._spawnParticle();

        this._spawnElapsed = this._spawnElapsed % this._spawnInterval;
        // NOTE: interval is derived from current _spawnRate (no random reset here)
    }

    /**
     * Creates and initializes a new particle from the pool.
     * Adds the particle to the display list for rendering.
     */
    protected _spawnParticle() {
        // Spawn a new particle from the pool
        const particle = this._pool.get({
            spawnOptions: this._spawnOptions,
            contentFrame: this._contentFrame,
        });

        if (particle !== undefined) {
            this.addChild(particle);
        }
    }

    /**
     * Removes a particle from the display list and returns it to the pool.
     *
     * @param particle - The particle to remove and recycle
     */
    protected _killParticle(particle: ParticleItem) {
        this.removeChild(particle);
        this._pool.return(particle);
    }

    /**
     * Checks if physics should be affected by particle surface area.
     *
     * @returns True if environmental forces should consider particle surface area
     */
    public get isPhysicsAffectedByParticleSurface() {
        return (
            this._environment.affectSurface &&
            (this._environment.windX || this._environment.windY || this._environment.airResistance)
        );
    }

    /**
     * Applies environmental forces to a particle (gravity, air resistance, wind).
     * Modifies particle velocity based on mass, surface area, and environmental settings.
     *
     * @param particle - The particle to apply environmental forces to
     * @param elapsedMS - Elapsed time in milliseconds for physics calculations
     */
    protected _applyEnvironment(particle: ParticleItem, elapsedMS: number) {
        const elapsedSec = elapsedMS / 1000;
        const particleSurface = this.isPhysicsAffectedByParticleSurface ? particle.surfaceFactor : 1;

        // Gravity
        if (this._environment.gravity) {
            particle.velocityY += this._environment.gravity * elapsedSec;
        }

        // Air resistance
        if (this._environment.airResistance) {
            if (particle.velocityX || particle.velocityY) {
                const mass = particle.mass || 1;

                if (particle.velocityX !== 0) {
                    const signVelX = Math.sign(particle.velocityX);
                    const absVelX = Math.abs(particle.velocityX);
                    const reductionX =
                        (elapsedSec * particleSurface * this._environment.airResistance * absVelX) / mass;

                    particle.velocityX = absVelX > reductionX ? signVelX * (absVelX - reductionX) : 0;
                }

                if (particle.velocityY !== 0) {
                    const signVelY = Math.sign(particle.velocityY);
                    const absVelY = Math.abs(particle.velocityY);
                    const reductionY =
                        (elapsedSec * particleSurface * this._environment.airResistance * absVelY) / mass;
                    particle.velocityY = absVelY > reductionY ? signVelY * (absVelY - reductionY) : 0;
                }
            }
        }

        // Wind
        if (this._environment.windX) {
            particle.velocityX += this._environment.windX * particleSurface * elapsedSec;
        }

        if (this._environment.windY) {
            particle.velocityY += this._environment.windY * particleSurface * elapsedSec;
        }
    }

    /**
     * Connect to game clock to update loop for the emitter.
     */
    protected _startUpdate() {
        if (this._clockConnected) {
            return;
        }
        this._clockConnected = true;
        this._ticker.add(this.updateEmitter, this);
    }

    /**
     * Disconnect from game clock to stop the update loop for the emitter.
     */
    protected _stopUpdate() {
        if (!this._clockConnected) {
            return;
        }
        this._clockConnected = false;
        this._ticker.remove(this.updateEmitter, this);
    }

    /**
     * Checks if a particle is outside the content frame boundaries.
     *
     * @param particle - The particle to check for out-of-bounds condition
     * @returns True if the particle is outside the content frame
     */
    public isOutOfBounds(particle: ParticleItem) {
        const frame = this._contentFrame;
        if (!frame) return false;

        // AABB using particle dimensions & anchor
        const w = particle.width;
        const h = particle.height;
        const left = particle.x - w * particle.anchor.x;
        const top = particle.y - h * particle.anchor.y;
        const right = left + w;
        const bottom = top + h;

        const frameRight = frame.x + frame.width;
        const frameBottom = frame.y + frame.height;

        // Completely outside
        return right < frame.x || left > frameRight || bottom < frame.y || top > frameBottom;
    }

    /**
     * Updates the spawn duration timer and automatically stops spawning when duration is reached.
     *
     * @param game - The forge game instance providing timing information
     */
    public updateSpawnDuration(elapsedMS: number) {
        if (!this.spawn || this.spawnDuration <= 0) {
            return;
        }

        this._spawnDurationElapsed += elapsedMS;

        if (this._spawnDurationElapsed < this.spawnDuration) {
            return;
        }

        this._spawnDurationElapsed = 0;
        this.spawn = false;
    }

    /**
     * Main update loop for the particle emitter.
     * Handles spawning new particles and updating existing ones with physics and lifecycle management.
     *
     * @param game - The forge game instance providing timing information
     */
    public updateEmitter(ticker: Ticker) {
        const elapsedMS = ticker.deltaMS;
        this._updateElapsed += elapsedMS;

        if (this._updateElapsed < this._updateOptions.interval) return;

        // Update spawn rate physics at emitter tick rate
        this._updateSpawnRate(this._updateElapsed);

        this._spawn(this._updateElapsed);
        this.updateSpawnDuration(elapsedMS);

        for (let i = this.children.length - 1; i >= 0; i--) {
            const particleItem = this.children[i] as ParticleItem;

            if (particleItem.currentLife >= particleItem.lifespan || this.isOutOfBounds(particleItem)) {
                this._killParticle(particleItem);
                continue;
            }

            // Apply environment forces before integration step
            this._applyEnvironment(particleItem, this._updateElapsed);
            particleItem.updatePhysics(this._updateElapsed, this._contentFrame || undefined);
        }

        this._updateElapsed = 0;
    }

    /**
     * Starts the particle emitter and optionally begins spawning particles immediately.
     *
     * @param emit - Whether to start spawning particles immediately (default: false)
     */
    public start(emit: boolean = false) {
        if (this._isRunning) {
            return;
        }
        this.spawn = emit;
        this._spawnElapsed = this._spawnInterval;
        this._startUpdate();
        this._isRunning = true;
    }

    /**
     * Pauses the particle emitter, stopping updates but maintaining current state.
     */
    public pause() {
        if (!this._isRunning || this._isPaused) {
            return;
        }
        this._isPaused = true;
        this._stopUpdate();
    }

    /**
     * Resumes the particle emitter from a paused state.
     */
    public resume() {
        if (!this._isRunning || !this._isPaused) {
            return;
        }
        this._isPaused = false;
        this._startUpdate();
    }

    /**
     * Stops the particle emitter and resets its state.
     */
    public stop() {
        if (!this._isRunning) {
            return;
        }
        this.reset();
        this._stopUpdate();
    }

    /**
     * Resets the emitter to its initial state, clearing all particles and resetting timers.
     */
    public reset() {
        // ...existing code...
        this._isRunning = false;
        this._isPaused = false;
        this.spawn = false;
        this._updateElapsed = 0;
        this._spawnElapsed = 0;

        // SpawnRate physics init
        this._spawnRate = ParticleEmitter.randomFromRange(this._updateOptions.spawnRate.value);
        this._spawnRateVelocity = this._updateOptions.spawnRate.velocity
            ? ParticleEmitter.randomFromRange(this._updateOptions.spawnRate.velocity)
            : 0;
        this._spawnRateAcceleration = this._updateOptions.spawnRate.acceleration
            ? ParticleEmitter.randomFromRange(this._updateOptions.spawnRate.acceleration)
            : 0;
        this._spawnRateMaxVelocity = this._updateOptions.spawnRate.maxVelocity ?? -1;

        this._recalcSpawnInterval();

        this._spawnDurationElapsed = 0;

        this.children.forEach((particle) => this._pool.return(particle as ParticleItem));
        this.removeChildren(0, this.children.length);
    }

    /**
     * Destroys the particle emitter and cleans up all resources.
     *
     * @param options - Destruction options for the display object
     */
    public destroy(options?: DestroyOptions | boolean) {
        this._stopUpdate();
        this._pool.destroy();
        super.destroy(options);
    }
}