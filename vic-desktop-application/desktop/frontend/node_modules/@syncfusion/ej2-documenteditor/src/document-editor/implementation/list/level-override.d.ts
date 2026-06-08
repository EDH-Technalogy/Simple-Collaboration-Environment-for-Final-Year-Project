import { WListLevel } from './list-level';
/**
 * @private
 */
export declare class WLevelOverride {
    startAt: number;
    levelNumber: number;
    overrideListLevel: WListLevel;
    /**
     * @private
     * @returns {void}
     */
    clear(): void;
    /**
     * Disposes the internal objects which are maintained.
     * @private
     * @returns {void}
     */
    destroy(): void;
    clone(): WLevelOverride;
}
