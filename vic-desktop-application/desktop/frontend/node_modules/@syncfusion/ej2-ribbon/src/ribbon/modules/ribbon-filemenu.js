import { EventHandler, remove } from '@syncfusion/ej2-base';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
import { Menu } from '@syncfusion/ej2-navigations';
import { getIndex, isTooltipPresent } from '../base/index';
import * as constants from '../base/constant';
/**
 * Defines the items of Ribbon.
 */
var RibbonFileMenu = /** @class */ (function () {
    function RibbonFileMenu(parent) {
        this.parent = parent;
    }
    RibbonFileMenu.prototype.getModuleName = function () {
        return 'ribbonFileMenu';
    };
    RibbonFileMenu.prototype.destroy = function () {
        if (this.fileMenuDDB) {
            this.destroyDDB();
        }
        this.parent = null;
    };
    /**
     * Creates File Menu
     *
     * @param {FileMenuSettingsModel} fileMenuOptions - Gets the property of filemenu.
     * @returns {void}
     * @hidden
     */
    RibbonFileMenu.prototype.createFileMenu = function (fileMenuOptions) {
        var _this = this;
        if (!fileMenuOptions.visible) {
            return;
        }
        this.ddbElement = this.parent.createElement('button', {
            id: this.parent.element.id + constants.RIBBON_FILE_MENU_ID
        });
        var tabEle = this.parent.tabObj.element;
        var toolbarEle = tabEle.querySelector('.e-toolbar');
        tabEle.insertBefore(this.ddbElement, toolbarEle);
        this.fileMenuDDB = new DropDownButton({
            content: fileMenuOptions.text,
            enableRtl: this.parent.enableRtl,
            cssClass: 'e-ribbon-file-menu e-caret-hide',
            created: function () {
                tabEle.style.setProperty(constants.RIBBON_FILE_MENU_WIDTH, _this.ddbElement.offsetWidth + 'px');
            },
            beforeClose: this.ddbBeforeEvent.bind(this, false),
            beforeOpen: this.ddbBeforeEvent.bind(this, true),
            close: this.ddbAfterEvent.bind(this, false),
            open: this.ddbAfterEvent.bind(this, true)
        }, this.ddbElement);
        if (this.parent.fileMenu.popupTemplate) {
            this.fileMenuDDB.setProperties({ target: this.parent.fileMenu.popupTemplate });
        }
        else {
            this.createRibbonMenu(fileMenuOptions);
        }
        this.parent.tabObj.refreshActiveTabBorder();
        this.addFileMenuTooltip(fileMenuOptions);
        this.addFileMenuKeytip();
    };
    RibbonFileMenu.prototype.addFileMenuTooltip = function (fileMenuOptions) {
        if (isTooltipPresent(fileMenuOptions.ribbonTooltipSettings)) {
            this.ddbElement.classList.add(constants.RIBBON_TOOLTIP_TARGET);
            this.parent.tooltipData.push({ id: this.ddbElement.id, data: fileMenuOptions.ribbonTooltipSettings });
        }
    };
    RibbonFileMenu.prototype.addFileMenuKeytip = function () {
        if (this.parent.fileMenu.keyTip) {
            this.parent.keyTipElements['filemenu'] = [];
            this.parent.keyTipElements['filemenu'].push({ id: this.ddbElement.id, type: 'filemenu', keyTip: this.parent.fileMenu.keyTip });
        }
    };
    RibbonFileMenu.prototype.ddbBeforeEvent = function (isOpen, args) {
        //args.event is null when dropdown button is closed using a method call
        if (!isOpen && args.event && args.event.target.closest('.e-ribbon-menu')) {
            args.cancel = true;
        }
        var event = isOpen ? this.parent.fileMenu.beforeOpen :
            this.parent.fileMenu.beforeClose;
        if (event) {
            var eventArgs = { cancel: args.cancel, element: args.element, event: args.event };
            event.call(this, eventArgs);
            args.cancel = eventArgs.cancel;
        }
    };
    RibbonFileMenu.prototype.ddbAfterEvent = function (isOpen, args) {
        var element = isOpen ? this.fileMenuDDB.target : this.fileMenuDDB.element;
        element.focus();
        var event = isOpen ? this.parent.fileMenu.open : this.parent.fileMenu.close;
        if (event) {
            var eventArgs = { element: args.element };
            event.call(this, eventArgs);
        }
    };
    //Clone RibbonMenuItems before assigning to avoid reference issues.
    RibbonFileMenu.prototype.cloneMenuItem = function (items) {
        var itemsList = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[parseInt(i.toString(), 10)];
            itemsList.push({
                iconCss: item.iconCss,
                id: item.id,
                separator: item.separator,
                text: item.text,
                url: item.url,
                items: this.cloneMenuItem(item.items)
            });
        }
        return itemsList;
    };
    RibbonFileMenu.prototype.createRibbonMenu = function (menuOptions) {
        var _this = this;
        var ulElem = this.parent.createElement('ul', {
            id: this.parent.element.id + constants.RIBBON_FILE_MENU_LIST
        });
        this.fileMenuDDB.setProperties({ target: ulElem });
        this.menuctrl = new Menu({
            orientation: 'Vertical',
            enableRtl: this.parent.enableRtl,
            cssClass: 'e-ribbon-menu',
            animationSettings: menuOptions.animationSettings,
            items: this.cloneMenuItem(menuOptions.menuItems),
            showItemOnClick: menuOptions.showItemOnClick,
            template: menuOptions.itemTemplate,
            beforeClose: this.menuBeforeEvent.bind(this, false),
            beforeOpen: this.menuBeforeEvent.bind(this, true),
            beforeItemRender: this.beforeItemRender.bind(this),
            onClose: this.menuAfterEvent.bind(this, false),
            onOpen: this.menuAfterEvent.bind(this, true),
            select: this.menuSelect.bind(this)
        }, ulElem);
        EventHandler.add(ulElem, 'keydown', function (e) {
            if (e.key === 'Tab') {
                _this.fileMenuDDB.toggle();
            }
        }, this);
    };
    RibbonFileMenu.prototype.menuBeforeEvent = function (isOpen, args) {
        var event = isOpen ? this.parent.fileMenu.beforeOpen :
            this.parent.fileMenu.beforeClose;
        if (event) {
            var eventArgs = {
                cancel: args.cancel, element: args.element, event: args.event,
                items: args.items, parentItem: args.parentItem
            };
            event.call(this, eventArgs);
            args.cancel = eventArgs.cancel;
        }
    };
    RibbonFileMenu.prototype.menuAfterEvent = function (isOpen, args) {
        var event = isOpen ? this.parent.fileMenu.open : this.parent.fileMenu.close;
        if (event) {
            var eventArgs = { element: args.element, items: args.items, parentItem: args.parentItem };
            event.call(this, eventArgs);
        }
    };
    RibbonFileMenu.prototype.beforeItemRender = function (args) {
        var event = this.parent.fileMenu.beforeItemRender;
        if (event) {
            var eventArgs = { element: args.element, item: args.item };
            event.call(this, eventArgs);
        }
    };
    RibbonFileMenu.prototype.menuSelect = function (args) {
        var event = this.parent.fileMenu.select;
        if (event) {
            var eventArgs = { element: args.element, item: args.item, event: args.event };
            event.call(this, eventArgs);
        }
        var menuOpen = !!args.element.closest('.e-ribbon-menu.e-popup-open');
        var fileTriggerOpen = !!args.element.closest('.e-ribbon-file-menu.e-popup-open');
        var fileMenuOpen = !!document.querySelector('.e-ribbon-file-menu.e-popup-open');
        // True if the file trigger was clicked open, or if the ribbon menu is open and the file menu popup is actually present
        var isMenuOpen = fileTriggerOpen || (menuOpen && fileMenuOpen);
        if (!args.element.classList.contains('e-menu-caret-icon') && isMenuOpen) {
            this.fileMenuDDB.toggle();
        }
    };
    /**
     * setRtl
     *
     * @param {commonProperties} commonProp - Get the common property of ribbon.
     * @returns {void}
     * @hidden
     */
    RibbonFileMenu.prototype.setCommonProperties = function (commonProp) {
        if (this.fileMenuDDB) {
            this.fileMenuDDB.setProperties(commonProp);
            if (this.menuctrl) {
                this.menuctrl.setProperties(commonProp);
            }
        }
    };
    /**
     * Update FileMenu
     *
     * @param {FileMenuSettingsModel} fileMenuOptions - Gets the property of filemenu.
     * @returns {void}
     * @hidden
     */
    RibbonFileMenu.prototype.updateFileMenu = function (fileMenuOptions) {
        if (fileMenuOptions.visible) {
            if (this.fileMenuDDB) {
                if (fileMenuOptions.text) {
                    this.fileMenuDDB.setProperties({
                        content: fileMenuOptions.text
                    });
                    this.parent.tabObj.element.style.setProperty(constants.RIBBON_FILE_MENU_WIDTH, this.ddbElement.offsetWidth + 'px');
                }
                if (fileMenuOptions.popupTemplate) {
                    if (this.menuctrl) {
                        this.destroyMenu();
                    }
                    this.fileMenuDDB.setProperties({ target: fileMenuOptions.popupTemplate });
                }
                else {
                    if (this.menuctrl) {
                        this.menuctrl.setProperties({
                            animationSettings: fileMenuOptions.animationSettings,
                            items: this.cloneMenuItem(fileMenuOptions.menuItems),
                            showItemOnClick: fileMenuOptions.showItemOnClick,
                            template: fileMenuOptions.itemTemplate
                        });
                    }
                    else {
                        this.createRibbonMenu(fileMenuOptions);
                    }
                }
                this.removeFileMenuTooltip();
                this.removeFileMenuKeytip();
                this.addFileMenuTooltip(fileMenuOptions);
                this.addFileMenuKeytip();
            }
            else {
                this.createFileMenu(fileMenuOptions);
            }
        }
        else if (this.fileMenuDDB) {
            this.destroyDDB();
        }
        this.parent.tabObj.refreshActiveTabBorder();
    };
    RibbonFileMenu.prototype.destroyMenu = function () {
        if (this.menuctrl) {
            this.menuctrl.destroy();
            this.menuctrl = null;
        }
    };
    RibbonFileMenu.prototype.destroyDDB = function () {
        this.removeFileMenuTooltip();
        this.removeFileMenuKeytip();
        var tabEle = this.parent.tabObj.element;
        tabEle.style.removeProperty(constants.RIBBON_FILE_MENU_WIDTH);
        this.destroyMenu();
        this.fileMenuDDB.destroy();
        this.fileMenuDDB = null;
        remove(this.ddbElement);
        this.ddbElement = null;
    };
    RibbonFileMenu.prototype.removeFileMenuTooltip = function () {
        var _this = this;
        var index = getIndex(this.parent.tooltipData, function (e) { return e.id === _this.ddbElement.id; });
        if (index !== -1) {
            this.ddbElement.classList.remove(constants.RIBBON_TOOLTIP_TARGET);
            this.parent.tooltipData.splice(index, 1);
        }
    };
    RibbonFileMenu.prototype.removeFileMenuKeytip = function () {
        var _this = this;
        if (this.parent.keyTipElements['filemenu']) {
            var index = getIndex(this.parent.keyTipElements['filemenu'], function (e) { return e.id === _this.ddbElement.id; });
            if (index !== -1) {
                this.parent.keyTipElements['filemenu'].splice(index, 1);
            }
        }
    };
    /**
     * Add items to FileMenu.
     *
     * @param {MenuItemModel[]} items - Gets the items to be added.
     * @param {string} target - Gets the target item to add the items.
     * @param {boolean} isAfter - Gets the boolean value to add the items after or before the target item.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    RibbonFileMenu.prototype.addItems = function (items, target, isAfter, isUniqueId) {
        if (isAfter) {
            this.menuctrl.insertAfter(items, target, isUniqueId);
        }
        else {
            this.menuctrl.insertBefore(items, target, isUniqueId);
        }
        this.parent.fileMenu.setProperties({ menuItems: this.menuctrl.items }, true);
    };
    /**
     * Remove items from FileMenu.
     *
     * @param {string[]} items - Gets the items to be removed.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    RibbonFileMenu.prototype.removeItems = function (items, isUniqueId) {
        this.menuctrl.removeItems(items, isUniqueId);
        this.parent.fileMenu.setProperties({ menuItems: this.menuctrl.items }, true);
    };
    /**
     * Enable items in FileMenu.
     *
     * @param {string[]} items - Gets the items to be enabled.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    RibbonFileMenu.prototype.enableItems = function (items, isUniqueId) {
        this.menuctrl.enableItems(items, true, isUniqueId);
        this.parent.fileMenu.setProperties({ menuItems: this.menuctrl.items }, true);
    };
    /**
     * Disable items in FileMenu.
     *
     * @param {string[]} items - Gets the items to be disabled.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    RibbonFileMenu.prototype.disableItems = function (items, isUniqueId) {
        this.menuctrl.enableItems(items, false, isUniqueId);
        this.parent.fileMenu.setProperties({ menuItems: this.menuctrl.items }, true);
    };
    /**
     * Update items in FileMenu.
     *
     * @param {MenuItem} item - Gets the item to be updated.
     * @param {boolean} id - Gets the id of the item to be updated.
     * @param {boolean} isUniqueId - Gets whether the id provided is uniqueId or not.
     * @returns {void}
     */
    RibbonFileMenu.prototype.setItem = function (item, id, isUniqueId) {
        this.menuctrl.setItem(item, id, isUniqueId);
        this.menuctrl.refresh();
        this.parent.fileMenu.setProperties({ menuItems: this.menuctrl.items }, true);
    };
    return RibbonFileMenu;
}());
export { RibbonFileMenu };
