import { MenuItem, MenuItemModel } from '@syncfusion/ej2-navigations';
import { FileMenuSettingsModel } from '../models/index';
import { commonProperties, Ribbon } from '../base/index';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonFileMenu {
    private parent;
    private fileMenuDDB;
    private menuctrl;
    private ddbElement;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates File Menu
     *
     * @param {FileMenuSettingsModel} fileMenuOptions - Gets the property of filemenu.
     * @returns {void}
     * @hidden
     */
    createFileMenu(fileMenuOptions: FileMenuSettingsModel): void;
    private addFileMenuTooltip;
    private addFileMenuKeytip;
    private ddbBeforeEvent;
    private ddbAfterEvent;
    private cloneMenuItem;
    private createRibbonMenu;
    private menuBeforeEvent;
    private menuAfterEvent;
    private beforeItemRender;
    private menuSelect;
    /**
     * setRtl
     *
     * @param {commonProperties} commonProp - Get the common property of ribbon.
     * @returns {void}
     * @hidden
     */
    setCommonProperties(commonProp: commonProperties): void;
    /**
     * Update FileMenu
     *
     * @param {FileMenuSettingsModel} fileMenuOptions - Gets the property of filemenu.
     * @returns {void}
     * @hidden
     */
    updateFileMenu(fileMenuOptions: FileMenuSettingsModel): void;
    private destroyMenu;
    private destroyDDB;
    private removeFileMenuTooltip;
    private removeFileMenuKeytip;
    /**
     * Add items to FileMenu.
     *
     * @param {MenuItemModel[]} items - Gets the items to be added.
     * @param {string} target - Gets the target item to add the items.
     * @param {boolean} isAfter - Gets the boolean value to add the items after or before the target item.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    addItems(items: MenuItemModel[], target: string, isAfter: boolean, isUniqueId?: boolean): void;
    /**
     * Remove items from FileMenu.
     *
     * @param {string[]} items - Gets the items to be removed.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    removeItems(items: string[], isUniqueId?: boolean): void;
    /**
     * Enable items in FileMenu.
     *
     * @param {string[]} items - Gets the items to be enabled.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    enableItems(items: string[], isUniqueId?: boolean): void;
    /**
     * Disable items in FileMenu.
     *
     * @param {string[]} items - Gets the items to be disabled.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    disableItems(items: string[], isUniqueId?: boolean): void;
    /**
     * Update items in FileMenu.
     *
     * @param {MenuItem} item - Gets the item to be updated.
     * @param {boolean} id - Gets the id of the item to be updated.
     * @param {boolean} isUniqueId - Gets whether the id provided is uniqueId or not.
     * @returns {void}
     */
    setItem(item: MenuItem, id?: string, isUniqueId?: boolean): void;
}
