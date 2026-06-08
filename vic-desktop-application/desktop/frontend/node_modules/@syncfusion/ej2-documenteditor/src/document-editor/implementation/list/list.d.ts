import { WLevelOverride } from './level-override';
import { WAbstractList } from './abstract-list';
import { WListLevel } from './list-level';
/**
 * @private
 */
export declare class WList {
    nsid: number;
    listId: number;
    sourceListId: number;
    abstractListId: number;
    abstractList: WAbstractList;
    levelOverrides: WLevelOverride[];
    getListLevel(levelNumber: number): WListLevel;
    getLevelOverride(levelNumber: number): WLevelOverride;
    /**
     * @private
     * @returns {void}
     */
    clear(): void;
    /**
     * Disposes the internal objects which are maintained.
     *
     * @private
     * @returns {void}
     */
    destroy(): void;
    mergeList(list: WList): void;
    clone(): WList;
}
