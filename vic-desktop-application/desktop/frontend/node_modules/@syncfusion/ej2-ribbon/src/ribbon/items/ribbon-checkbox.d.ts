import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
import { Ribbon } from '../base/index';
import { RibbonCheckBoxSettingsModel, RibbonItemModel } from '../models/index';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonCheckBox {
    private parent;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates the check box.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    createCheckBox(item: RibbonItemModel, itemEle: HTMLElement): void;
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
    /**
     * Triggers the click action on the Checkbox.
     *
     * @param {string} controlId - Gets the control ID.
     * @returns {void}
     */
    click(controlId: string): void;
    /**
     * Updates the checkbox.
     *
     * @param {RibbonCheckBoxSettingsModel} prop - Gets the checkbox property.
     * @param {string} id - Gets the ID of checkbox.
     * @returns {void}
     */
    updateCheckBox(prop: RibbonCheckBoxSettingsModel, id: string): void;
}
