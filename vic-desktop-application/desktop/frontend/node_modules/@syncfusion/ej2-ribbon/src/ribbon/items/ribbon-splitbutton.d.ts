import { DropDownButton, ItemModel } from '@syncfusion/ej2-splitbuttons';
import { Ribbon } from '../base/index';
import { RibbonSplitButtonSettingsModel, RibbonItemModel } from '../models/index';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonSplitButton {
    private parent;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates SplitButton.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    createSplitButton(item: RibbonItemModel, itemEle: HTMLElement): void;
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
    private setContent;
    private getSplitButtonObj;
    /**
     * Adds a new item to the menu. By default, new item appends to
     * the list as the last item, but you can insert based on the text parameter.
     *
     * @param {string} controlId - Gets the control ID.
     * @param {ItemModel[]} Items - Gets the SplitButton items.
     * @param {string} text - Gets the text of the splitbutton item where the new item needs to be inserted.
     * @returns {void}
     */
    addItems(controlId: string, Items: ItemModel[], text?: string): void;
    /**
     * Removes the items from the menu.
     *
     * @param {string} controlId - Gets the control ID.
     * @param {string[]} Items -
     * @param {string} isUniqueId -
     * @returns {void}
     */
    removeItems(controlId: string, Items: string[], isUniqueId?: boolean): void;
    /**
     * To open/close SplitButton popup based on current state of the SplitButton.
     *
     * @param {string} controlId - Gets the control ID.
     * @returns {void}
     */
    toggle(controlId: string): void;
    /**
     * Updates the splitbutton.
     *
     * @param {RibbonSplitButtonSettingsModel} prop - Gets the splitbutton property.
     * @param {string} id - Gets the ID of dropdown.
     * @returns {void}
     */
    updateSplitButton(prop: RibbonSplitButtonSettingsModel, id: string): void;
    /**
     * Updated SplitButton size
     *
     * @param {HTMLElement} element - Gets the splibutton element.
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @returns {void}
     * @hidden
     */
    updateSplitButtonSize(element: HTMLElement, item: RibbonItemModel): void;
}
