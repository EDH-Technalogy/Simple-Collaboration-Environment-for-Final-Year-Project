import { ChildProperty } from '@syncfusion/ej2-base';
import { RibbonTabModel } from './ribbon-tab-model';
/**
 * Defines the ribbon contextual tab.
 */
export declare class RibbonContextualTabSettings extends ChildProperty<RibbonContextualTabSettings> {
    /**
     * Specifies whether the contextual tab is visible.
     *
     * @default false
     */
    visible: boolean;
    /**
     * Specifies whether the contextual tab is selected.
     *
     * @default false
     */
    isSelected: boolean;
    /**
     * Defines the tab groups to be rendered in ribbon.
     *
     * @default []
     * @aspType List<RibbonTab>
     */
    tabs: RibbonTabModel[];
    /**
     * @param {Object} prop - Gets the property of contextual tab.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    setProperties(prop: Object, muteOnChange: boolean): void;
}
