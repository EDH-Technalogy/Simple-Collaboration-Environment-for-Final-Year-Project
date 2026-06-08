import { ChildProperty } from '@syncfusion/ej2-base';
import { RibbonGroupModel } from './ribbon-group-model';
/**
 * Defines the ribbon tab.
 */
export declare class RibbonTab extends ChildProperty<RibbonTab> {
    /**
     * Specifies the keytip content.
     *
     * @default ''
     */
    keyTip: string;
    /**
     * Defines a unique identifier for the tab.
     *
     * @default ''
     */
    id: string;
    /**
     * Defines one or more CSS classes to customize the appearance of tab.
     *
     * @default ''
     */
    cssClass: string;
    /**
     * Defines the list of ribbon groups.
     *
     * @default []
     * @aspType List<RibbonGroup>
     */
    groups: RibbonGroupModel[];
    /**
     * Defines the content of tab header.
     *
     * @default ''
     */
    header: string;
    /**
     * @param {Object} prop - Gets the property of tab.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    setProperties(prop: Object, muteOnChange: boolean): void;
}
