import { ChildProperty, EmitType, BaseEventArgs } from '@syncfusion/ej2-base';
import { MenuAnimationSettingsModel, MenuItemModel } from '@syncfusion/ej2-navigations';
import { RibbonTooltipModel } from './ribbon-tooltip-model';
/**
 * Defines the ribbon file menu settings.
 */
export declare class FileMenuSettings extends ChildProperty<FileMenuSettings> {
    /**
     * Defines the text content of file menu button.
     *
     * @default 'File'
     */
    text: string;
    /**
     * Defines whether to show the file menu button.
     *
     * @default false
     */
    visible: boolean;
    /**
     * Defines the list of menu items for the file menu.
     *
     * @default []
     */
    menuItems: MenuItemModel[];
    /**
     * Specifies whether to show the sub menu or not on click.
     * When set to true, the sub menu will open only on mouse click.
     *
     * @default false
     */
    showItemOnClick: boolean;
    /**
     * Specifies the animation settings for the sub menu open/close.
     *
     * @default ''
     */
    animationSettings: MenuAnimationSettingsModel;
    /**
     * Specifies the template for file menu item.
     *
     * @default ''
     * @angularType string | object
     * @reactType string | function | JSX.Element
     * @vueType string | function
     * @aspType string
     */
    itemTemplate: string | Function;
    /**
     * Specifies the custom content for the file menu popup.
     *
     * @default ''
     * @angularType string | HTMLElement
     * @reactType string | HTMLElement | JSX.Element
     * @vueType string | HTMLElement
     * @aspType string
     */
    popupTemplate: string | HTMLElement;
    /**
     * Specifies the tooltip settings for the file menu button.
     *
     * @default {}
     */
    ribbonTooltipSettings: RibbonTooltipModel;
    /**
     * Event triggers before closing the file menu popup.
     *
     * @event beforeClose
     */
    beforeClose: EmitType<FileMenuBeforeOpenCloseEventArgs>;
    /**
     * Event triggers before opening the file menu popup.
     *
     * @event beforeOpen
     */
    beforeOpen: EmitType<FileMenuBeforeOpenCloseEventArgs>;
    /**
     * Event triggers while rendering each ribbon file menu item.
     *
     * @event beforeItemRender
     */
    beforeItemRender: EmitType<FileMenuEventArgs>;
    /**
     * Event triggers when file menu popup is closed.
     *
     * @event close
     */
    close: EmitType<FileMenuOpenCloseEventArgs>;
    /**
     * Event triggers when file menu popup is opened.
     *
     * @event open
     */
    open: EmitType<FileMenuOpenCloseEventArgs>;
    /**
     * Event triggers while selecting an item in ribbon file menu.
     *
     * @event select
     */
    select: EmitType<FileMenuEventArgs>;
    /**
     * Specifies the keytip content.
     *
     * @default ''
     */
    keyTip: string;
    /**
     * @param {Object} prop - Gets the property of FileMenu.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    setProperties(prop: Object, muteOnChange: boolean): void;
}
/**
 * Event Triggers when selecting or creating the file menu item.
 */
export interface FileMenuEventArgs extends BaseEventArgs {
    /**
     *  Provides the HTML element of the file menu item.
     */
    element: HTMLElement;
    /**
     * Provides the file menu item object.
     */
    item: MenuItemModel;
    /**
     * Provides the actual native event.
     */
    event?: Event;
}
/**
 * Event Triggers when opening or closing the file menu.
 */
export interface FileMenuOpenCloseEventArgs extends BaseEventArgs {
    /**
     *  Provides the HTML element of the file menu popup.
     */
    element: HTMLElement;
    /**
     * Provides the file menu item object.
     */
    items?: MenuItemModel[];
    /**
     * Provides the parent file menu item of the popup, in case of sub-menu.
     */
    parentItem?: MenuItemModel;
}
/**
 * Event Triggers before opening or closing the file menu.
 */
export interface FileMenuBeforeOpenCloseEventArgs extends BaseEventArgs {
    /**
     * Defines whether to cancel the file menu popup opening or closing.
     */
    cancel: boolean;
    /**
     *  Provides the HTML element of the file menu popup.
     */
    element: HTMLElement;
    /**
     * Provides the file menu item object.
     */
    items?: MenuItemModel[];
    /**
     * Provides the parent file menu item of the popup, in case of sub-menu.
     */
    parentItem?: MenuItemModel;
    /**
     * Provides the actual native event.
     */
    event: Event;
}
