import { WListLevel } from './list-level';
/**
 * @private
 */
export declare class WAbstractList {
    private abstractListIdIn;
    nsid: number;
    levels: WListLevel[];
    constructor();
    abstractListId: number;
    clear(): void;
    /**
     * Disposes the internal objects which are maintained.
     * @private
     * @returns {void}
     */
    destroy(): void;
    clone(): WAbstractList;
}
