import { ChildProperty, EmitType } from '@syncfusion/ej2-base';
import { BeforeClickGroupButtonEventArgs, ClickGroupButtonEventArgs } from '../base/interface';
import { RibbonTooltipModel } from './ribbon-tooltip-model';
/**
 * Defines the ribbon group button settings.
 */
export declare class RibbonGroupButtonItem extends ChildProperty<RibbonGroupButtonItem> {
    /**
     * Defines the content for the button.
     *
     * @default ''
     */
    content: string;
    /**
     * Defines the CSS class for the icons to be shown in button.
     *
     * @default ''
     */
    iconCss: string;
    /**
     * Specifies the keytip content.
     *
     * @default ''
     */
    keyTip: string;
    /**
     * Specifies the tooltip settings for the group button items.
     *
     * @default {}
     */
    ribbonTooltipSettings: RibbonTooltipModel;
    /**
     * Defines whether the button is selected or not.
     *
     * @default false
     */
    selected: boolean;
    /**
     * Specifies additional HTML attributes to be applied to the group button item.
     *
     * @default {}
     */
    htmlAttributes: {
        [key: string]: string;
    };
    /**
     * Triggers before clicking the button from group button.
     *
     * @event beforeClick
     */
    beforeClick: EmitType<BeforeClickGroupButtonEventArgs>;
    /**
     * Triggers after clicking the button from group button.
     *
     * @event click
     */
    click: EmitType<ClickGroupButtonEventArgs>;
    /**
     * @param {Object} prop - Gets the property of group button.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    setProperties(prop: Object, muteOnChange: boolean): void;
}
