import { ChildProperty } from '@syncfusion/ej2-base';
import { RibbonItemModel } from './ribbon-item-model';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonCollection extends ChildProperty<RibbonCollection> {
    /**
     * Defines a unique identifier for the collection.
     *
     * @default ''
     */
    id: string;
    /**
     * Defines one or more CSS classes to customize the appearance of collection.
     *
     * @default ''
     */
    cssClass: string;
    /**
     * Defines the list of ribbon items.
     *
     * @default []
     * @aspType List<RibbonItem>
     */
    items: RibbonItemModel[];
    /**
     * @param {Object} prop - Gets the property of collection.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    setProperties(prop: Object, muteOnChange: boolean): void;
}
