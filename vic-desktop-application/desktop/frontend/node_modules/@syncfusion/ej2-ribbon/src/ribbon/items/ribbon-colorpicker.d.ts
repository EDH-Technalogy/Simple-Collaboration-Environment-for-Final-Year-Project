import { Ribbon } from '../base/index';
import { RibbonItemModel, RibbonColorPickerSettingsModel } from '../models/index';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonColorPicker {
    private parent;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates the colorpicker.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    createColorPicker(item: RibbonItemModel, itemEle: HTMLElement): void;
    private toggleWrapperHover;
    /**
     * Adds the additional event handlers as the item moved into overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @param {DropDownButton} overflowButton - Gets the overflow button.
     * @returns {void}
     * @hidden
     */
    addOverFlowEvents(item: RibbonItemModel, itemEle: HTMLElement, overflowButton: DropDownButton): void;
    /**
     * Removes the additional event handlers as the item moved from overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    removeOverFlowEvents(item: RibbonItemModel, itemEle: HTMLElement): void;
    private getColorPickerObj;
    /**
     * Gets color value in specified type.
     *
     * @param {string} controlId -Gets the control ID.
     * @param {string} value - Specify the color value.
     * @param {string} type - Specify the type to which the specified color needs to be converted.
     * @returns {string} - Returns string.
     */
    getValue(controlId: string, value?: string, type?: string): string;
    /**
     * To show/hide ColorPicker popup based on current state of the SplitButton.
     *
     * @param {string} controlId - set the id of the control.
     * @returns {void} - Returns void.
     */
    toggle(controlId: string): void;
    /**
     * Updates the colorpicker properties.
     *
     * @param {RibbonColorPickerSettingsModel} prop - Gets the colorpicker property.
     * @param {string} id - Gets the ID of colorpicker.
     * @returns {void}
     */
    updateColorPicker(prop: RibbonColorPickerSettingsModel, id: string): void;
    /**
     * @param {HTMLElement} element - Gets the colorpicker element to be destroyed.
     * @returns {void}
     * @hidden
     */
    unwireColorPickerEvents(element: HTMLElement): void;
}
