import { Component, EmitType } from '@syncfusion/ej2-base';
import { INotifyPropertyChanged, ModuleDeclaration } from '@syncfusion/ej2-base';
import { Tab, TabAnimationSettingsModel } from '@syncfusion/ej2-navigations';
import { RibbonTabModel, RibbonGroupModel, RibbonCollectionModel, RibbonItemModel, FileMenuSettingsModel, BackStageMenuModel, RibbonContextualTabSettingsModel } from '../models/index';
import { RibbonModel } from './ribbon-model';
import { ExpandCollapseEventArgs, LauncherClickEventArgs, LayoutSwitchedEventArgs, OverflowPopupEventArgs, RibbonLayout, ribbonTooltipData, TabSelectedEventArgs, TabSelectingEventArgs } from './interface';
import { RibbonButton, RibbonComboBox, RibbonCheckBox, RibbonDropDown, RibbonColorPicker, RibbonSplitButton, RibbonGroupButton } from '../items/index';
import { RibbonFileMenu, RibbonBackstage, RibbonKeyTip } from '../modules/index';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
import { RibbonContextualTab } from '../modules/ribbon-contextualtab';
import { RibbonGallery } from '../items/ribbon-gallery';
/**
 * The Ribbon Component is a structured layout to manage tools with tabs and groups.
 */
