import { Ribbon } from '../base/index';
import { RibbonItemModel } from '../models/index';
import { Popup } from '@syncfusion/ej2-popups';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonGallery {
    private parent;
    private count;
    private isAdded;
    private galleryItemsIndex;
    private registeredTemplate;
    constructor(parent: Ribbon);
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates gallery.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    createGallery(item: RibbonItemModel, itemEle: HTMLElement): void;
    private renderGalleryItems;
    private setWrapperWidth;
    private setWrapperStyle;
    /**
     * Checks the gallery items height.
     *
     * @param {HTMLElement} activeContent - Gets the current active content.
     * @returns {void}
     * @hidden
     */
    checkAvailableHeight(activeContent: HTMLElement): void;
    /**
     * Checks the popup collision.
     *
     * @param {Popup} popup - Gets the popup.
     * @param {HTMLElement} popupEle - Gets the popup element.
     * @param {number} offsetValue - Gets the offset value of gallery popup button.
     * @returns {void}
     * @hidden
     */
    checkCollision(popup: Popup, popupEle: HTMLElement, offsetValue?: number): void;
    private setGalleryPopupHeight;
    private createPopup;
    /**
     * Updates gallery in mode switching.
     *
     * @param {string} activeLayout - Gets the current active layout.
     * @param {string} itemID - Gets the ribbon item id.
     * @returns {void}
     * @hidden
     */
    switchGalleryItems(activeLayout: string, itemID: string): void;
    /**
     * Adds the additional event handlers as the item moved into overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    addOverFlowEvents(item: RibbonItemModel, itemEle: HTMLElement): void;
    /**
     * Removes the additional event handlers as the item moved into overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    removeOverFlowEvents(item: RibbonItemModel, itemEle: HTMLElement): void;
    private setActiveState;
    private popupEvents;
    private showPopup;
    private hidePopup;
    /**
     * Shows a specific gallery popup in the ribbon.
     *
     * @param {string} id - Gets the ribbon item id.
     * @returns {void}
     */
    showGalleryPopup(id: string): void;
    /**
     * Hides a specific gallery popup in the ribbon.
     *
     * @param {string} id - Gets the ribbon item id.
     * @returns {void}
     */
    hideGalleryPopup(id: string): void;
    private setFoucsToFirstItem;
    private alignGalleryPopupLeft;
    private handleGalleryPopupNavigation;
    private createGalleryTemplate;
    private createGalleryPopupTemplate;
}
