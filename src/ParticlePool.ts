import { PoolItem, PoolItemConstructor } from "./types";

/**
 * Object pool implementation for efficient particle management.
 * Reduces garbage collection by reusing particle instances instead of creating new ones.
 *
 * @template T - The type of pool items, must implement PoolItem interface
 */
export class ParticlePool<T extends PoolItem> {
    /** Array of available items ready for reuse */
    protected _items: T[] = [];
    /** Constructor function for creating new items */
    protected _constructor: PoolItemConstructor<T>;
    /** Total number of items ever created by this pool */
    protected _createdCount: number = 0;
    public maxPoolSize: number;

    /**
     * Creates a new particle pool with the specified item type.
     *
     * @param ClassType - Constructor for the type of items this pool will manage
     * @param initialSize - Optional number of items to pre-create in the pool
     */
    constructor(ClassType: PoolItemConstructor<T>, initialSize?: number, maxPoolSize?: number) {
        this._constructor = ClassType;
        this.maxPoolSize = maxPoolSize ?? Infinity;
        if (initialSize && initialSize > 0) {
            this.prepopulate(initialSize);
        }
    }

    /**
     * Creates a new item instance and increments the creation counter.
     *
     * @param data - Optional initialization data for the new item
     * @returns Newly created item instance
     */
    protected _getNewItem(): T {
        this._createdCount++;
        return new this._constructor();
    }

    /**
     * Retrieves an item from the pool, either reusing an existing one or creating a new one.
     * The item is automatically initialized with the provided data.
     *
     * @param data - Optional initialization data to pass to the item's init method
     * @returns An initialized item ready for use
     */
    public get(data?: unknown): T | undefined {
        if (this._items.length > 0) {
            const item = this._items.pop()!;
            item.inPool = false;
            item.init(data);
            return item;
        }
        if (this._createdCount < this.maxPoolSize) {
            const item = this._getNewItem();
            item.inPool = false;
            item.init(data);
            return item;
        }
    }

    /**
     * Returns an item to the pool for reuse.
     * The item is automatically reset to its default state.
     *
     * @param item - The item to return to the pool
     */
    public return(item: T): void {
        if (item.inPool) {
            return;
        }
        item.inPool = true;
        item.reset();
        this._items.push(item);
    }

    /**
     * Gets the total number of items ever created by this pool.
     *
     * @returns Total number of items created
     */
    public get totalSize(): number {
        return this._createdCount;
    }

    /**
     * Gets the number of items currently available in the pool.
     *
     * @returns Number of available items
     */
    public get totalFree(): number {
        return this._items.length;
    }

    /**
     * Gets the number of items currently in use (checked out from the pool).
     *
     * @returns Number of items in use
     */
    public get totalUsed(): number {
        return this._createdCount - this._items.length;
    }

    /**
     * Prepopulate the pool with a specified number of objects.
     *
     * @param count - Number of objects to create
     */
    public prepopulate(count: number): void {
        for (let i = 0; i < count; i++) {
            const item = this._getNewItem();
            item.inPool = true;
            item.reset();
            this._items.push(item);
        }
    }

    /**
     * Clear the pool of all objects.
     */
    public clear(): void {
        this._items.forEach((item) => item.reset());
        this._items.length = 0;
        // NOTE: do not reset _createdCount here; objects may still exist and be in use.
    }

    /**
     * Destroy the pool and all objects in it.
     */
    public destroy(): void {
        this._items.forEach((item) => item.destroy());
        this._items.length = 0;
        this._createdCount = 0;
    }
}
