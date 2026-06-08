var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { remove, append, Component, EventHandler } from '@syncfusion/ej2-base';
import { Menu } from '@syncfusion/ej2-navigations';
import { getIndex } from '../base/index';
import { getTemplateFunction, isTooltipPresent } from '../base/utils';
import * as constants from '../base/constant';
import { Button } from '@syncfusion/ej2-buttons';
import { Popup } from '@syncfusion/ej2-popups';
/**
 * Defines the items of Ribbon.
 */
var RibbonBackstage = /** @class */ (function (_super) {
    __extends(RibbonBackstage, _super);
    function RibbonBackstage(parent) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        return _this;
    }
    /**
     * @private
     * @returns {void}
     */
    RibbonBackstage.prototype.render = function () {
        // render code
    };
    /**
     * @private
     * @returns {void}
     */
    RibbonBackstage.prototype.preRender = function () {
        // pre render code
    };
    RibbonBackstage.prototype.getPersistData = function () {
        return '';
    };
    /**
     * This method is abstract member of the Component<HTMLElement>.
     *
     * @private
     * @returns {void}
     */
    RibbonBackstage.prototype.onPropertyChanged = function () {
        // onProperty changes code
    };
    RibbonBackstage.prototype.getModuleName = function () {
        return 'ribbonBackstage';
    };
    RibbonBackstage.prototype.destroy = function () {
        if (this.backstageButton) {
            this.destroyDDB();
        }
        this.parent = null;
    };
    /**
     * Creates Backstage Menu
     *
     * @param {BackStageMenuModel} backStageOptions - Gets the property of backstage.
     * @returns {void}
     * @hidden
     */
    RibbonBackstage.prototype.createBackStage = function (backStageOptions) {
        var _this = this;
        if (!backStageOptions.visible) {
            return;
        }
        this.backstageButtonEle = this.parent.createElement('button', {
            id: this.parent.element.id + constants.RIBBON_BACKSTAGE_MENU_ID
        });
        var tabEle = this.parent.tabObj.element;
        var toolbarEle = tabEle.querySelector('.e-toolbar');
        tabEle.insertBefore(this.backstageButtonEle, toolbarEle);
        this.backstageButton = new Button({
            content: backStageOptions.text,
            enableRtl: this.parent.enableRtl,
            cssClass: constants.RIBBON_BACKSTAGE,
            created: function () {
                tabEle.style.setProperty(constants.RIBBON_FILE_MENU_WIDTH, _this.backstageButtonEle.offsetWidth + 'px');
            }
        }, this.backstageButtonEle);
        this.createBackStagePopup(backStageOptions);
        if (this.parent.backStageMenu.template) {
            this.createBackStageTemplate(this.parent.backStageMenu.template);
        }
        else {
            var footerItemCount = 0;
            var itemCount = 0;
            for (var i = 0; i < backStageOptions.items.length; i++) {
                var item = backStageOptions.items[parseInt(i.toString(), 10)];
                if (item.isFooter) {
                    footerItemCount++;
                }
                else {
                    itemCount++;
                }
            }
            if (itemCount > 0) {
                this.createBackstageMenu(backStageOptions, false);
            }
            if (footerItemCount > 0) {
                this.createBackstageMenu(backStageOptions, true);
            }
            if (this.menuCtrl) {
                this.checkMenuItems(this.menuCtrl.items);
            }
            if (this.footerMenuCtrl) {
                this.checkMenuItems(this.footerMenuCtrl.items);
            }
        }
        this.backstageButtonEle.onclick = function (e) {
            e.stopPropagation();
            _this.showBackstage();
            _this.popupHTMLElement.classList.add(constants.RIBBON_BACKSTAGE_OPEN);
            var menuItem = _this.menuWrapper.querySelector('.e-menu-item.e-selected');
            if (menuItem) {
                menuItem.classList.remove('e-selected');
            }
            for (var i = 0; i < backStageOptions.items.length; i++) {
                var item = backStageOptions.items[parseInt(i.toString(), 10)];
                if (!item.isFooter && _this.menuCtrl.items[0].text === item.text) {
                    var firstMenuEle = _this.popupHTMLElement.querySelector('#' + _this.menuCtrl.items[0].id);
                    if (firstMenuEle) {
                        firstMenuEle.classList.add('e-selected');
                        firstMenuEle.focus();
                        _this.menuIndex = 0;
                        _this.isCloseBtn = false;
                    }
                    _this.createBackStageContent(_this.menuCtrl.items[0].id, item.content);
                    break;
                }
                else {
                    continue;
                }
            }
        };
        this.parent.tabObj.refreshActiveTabBorder();
        this.addBackStageMenuTooltip(backStageOptions);
        this.addBackStageMenuKeyTip(backStageOptions);
        EventHandler.add(document, 'click', this.onClickEvent, this);
    };
    RibbonBackstage.prototype.onClickEvent = function (e) {
        var targetEle = e.target;
        if (this.popupHTMLElement.contains(targetEle)) {
            return;
        }
        else {
            this.hideBackstage();
        }
    };
    RibbonBackstage.prototype.addBackStageMenuTooltip = function (backStageOptions) {
        if (isTooltipPresent(backStageOptions.ribbonTooltipSettings)) {
            this.backstageButtonEle.classList.add(constants.RIBBON_TOOLTIP_TARGET);
            this.parent.tooltipData.push({ id: this.backstageButtonEle.id, data: backStageOptions.ribbonTooltipSettings });
        }
    };
    RibbonBackstage.prototype.addBackStageMenuKeyTip = function (backStageOptions) {
        if (backStageOptions.keyTip) {
            if (!(this.parent.keyTipElements['backstage'])) {
                this.parent.keyTipElements['backstage'] = [];
            }
            this.parent.keyTipElements['backstage'].push({ id: this.backstageButtonEle.id, type: 'backstage', keyTip: backStageOptions.keyTip });
        }
        if (backStageOptions.items && backStageOptions.items.length) {
            if (!(this.parent.keyTipElements['backstageMenu'])) {
                this.parent.keyTipElements['backstageMenu'] = [];
            }
            for (var i = 0; i < backStageOptions.items.length; i++) {
                if (backStageOptions.items[parseInt(i.toString(), 10)].keyTip) {
                    this.parent.keyTipElements['backstageMenu'].push({ id: backStageOptions.items[parseInt(i.toString(), 10)].id, type: 'backstageMenu', keyTip: backStageOptions.items[parseInt(i.toString(), 10)].keyTip });
                }
            }
        }
    };
    RibbonBackstage.prototype.checkMenuItems = function (backStageItems) {
        for (var i = 0; i < backStageItems.length; i++) {
            var item = backStageItems[parseInt(i.toString(), 10)];
            if (!item.iconCss) {
                var menuItemEle = this.popupHTMLElement.querySelector('#' + item.id);
                menuItemEle.classList.add(constants.RIBBON_BACKSTAGE_TEXT_MENU);
            }
        }
    };
    RibbonBackstage.prototype.createBackStagePopup = function (backStageOptions) {
        var _this = this;
        this.popupHTMLElement = this.parent.createElement('div', {
            id: this.parent.element.id + constants.RIBBON_BACKSTAGE_POPUP_ID,
            className: constants.RIBBON_BACKSTAGE_POPUP
        });
        var targetEle;
        if (backStageOptions.target) {
            targetEle = backStageOptions.target instanceof HTMLElement ? backStageOptions.target :
                document.querySelector(backStageOptions.target);
            targetEle.appendChild(this.popupHTMLElement);
        }
        else {
            this.parent.element.appendChild(this.popupHTMLElement);
        }
        this.popupEle = new Popup(this.popupHTMLElement, {
            height: backStageOptions.height,
            width: backStageOptions.width,
            relateTo: backStageOptions.target || this.parent.element,
            enableRtl: this.parent.enableRtl
        });
        if (this.parent.enableRtl) {
            this.updatePopupPositionOnRtl(this.parent.enableRtl);
        }
        this.hideBackstage();
        EventHandler.add(this.popupHTMLElement, 'keyup', function (e) {
            if (e.code === 'Escape') {
                _this.hideBackstage();
            }
            _this.handleNavigation(e);
        }, this);
    };
    RibbonBackstage.prototype.handleNavigation = function (e) {
        var closeBtnEle = this.popupHTMLElement.querySelector('.e-ribbon-close-btn');
        var menuItems = this.popupHTMLElement.querySelectorAll('.e-menu-item');
        var arrowUp = e.key === 'ArrowUp';
        var arrowDown = e.key === 'ArrowDown';
        if (arrowUp || arrowDown) {
            if ((arrowUp && this.menuIndex > 0) || (arrowDown && this.menuIndex < menuItems.length - 1 && !this.isCloseBtn)) {
                this.menuIndex = arrowUp ? this.menuIndex - 1 : this.menuIndex + 1;
            }
            else {
                if (closeBtnEle && !this.isCloseBtn) {
                    closeBtnEle.focus();
                    this.isCloseBtn = true;
                }
                else {
                    this.menuIndex = arrowUp ? menuItems.length - 1 : 0;
                    this.isCloseBtn = false;
                }
            }
            for (var i = 0; i < menuItems.length; i++) {
                menuItems[parseInt(i.toString(), 10)].classList.remove('e-focused');
            }
            if (!this.isCloseBtn) {
                if (arrowUp && menuItems[this.menuIndex].classList.contains('e-separator')) {
                    this.menuIndex--;
                }
                else if (arrowDown && menuItems[this.menuIndex].classList.contains('e-separator')) {
                    this.menuIndex++;
                }
                menuItems[this.menuIndex].classList.add('e-focused');
                menuItems[this.menuIndex].focus();
            }
        }
    };
    RibbonBackstage.prototype.updatePopupPositionOnRtl = function (enableRtl) {
        var popupStyle = this.popupHTMLElement.style;
        if (enableRtl) {
            popupStyle.right = popupStyle.left;
            popupStyle.left = 'unset';
        }
        else {
            popupStyle.left = popupStyle.right;
            popupStyle.right = 'unset';
        }
    };
    RibbonBackstage.prototype.createBackstageMenu = function (menuOptions, isFooter) {
        var _this = this;
        var wrapperEle = this.popupHTMLElement.querySelector('#' + this.parent.element.id + '_wrapper');
        if (!wrapperEle) {
            this.menuWrapper = this.parent.createElement('div', {
                id: this.parent.element.id + '_wrapper',
                className: constants.RIBBON_BACKSTAGE_MENU_WRAPPER
            });
            this.popupHTMLElement.appendChild(this.menuWrapper);
        }
        if (menuOptions.backButton.visible && !isFooter) {
            var closeBtnEle = this.parent.createElement('button', {
                id: this.parent.element.id + '_close',
                className: 'e-ribbon-close-btn'
            });
            this.closeBtn = new Button({
                content: menuOptions.backButton.text,
                iconCss: menuOptions.backButton.iconCss ? menuOptions.backButton.iconCss : constants.BACKSTAGE_CLOSE_ICON,
                enableRtl: this.parent.enableRtl
            }, closeBtnEle);
            this.menuWrapper.append(closeBtnEle);
            closeBtnEle.onclick = function () {
                _this.popupHTMLElement.classList.remove(constants.RIBBON_BACKSTAGE_OPEN);
                _this.hideBackstage();
                _this.isBackButtonClicked = true;
            };
        }
        var itemsWrapperEle = this.popupHTMLElement.querySelector('#' + this.parent.element.id + '_itemswrapper');
        if (!itemsWrapperEle) {
            this.itemsWrapperEle = this.parent.createElement('div', {
                id: this.parent.element.id + '_itemswrapper',
                className: constants.RIBBON_BACKSTAGE_ITEMS_WRAPPER
            });
            this.menuWrapper.append(this.itemsWrapperEle);
        }
        var ulFooterElem;
        if (isFooter) {
            ulFooterElem = this.parent.createElement('ul', {
                id: this.parent.element.id + constants.RIBBON_FOOTER_MENU_LIST
            });
            this.itemsWrapperEle.appendChild(ulFooterElem);
        }
        else {
            this.ulMenuElem = this.parent.createElement('ul', {
                id: this.parent.element.id + constants.RIBBON_MENU_LIST
            });
            this.itemsWrapperEle.appendChild(this.ulMenuElem);
        }
        if (!isFooter) {
            this.menuCtrl = new Menu({
                orientation: 'Vertical',
                enableRtl: this.parent.enableRtl,
                cssClass: constants.RIBBON_BACKSTAGE_MENU,
                items: this.cloneMenuItem(menuOptions.items),
                select: this.menuSelect.bind(this, menuOptions)
            }, this.ulMenuElem);
        }
        else {
            this.footerMenuCtrl = new Menu({
                orientation: 'Vertical',
                enableRtl: this.parent.enableRtl,
                cssClass: constants.RIBBON_BACKSTAGE_MENU,
                items: this.cloneFooterMenuItem(menuOptions.items),
                select: this.menuSelect.bind(this, menuOptions)
            }, ulFooterElem);
        }
    };
    RibbonBackstage.prototype.cloneMenuItem = function (items) {
        var itemsList = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[parseInt(i.toString(), 10)];
            if (item.isFooter) {
                continue;
            }
            else {
                itemsList.push({
                    id: item.id,
                    iconCss: item.iconCss,
                    separator: item.separator,
                    text: item.text
                });
            }
        }
        return itemsList;
    };
    RibbonBackstage.prototype.cloneFooterMenuItem = function (items) {
        var itemsList = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[parseInt(i.toString(), 10)];
            if (!item.isFooter) {
                continue;
            }
            else {
                itemsList.push({
                    id: item.id,
                    iconCss: item.iconCss,
                    separator: item.separator,
                    text: item.text
                });
            }
        }
        return itemsList;
    };
    RibbonBackstage.prototype.createBackStageContent = function (itemId, content) {
        var templateName = 'backstageContent';
        this.clearTemplate([templateName]);
        if (!this.backstageContentEle) {
            this.backstageContentEle = this.parent.createElement('div', {
                id: itemId + constants.CONTENT_ID,
                className: constants.RIBBON_BACKSTAGE_CONTENT
            });
        }
        else {
            this.backstageContentEle.innerHTML = '';
            this.backstageContentEle.id = itemId + constants.CONTENT_ID;
        }
        var templateFunction = getTemplateFunction(content);
        append(templateFunction({}, this, templateName, 'backstageContent', this.parent.isStringTemplate), this.backstageContentEle);
        if (content) {
            this.popupHTMLElement.append(this.backstageContentEle);
        }
        this.renderReactTemplates();
        return templateFunction;
    };
    RibbonBackstage.prototype.createBackStageTemplate = function (template) {
        var templateName = 'backstageTemplate';
        this.clearTemplate([templateName]);
        this.backstageTempEle = this.parent.createElement('div', {
            id: this.parent.element.id + constants.RIBBON_BACKSTAGE_MENU_ID + '_template',
            className: constants.RIBBON_BACKSTAGE_TEMPLATE
        });
        var templateFunction = getTemplateFunction(template);
        append(templateFunction({}, this, templateName, 'backstageTemplate', this.parent.isStringTemplate), this.backstageTempEle);
        this.popupHTMLElement.append(this.backstageTempEle);
        this.renderReactTemplates();
        return templateFunction;
    };
    RibbonBackstage.prototype.menuSelect = function (menuOptions, args) {
        for (var i = 0; i < menuOptions.items.length; i++) {
            var item = menuOptions.items[parseInt(i.toString(), 10)];
            if (item.text === args.item.text) {
                this.contentItem = item;
                this.menuIndex = i;
                break;
            }
        }
        this.createBackStageContent(args.item.id, this.contentItem.content);
        var eventArgs = { cancel: false, target: args.element,
            item: this.contentItem, isBackButton: this.isBackButtonClicked };
        if (this.contentItem.backStageItemClick) {
            this.contentItem.backStageItemClick.call(this, eventArgs);
        }
        if (eventArgs.cancel) {
            return;
        }
    };
    /**
     * setRtl
     *
     * @param {commonProperties} commonProp - Get the common property of ribbon.
     * @returns {void}
     * @hidden
     */
    RibbonBackstage.prototype.setCommonProperties = function (commonProp) {
        if (this.backstageButton) {
            this.backstageButton.setProperties(commonProp);
            if (this.popupEle) {
                this.popupEle.setProperties(commonProp);
                if (this.popupHTMLElement) {
                    this.updatePopupPositionOnRtl(commonProp.enableRtl);
                }
                if (this.menuCtrl) {
                    this.menuCtrl.setProperties(commonProp);
                    if (this.closeBtn) {
                        this.closeBtn.setProperties(commonProp);
                    }
                }
                if (this.footerMenuCtrl) {
                    this.footerMenuCtrl.setProperties(commonProp);
                }
            }
        }
    };
    /**
     * Update Backstage menu
     *
     * @param {BackStageMenuModel} backStageOptions - Gets the property of backstage menu.
     * @returns {void}
     * @hidden
     */
    RibbonBackstage.prototype.updateBackStageMenu = function (backStageOptions) {
        if (backStageOptions.visible) {
            if (this.backstageButton) {
                if (backStageOptions.text) {
                    this.backstageButton.setProperties({
                        content: backStageOptions.text
                    });
                    this.parent.tabObj.element.style.setProperty(constants.RIBBON_FILE_MENU_WIDTH, this.backstageButtonEle.offsetWidth + 'px');
                }
                if (this.popupEle) {
                    this.popupEle.setProperties({
                        height: backStageOptions.height,
                        width: backStageOptions.width,
                        target: backStageOptions.target || this.parent.element
                    });
                }
                if (backStageOptions.template) {
                    if (this.backstageTempEle) {
                        remove(this.backstageTempEle);
                        this.backstageTempEle = null;
                    }
                    this.createBackStageTemplate(backStageOptions.template);
                }
                else {
                    if (this.menuCtrl) {
                        this.menuCtrl.setProperties({
                            items: this.cloneMenuItem(backStageOptions.items)
                        });
                    }
                    if (this.footerMenuCtrl) {
                        this.footerMenuCtrl.setProperties({
                            items: this.cloneFooterMenuItem(backStageOptions.items)
                        });
                    }
                    else {
                        var footerItemCount = 0;
                        var itemCount = 0;
                        for (var i = 0; i < backStageOptions.items.length; i++) {
                            var item = backStageOptions.items[parseInt(i.toString(), 10)];
                            if (item.isFooter) {
                                footerItemCount++;
                            }
                            else {
                                itemCount++;
                            }
                        }
                        if (itemCount > 0) {
                            this.createBackstageMenu(backStageOptions, false);
                        }
                        if (footerItemCount > 0) {
                            this.createBackstageMenu(backStageOptions, true);
                        }
                    }
                }
                this.removeBackstageMenuTooltip();
                this.removeBackstageMenuKeyTip();
                this.addBackStageMenuTooltip(backStageOptions);
                this.addBackStageMenuKeyTip(backStageOptions);
            }
            else {
                this.createBackStage(backStageOptions);
            }
        }
        else if (this.backstageButton) {
            this.destroyDDB();
        }
        this.parent.tabObj.refreshActiveTabBorder();
    };
    RibbonBackstage.prototype.destroyMenu = function () {
        if (this.menuCtrl) {
            this.menuCtrl.destroy();
            this.menuCtrl = null;
        }
    };
    RibbonBackstage.prototype.destroyDDB = function () {
        this.removeBackstageMenuTooltip();
        this.removeBackstageMenuKeyTip();
        var tabEle = this.parent.tabObj.element;
        tabEle.style.removeProperty(constants.RIBBON_FILE_MENU_WIDTH);
        this.destroyMenu();
        this.backstageButton.destroy();
        this.backstageButton = null;
        remove(this.backstageButtonEle);
        this.backstageButtonEle = null;
        EventHandler.remove(document, 'click', this.onClickEvent);
    };
    RibbonBackstage.prototype.removeBackstageMenuTooltip = function () {
        var _this = this;
        var index = getIndex(this.parent.tooltipData, function (e) { return e.id === _this.backstageButtonEle.id; });
        if (index !== -1) {
            this.backstageButtonEle.classList.remove(constants.RIBBON_TOOLTIP_TARGET);
            this.parent.tooltipData.splice(index, 1);
        }
    };
    RibbonBackstage.prototype.removeBackstageMenuKeyTip = function () {
        var _this = this;
        if (this.parent.keyTipElements['backstage'] && this.parent.keyTipElements['backstage'].length) {
            var index = getIndex(this.parent.keyTipElements['backstage'], function (e) { return e.id === _this.backstageButtonEle.id; });
            if (index !== -1) {
                this.parent.keyTipElements['backstage'].splice(index, 1);
            }
        }
        if (this.parent.keyTipElements['backstageMenu'] && this.parent.keyTipElements['backstageMenu'].length) {
            for (var i = 0; i < this.parent.keyTipElements['backstageMenu'].length; i++) {
                this.parent.keyTipElements['backstageMenu'].splice(i, 1);
                i--;
            }
        }
    };
    /**
     * Add items to Backstage Menu.
     *
     * @param {BackstageItemModel[]} items - Gets the items to be added.
     * @param {string} target - Gets the target item to add the items.
     * @param {boolean} isAfter - Gets the boolean value to add the items after or before the target item.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    RibbonBackstage.prototype.addBackstageItems = function (items, target, isAfter, isUniqueId) {
        for (var i = 0; i < items.length; i++) {
            var item = items[parseInt(i.toString(), 10)];
            if (item.isFooter) {
                if (isAfter) {
                    this.footerMenuCtrl.insertAfter(items, target, isUniqueId);
                }
                else {
                    this.footerMenuCtrl.insertBefore(items, target, isUniqueId);
                }
            }
            else {
                if (isAfter) {
                    this.menuCtrl.insertAfter(items, target, isUniqueId);
                }
                else {
                    this.menuCtrl.insertBefore(items, target, isUniqueId);
                }
            }
        }
        var backstageItems = [].concat(this.menuCtrl.items, this.footerMenuCtrl.items);
        var backStageOptions = this.parent.backStageMenu;
        for (var i = 0; i < backStageOptions.items.length; i++) {
            var item = backStageOptions.items[parseInt(i.toString(), 10)];
            for (var i_1 = 0; i_1 < backstageItems.length; i_1++) {
                var item1 = backstageItems[parseInt(i_1.toString(), 10)];
                if (item.text === item1.text) {
                    item1.content = item.content;
                    break;
                }
            }
        }
        this.parent.backStageMenu.setProperties({ items: backstageItems }, true);
    };
    /**
     * Remove items from Backstage Menu.
     *
     * @param {string[]} items - Gets the items to be removed.
     * @param {boolean} isUniqueId - Gets whether the target provided is uniqueId or not.
     * @returns {void}
     */
    RibbonBackstage.prototype.removeBackstageItems = function (items, isUniqueId) {
        this.menuCtrl.removeItems(items, isUniqueId);
        this.footerMenuCtrl.removeItems(items, isUniqueId);
        var backstageItems = [].concat(this.menuCtrl.items, this.footerMenuCtrl.items);
        this.parent.backStageMenu.setProperties({ items: backstageItems }, true);
    };
    /**
     * Renders the backstage dynamically.
     *
     * @returns {void}
     */
    RibbonBackstage.prototype.showBackstage = function () {
        this.popupEle.show();
    };
    /**
     * Hides the backstage dynamically.
     *
     * @returns {void}
     */
    RibbonBackstage.prototype.hideBackstage = function () {
        if (this.popupEle.element.classList.contains(constants.RIBBON_BACKSTAGE_OPEN)) {
            this.popupEle.element.classList.remove(constants.RIBBON_BACKSTAGE_OPEN);
        }
        this.popupEle.hide();
    };
    return RibbonBackstage;
}(Component));
export { RibbonBackstage };
