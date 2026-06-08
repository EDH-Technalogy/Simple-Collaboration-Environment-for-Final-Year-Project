import { FieldSettingsModel } from '@syncfusion/ej2-dropdowns';
import { Query } from '@syncfusion/ej2-data';
import { RibbonComboBoxSettingsModel, RibbonItemModel } from '../models/index';
import { Ribbon } from '../base/index';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonComboBox {
    private parent;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates the combobox.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    createComboBox(item: RibbonItemModel, itemEle: HTMLElement): void;
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
    private getComboBoxObj;
    /**
     * To filter the data from given data source by using query
     *
     * @param  {string } controlId - set the id of the control in which methods needs to be called.
     * @param  {Object[] } dataSource - Set the data source to filter.
     * @param  {Query} query - Specify the query to filter the data.
     * @param  {FieldSettingsModel} fields - Specify the fields to map the column in the data table.
     * @returns {void}
     */
    filter(controlId: string, dataSource: {
        [key: string]: Object;
    }[] | string[] | number[] | boolean[], query?: Query, fields?: FieldSettingsModel): void;
    /**
     * To open/close DropDownButton popup based on current state of the combobox.
     *
     * @param {string} controlId - Gets the id of the control.
     * @returns {void}
     */
    hidePopup(controlId: string): void;
    /**
     * To open/close DropDownButton popup based on current state of the combobox.
     *
     * @param {string} controlId - Gets the id of the control.
     * @returns {void}
     */
    showPopup(controlId: string): void;
    /**
     * Updates the combobox properties.
     *
     * @param {RibbonComboBoxSettingsModel} prop - Gets the combobox property.
     * @param {string} id - Gets the ID of combobox.
     * @returns {void}
     */
    updateComboBox(prop: RibbonComboBoxSettingsModel, id: string): void;
}
