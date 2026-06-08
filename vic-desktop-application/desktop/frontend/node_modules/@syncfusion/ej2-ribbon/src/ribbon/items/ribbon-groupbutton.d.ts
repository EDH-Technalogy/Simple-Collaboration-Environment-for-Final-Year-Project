import { Ribbon } from '../base/ribbon';
import { RibbonItemModel } from '../models';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonGroupButton {
    private parent;
    private count;
    private isSelected;
    private grpBtnIndex;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates Group Button
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemElement - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    createGroupButton(item: RibbonItemModel, itemElement: HTMLElement): void;
    private groupButtonClicked;
    /**
     * updates group button in mode switching
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemElement - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    switchGroupButton(item: RibbonItemModel, itemElement: HTMLElement): void;
    private handleFocusState;
    private addGroupButtonHeader;
    private handleGroupButtonNavigation;
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
     * Removes the additional event handlers as the item moved into overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    removeOverFlowEvents(item: RibbonItemModel, itemEle: HTMLElement): void;
    /**
     * Removes DropDown.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item.
     * @returns {void}
     * @hidden
     */
    destroyDropDown(item: RibbonItemModel): void;
    /**
     * Updates the group button size.
     *
     * @param {HTMLElement} itemElement - Gets the group button container element.
     * @param {RibbonItemModel} item - Gets the ribbon item.
     * @returns {void}
     * @hidden
     */
    updateGroupButtonSize(itemElement: HTMLElement, item: RibbonItemModel): void;
}