export declare class Ribbon extends Component<HTMLElement> implements INotifyPropertyChanged {
    /**
     * Specifies the active layout of the ribbon.
     * Accepts one of the below values.
     * * Classic – Renders the ribbon tab contents in classic layout.
     * * Simplified – Renders the ribbon tab contents in single row.
     *
     * @isenumeration true
     * @default RibbonLayout.Classic
     * @asptype RibbonLayout
     */
    activeLayout: RibbonLayout | string;
    /**
     * Defines one or more CSS classes to customize the appearance of ribbon.
     *
     * @default ''
     */
    cssClass: string;
    /**
     * Defines whether to enable the key tip or not.
     *
     * @default false
     */
    enableKeyTips: boolean;
    /**
     * Defines the key tip text for the layoutSwitcher icon.
     *
     * @default ''
     */
    layoutSwitcherKeyTip: string;
    /**
     * Defines the properties of ribbon file menu.
     *
     * @default {}
     */
    fileMenu: FileMenuSettingsModel;
    /**
     * Defines the properties of ribbon backstage.
     *
     * @default {}
     */
    backStageMenu: BackStageMenuModel;
    /**
     * Defines the icon CSS for the launcher icon button in group header.
     *
     * @default ''
     */
    launcherIconCss: string;
    /**
     * Specifies whether the ribbon is minimized or not.
     * When minimized, only the tab header is shown.
     *
     * @default false
     */
    isMinimized: boolean;
    /**
     * Provides the localization value for the controls present in ribbon items.
     *
     * @default 'en-us'
     */
    locale: string;
    /**
     * Specifies the index of the current active tab.
     *
     * @default 0
     */
    selectedTab: number;
    /**
     * Specifies the animation configuration settings for showing the content of the Ribbon Tab.
     *
     * @default { previous: { effect: 'SlideLeftIn', duration: 600, easing: 'ease' },next: { effect: 'SlideRightIn', duration: 600, easing: 'ease' } }
     */
    tabAnimation: TabAnimationSettingsModel;
    /**
     * Defines the list of ribbon tabs.
     *
     * @default []
     */
    tabs: RibbonTabModel[];
    /**
     * Defines the properties of ribbon contextual tab.
     *
     * @default []
     */
    contextualTabs: RibbonContextualTabSettingsModel[];
    /**
     * Specifies the width of the ribbon.
     *
     * @default '100%'
     */
    width: string | number;
    /**
     * Specifies the template content for the help pane of ribbon.
     * The help pane appears on the right side of the ribbon header row.
     *
     * @default ''
     * @angularType string | object | HTMLElement
     * @reactType string | function | JSX.Element | HTMLElement
     * @vueType string | function | HTMLElement
     * @aspType string
     */
    helpPaneTemplate: string | HTMLElement | Function;
    /**
     * Defines whether to show the layout switcher button or not.
     *
     * @default false
     */
    hideLayoutSwitcher: boolean;
    /**
     * Event triggers before selecting the tab item.
     *
     * @event tabSelecting
     */
    tabSelecting: EmitType<TabSelectingEventArgs>;
    /**
     * Event triggers after selecting the tab item.
     *
     * @event tabSelected
     */
    tabSelected: EmitType<TabSelectedEventArgs>;
    /**
     * Event triggers before expanding the ribbon.
     *
     * @event ribbonExpanding
     */
    ribbonExpanding: EmitType<ExpandCollapseEventArgs>;
    /**
     * Event triggers before collapsing the ribbon.
     *
     * @event ribbonCollapsing
     */
    ribbonCollapsing: EmitType<ExpandCollapseEventArgs>;
    /**
     * Event triggers when the ribbon layout is switched.
     *
     * @event ribbonLayoutSwitched
     */
    ribbonLayoutSwitched: EmitType<LayoutSwitchedEventArgs>;
    /**
     * Event triggers when the launcher icon of the group is clicked.
     *
     * @event launcherIconClick
     */
    launcherIconClick: EmitType<LauncherClickEventArgs>;
    /**
     * Event triggers once the Ribbon Component rendering is completed.
     *
     * @event created
     */
    created: EmitType<Event>;
    /**
     * Event triggers when the overflow popup opens.
     *
     * @event overflowPopupOpen
     */
    overflowPopupOpen: EmitType<OverflowPopupEventArgs>;
    /**
     * Event triggers when the overflow popup closes.
     *
     * @event overflowPopupClose
     */
    overflowPopupClose: EmitType<OverflowPopupEventArgs>;
    /**
     * The `ribbonButtonModule` is used to create and manipulate buttons in ribbon item.
     */
    ribbonButtonModule: RibbonButton;
    /**
     * The `ribbonDropDownModule` is used to create and manipulate dropdown buttons in ribbon item.
     */
    ribbonDropDownModule: RibbonDropDown;
    /**
     * The `ribbonSplitButtonModule` is used to create and manipulate split buttons in ribbon item.
     */
    ribbonSplitButtonModule: RibbonSplitButton;
    /**
     * The `ribbonCheckBoxModule` is used to create and manipulate checkbox in ribbon item.
     */
    ribbonCheckBoxModule: RibbonCheckBox;
    /**
     * The `ribbonColorPickerModule` is used to create and manipulate color picker in ribbon item.
     */
    ribbonColorPickerModule: RibbonColorPicker;
    /**
     * The `ribbonComboBoxModule` is used to create and manipulate combobox in ribbon item.
     */
    ribbonComboBoxModule: RibbonComboBox;
    /**
     * The `ribbonGalleryModule` is used to create and manipulate gallery in ribbon item.
     */
    ribbonGalleryModule: RibbonGallery;
    /**
     * The `ribbonFileMenuModule` is used to create and manipulate the ribbon file menu.
     */
    ribbonFileMenuModule: RibbonFileMenu;
    /**
     * The `ribbonBackstageModule` is used to create and manipulate the ribbon backstage.
     */
    ribbonBackstageModule: RibbonBackstage;
    /**
     * The `ribbonGroupButtonModule` is used to create and manipulate group button in ribbon item.
     */
    ribbonGroupButtonModule: RibbonGroupButton;
    /**
     * The `ribbonContextualTabModule` is used to create and manipulate group button in ribbon item.
     */
    ribbonContextualTabModule: RibbonContextualTab;
    /**
     * The `ribbonKeytipModule` is used to create and manipulate the ribbon keytip.
     */
    ribbonKeyTipModule: RibbonKeyTip;
    private l10n;
    private itemIndex;
    private idIndex;
    private isAddRemove;
    private collapseButton;
    private ribbonTempEle;
    private scrollModule;
    private currentControlIndex;
    private keyboardModuleRibbon;
    private keyConfigs;
    private initialPropsData;
    private hiddenElements;
    private hiddenGroups;
    private itemsModel;
    private targetTabs;
    private isUpdateItems;
    private resizeListener;
    /** @hidden */
    keysPress: string;
    /** @hidden */
    keyTipElements: {
        [key: string]: object;
    };
    /** @hidden */
    overflowDDB: DropDownButton;
    /** @hidden */
    tabsInternal: RibbonTabModel[];
    /** @hidden */
    tabObj: Tab;
    /** @hidden */
    tooltipData: ribbonTooltipData[];
    /** @hidden */
    isKeytipOpen: boolean;
    /**
     * Constructor for creating the widget.
     *
     * @param  {RibbonModel} options - Specifies the ribbon model
     * @param  {string|HTMLDivElement} element - Specifies the target element
     */
    constructor(options?: RibbonModel, element?: string | HTMLElement);
    /**
     * Initialize the control rendering.
     *
     * @returns {void}
     * @private
     */
    protected render(): void;
    protected preRender(): void;
    /**
     * Get the properties to be maintained in the persisted state.
     *
     * @returns {string} - Persist data
     */
    protected getPersistData(): string;
    /**
     * Get component name.
     *
     * @returns {string} - Module name
     * @private
     */
    protected getModuleName(): string;
    /**
     * To provide the array of modules needed for component rendering
     *
     * @returns {ModuleDeclaration[]} - returns module declaration.
     * @hidden
     */
    protected requiredModules(): ModuleDeclaration[];
    getAppendToElement(): HTMLElement;
    private initialize;
    private initializeLocale;
    private wireEvents;
    private wireKeyboardEvent;
    private keyActionHandler;
    private handleNavigation;
    private resizeHandler;
    private mouseEventHandler;
    private keytipActionHandler;
    private checkKeyTipPresent;
    private removeKeytip;
    private addKeyTip;
    private renderTabs;
    private minimize;
    private toggleLayout;
    private tabCreated;
    private ribbonTabSelected;
    private updateSelectedState;
    private checkOverflow;
    private addTabOverflowKeyTip;
    private checkSimplifiedItemShrinking;
    private checkSimplifiedItemExpanding;
    private createSimplfiedOverflow;
    private checkEmptyCollection;
    private updatePopupItems;
    private removeSimplfiedOverflow;
    private checkOverflowHiddenItems;
    private createOverflowPopup;
    private addOverflowEvents;
    private createOfTabContainer;
    private checkGroupShrinking;
    private checkValidCollectionLength;
    private checkClassicCollection;
    private checkClassicItem;
    private checkLargeToMedium;
    private checkMediumToSmall;
    private checkGroupExpanding;
    private checkSmallToMedium;
    private checkMediumToLarge;
    private handleContentSize;
    private setItemSize;
    private createOverflowDropdown;
    private removeOverflowDropdown;
    private removeDropdown;
    private getGroupResizeOrder;
    private destroyScroll;
    private clearOverflowDropDown;
    private isContextualTab;
    private ribbonTabSelecting;
    private createTabItems;
    private renderInitialTab;
    private addOverflowButton;
    private upDownKeyHandler;
    private findDisabledItem;
    private removeOverflowButton;
    private removeOverflowEvent;
    private createGroupContainer;
    private addExpandCollapse;
    private removeExpandCollapse;
    private reRenderTabs;
    private switchLayout;
    private createLauncherIcon;
    private launcherIconClicked;
    private createGroups;
    private updateGroupProps;
    private validateItemSize;
    private createCollection;
    private createRibbonItem;
    private createItems;
    private createHelpPaneTemplate;
    private createTemplateContent;
    private renderItemTemplate;
    private checkID;
    private hasHtmlAtrrID;
    private updateCommonProperty;
    private removeLauncherIcon;
    private destroyTabItems;
    private destroyFunction;
    /**
     * Gets the item module name.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @returns {void}
     * @hidden
     */
    getItemModuleName(item: RibbonItemModel): string;
    private clearOverflowResize;
    /**
     * Refreshes the layout.
     *
     * @returns {void}
     */
    refreshLayout(): void;
    /**
     * Selects the tab
     *
     * @param  {string} tabId - Gets the tab ID
     * @returns {void}
     */
    selectTab(tabId: string): void;
    /**
     * Shows a specific tab in the ribbon.
     *
     * @param {string} tabId - The ID of the tab to be shown.
     * @param {boolean} isContextual - The boolean if the rendering is contextual.
     * @returns {void}
     */
    showTab(tabId: string, isContextual?: boolean): void;
    /**
     * Hides a specific tab in the ribbon.
     *
     * @param {string} tabId - The ID of the tab to be hidden.
     * @param {boolean} isContextual - The boolean if the rendering is contextual.
     * @returns {void}
     */
    hideTab(tabId: string, isContextual?: boolean): void;
    private showHideTab;
    /**
     * Enables a specific tab in the ribbon.
     *
     * @param {string} tabId - The ID of the tab to be enabled.
     * @returns {void}
     */
    enableTab(tabId: string): void;
    /**
     * Disables a specific tab in the ribbon.
     *
     * @param {string} tabId - The ID of the tab to be disabled.
     * @returns {void}
     */
    disableTab(tabId: string): void;
    private enableDisableTab;
    /**
     * Adds the ribbon tab.
     *
     * @param {RibbonTabModel} tab - Gets the ribbon tab model
     * @param {string} targetId  - Gets the ID of the target tab to add the new tab.
     * @param {boolean} isAfter - Defines whether the tab is added before or after the target.
     * @returns {void}
     */
    addTab(tab: RibbonTabModel, targetId?: string, isAfter?: boolean): void;
    /**
     * Removes the ribbon tab.
     *
     * @param {string} tabId - Gets the tab ID
     * @returns {void}
     */
    removeTab(tabId: string): void;
    /**
     * Adds the ribbon group.
     *
     * @param {string} tabId - Gets the tab ID.
     * @param {RibbonGroupModel} group - Gets the ribbon group model.
     * @param {string} targetId - Gets the ID of the target group to add the new group.
     * @param {boolean} isAfter - Defines whether the group is added before or after the target.
     * @returns {void}
     */
    addGroup(tabId: string, group: RibbonGroupModel, targetId?: string, isAfter?: boolean): void;
    /**
     * Removes the ribbon group.
     *
     * @param {string} groupId -Gets the group ID.
     * @returns {void}
     */
    removeGroup(groupId: string): void;
    private isHeaderVisible;
    /**
     * Hides a specific group within a ribbon tab.
     *
     * @param {string} groupID - The ID of the group to be hidden.
     * @returns {void}
     */
    hideGroup(groupID: string): void;
    /**
     * Shows a specific group within a ribbon tab.
     *
     * @param {string} groupID - The ID of the group to be shown.
     * @returns {void}
     */
    showGroup(groupID: string): void;
    private showHideGroup;
    private updateHiddenElements;
    private checkHiddenElements;
    private updateItemsSimplifiedWidth;
    private checkWidthDifference;
    private calculateHiddenElementsWidth;
    private calculateMediumDataWidth;
    private calculateOverflowItemsWidth;
    /**
     * Disables a specific group within a ribbon tab.
     *
     * @param {string} groupID - The ID of the group to be disabled.
     * @returns {void}
     */
    disableGroup(groupID: string): void;
    /**
     * Enables a specific group within a ribbon tab.
     *
     * @param {string} groupID - The ID of the group to be enabled.
     * @returns {void}
     */
    enableGroup(groupID: string): void;
    private enableDisableGroup;
    /**
     * adds the ribbon collection.
     *
     * @param {string} groupId - Gets the ribbon group ID.
     * @param {RibbonCollectionModel} collection - Gets the ribbon collection model.
     * @param {string} targetId - Gets the ID of the target collection to add the new collection.
     * @param {boolean} isAfter - Defines whether the collection is added before or after the target.
     * @returns {void}
     */
    addCollection(groupId: string, collection: RibbonCollectionModel, targetId?: string, isAfter?: boolean): void;
    /**
     * Removes the ribbon collection.
     *
     * @param {string} collectionId - Gets the collection ID.
     * @returns {void}
     */
    removeCollection(collectionId: string): void;
    /**
     * Adds ribbon item.
     *
     * @param {string} collectionId - Gets the collection ID.
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {string} targetId - Gets the ID of the target item to add the new item.
     * @param {boolean} isAfter - Defines whether the item is added before or after the target.
     * @returns {void}
     */
    addItem(collectionId: string, item: RibbonItemModel, targetId?: string, isAfter?: boolean): void;
    /**
     * Removes ribbon item.
     *
     * @param {string} itemId - Gets the item ID.
     * @returns {void}
     */
    removeItem(itemId: string): void;
    /**
     * Hides a specific ribbon item.
     *
     * @param {string} itemId - The ID of the item to be hidden.
     * @returns {void}
     */
    hideItem(itemId: string): void;
    /**
     * Shows a specific ribbon item.
     *
     * @param {string} itemId - The ID of the item to be shown.
     * @returns {void}
     */
    showItem(itemId: string): void;
    private showHideItem;
    private updateInitialProps;
    private checkHiddenItems;
    private checkOverflowItems;
    /**
     * tab - Gets the ribbon tab to be updated. The id of the tab is a required property. Other properties are optional.
     *
     * @param {RibbonTabModel} tab - Gets the ribbon tab model.
     * @returns {void}
     */
    updateTab(tab: RibbonTabModel): void;
    /**
     * group - Gets the ribbon group to be updated. The id of the group is a required property. Other properties are optional.
     *
     * @param {RibbonGroupModel} group - Gets the ribbon group model.
     * @returns {void}
     */
    updateGroup(group: RibbonGroupModel): void;
    /**
     * collection - Gets the ribbon collection to be updated. The id of the collection is a required property. Other properties are optional.
     *
     * @param {RibbonCollectionModel} collection - Gets the ribbon collection model.
     * @returns {void}
     */
    updateCollection(collection: RibbonCollectionModel): void;
    /**
     * item - Gets the ribbon item to be updated. The id of the item is a required property. Other properties are optional.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @returns {void}
     */
    updateItem(item: RibbonItemModel): void;
    private removeItemElement;
    /**
     * Enables ribbon item.
     *
     * @param {string} itemId - Gets the item ID.
     * @returns {void}
     */
    enableItem(itemId: string): void;
    /**
     * Disables ribbon item.
     *
     * @param {string} itemId - Gets the item ID.
     * @returns {void}
     */
    disableItem(itemId: string): void;
    /**
     * Gets the Ribbon item model associated with the specified item ID.
     *
     * @param {string} itemId - The unique ID of the Ribbon item.
     * @returns {RibbonItemModel} - Returns the Ribbon item model.
     */
    getItem(itemId: string): RibbonItemModel;
    private enableDisableItem;
    private unwireEvents;
    destroy(): void;
    /**
     * Called internally if any of the property value changed.
     *
     * @param  {RibbonModel} newProp - Specifies new properties
     * @param  {RibbonModel} oldProp - Specifies old properties
     * @returns {void}
     * @private
     */
    onPropertyChanged(newProp: RibbonModel, oldProp?: RibbonModel): void;
}
