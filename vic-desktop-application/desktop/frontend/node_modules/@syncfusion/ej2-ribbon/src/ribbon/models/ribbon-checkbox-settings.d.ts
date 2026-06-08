import { ChildProperty, EmitType } from '@syncfusion/ej2-base';
import { LabelPosition, ChangeEventArgs } from '@syncfusion/ej2-buttons';
/**
 * Defines the ribbon checkbox item.
 */
export declare class RibbonCheckBoxSettings extends ChildProperty<RibbonCheckBoxSettings> {
    /**
     * Defines the whether the checkbox is checked or not.
     *
     * @default false
     */
    checked: boolean;
    /**
     * Defines one or more CSS classes to customize the appearance of checkbox.
     *
     * @default ''
     */
    cssClass: string;
    /**
     * Defines the label for the checkbox.
     *
     * @default ''
     */
    label: string;
    /**
     * Defines whether the label is position `After` or `Before` the checkbox.
     *
     * @default 'After'
     */
    labelPosition: LabelPosition;
    /**
     * Specifies additional HTML attributes to be applied to the checkbox.
     *
     * @default {}
     */
    htmlAttributes: {
        [key: string]: string;
    };
    /**
     * Event triggers once the checkbox is created.
     *
     * @event created
     */
    created: EmitType<Event>;
    /**
     * Event triggers when the checkbox state is changed.
     *
     * @event change
     */
    change: EmitType<ChangeEventArgs>;
    /**
     * @param {Object} prop - Gets the property of checkbox.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    setProperties(prop: Object, muteOnChange: boolean): void;
}
