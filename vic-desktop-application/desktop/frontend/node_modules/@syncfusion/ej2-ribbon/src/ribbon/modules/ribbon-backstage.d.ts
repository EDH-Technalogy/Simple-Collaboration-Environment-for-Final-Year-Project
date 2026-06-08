import { Component } from '@syncfusion/ej2-base';
import { BackStageMenuModel, BackstageItemModel } from '../models/index';
import { commonProperties, Ribbon } from '../base/index';
/**
 * Defines the items of Ribbon.
 */
export declare class RibbonBackstage extends Component<HTMLElement> {
    private parent;
    private backstageButton;
    private popupEle;
    private menuCtrl;
    private footerMenuCtrl;
    private backstageButtonEle;
    private closeBtn;
    private popupHTMLElement;
    private backstageContentEle;
    private ulMenuElem;
    private isBackButtonClicked;
    private menuWrapper;
    private contentItem;
    private backstageTempEle;
    private itemsWrapperEle;
    private menuIndex;
    private isCloseBtn;
    constructor(parent: Ribbon);
    /**
     * @private
     * @returns {void}
     */
    protected render(): void;
    /**
     * @private
     * @returns {void}
     */
    protected preRender(): void;
    protected getPersistData(): string;
    /**
     * This method is abstract member of the Component<HTMLElement>.
     *
     * @private
     * @returns {void}
     */
    protected onPropertyChanged(): void;
    protected getModuleName(): string;
    protected destroy(): void;
    /**
     * Creates Backstage Menu
     *
     * @param {BackStageMenuModel} backStageOptions - Gets the property of backstage.
     * @returns {void}
     * @hidden
     */
    createBackStage(backStageOptions: BackStageMenuModel): void;
    private onClickEvent;
    private addBackStageMenuTooltip;
    private addBackStageMenuKeyTip;
    private checkMenuItems;
    private createBackStagePopup;
    private handleNavigation;
    private updatePopupPositionOnRtl;
    private createBackstageMenu;
    private cloneMenuItem;
    private cloneFooterMenuItem;
    private createBackStageContent;
    private createBackStageTemplate;
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
     * Update Backstage menu
     *
     * @param {BackStageMenuModel} backStageOptions - Gets the property of backstage menu.
     * @returns {void}
     * @hidden
     */
    updateBackStageMenu(backStageOptions: BackStageMenuModel): void;
    private destroyMenu;
    private destroyDDB;
    private removeBackstageMenuTooltip;
    private removeBackstageMenuKeyTip;
    /**
     * Add items to Backstage Menu.
     *
     * @param {BackstageItemModel[]} items - Gets the items to be added.
     * @param {string} target - Gets the target item to add the items.
     * @param {boolean} isAfter - Gets the boolean value to add the items after or before the target item.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    addBackstageItems(items: BackstageItemModel[], target: string, isAfter: boolean, isUniqueId?: boolean): void;
    /**
     * Remove items from Backstage Menu.
     *
     * @param {string[]} items - Gets the items to be removed.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    removeBackstageItems(items: string[], isUniqueId?: boolean): void;
    /**
     * Renders the backstage dynamically.
     *
     * @returns {void}
     */
    showBackstage(): void;
    /**
     * Hides the backstage dynamically.
     *
     * @returns {void}
     */
    hideBackstage(): void;
}
