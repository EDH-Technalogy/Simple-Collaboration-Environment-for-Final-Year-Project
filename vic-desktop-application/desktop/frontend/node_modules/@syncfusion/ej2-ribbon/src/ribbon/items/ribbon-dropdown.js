import { closest, getComponent, isNullOrUndefined, merge, remove } from '@syncfusion/ej2-base';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
import { Tooltip } from '@syncfusion/ej2-popups';
import { getItem, getItemElement, RibbonItemSize, createTooltip, setCustomAttributes } from '../base/index';
import { DROPDOWN_ID, ITEM_VERTICAL_CENTER, OVERFLOW_ID, RIBBON_CONTROL, RIBBON_GROUP_OVERFLOW_DDB, RIBBON_POPUP_CONTROL, SPACE, VERTICAL_DDB } from '../base/constant';
/**
 * Defines the items of Ribbon.
 */
var RibbonDropDown = /** @class */ (function () {
    function RibbonDropDown(parent) {
        this.parent = parent;
    }
    RibbonDropDown.prototype.getModuleName = function () {
        return 'ribbonDropDown';
    };
    RibbonDropDown.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates DropDown.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonDropDown.prototype.createDropDown = function (item, itemEle) {
        var _this = this;
        var buttonEle = this.parent.createElement('button', {
            id: item.id
        });
        itemEle.appendChild(buttonEle);
        var dropDownSettings = item.dropDownSettings;
        var cssClass = (ITEM_VERTICAL_CENTER + SPACE + RIBBON_CONTROL + SPACE + (dropDownSettings.cssClass ?
            dropDownSettings.cssClass : '')).trim();
        new DropDownButton({
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            iconPosition: item.activeSize === RibbonItemSize.Large ? 'Top' : 'Left',
            closeActionEvents: dropDownSettings.closeActionEvents,
            content: item.activeSize === RibbonItemSize.Small ? '' : dropDownSettings.content,
            cssClass: cssClass + ((item.activeSize === RibbonItemSize.Large) ? (SPACE + VERTICAL_DDB) : ''),
            disabled: item.disabled,
            iconCss: dropDownSettings.iconCss,
            items: dropDownSettings.items,
            target: dropDownSettings.target,
            createPopupOnClick: dropDownSettings.createPopupOnClick,
            beforeClose: function (e) {
                if (dropDownSettings.beforeClose) {
                    dropDownSettings.beforeClose.call(_this, e);
                }
            },
            beforeItemRender: dropDownSettings.beforeItemRender,
            beforeOpen: function (e) {
                var ddb = getComponent(buttonEle, DropDownButton);
                var target = _this.parent.getAppendToElement();
                if (ddb && ddb.dropDown && !target.contains(ddb.dropDown.element)) {
                    target.appendChild(ddb.dropDown.element);
                }
                if (dropDownSettings.beforeOpen) {
                    dropDownSettings.beforeOpen.call(_this, e);
                }
            },
            close: function (e) {
                if (dropDownSettings.close) {
                    dropDownSettings.close.call(_this, e);
                }
            },
            created: dropDownSettings.created,
            open: dropDownSettings.open,
            select: dropDownSettings.select
        }).appendTo(buttonEle);
        if (dropDownSettings.htmlAttributes) {
            if (dropDownSettings.htmlAttributes.id) {
                delete dropDownSettings.htmlAttributes.id;
            }
            setCustomAttributes(buttonEle, dropDownSettings.htmlAttributes);
        }
    };
    /**
     * Adds the additional event handlers as the item moved into overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @param {DropDownButton} overflowButton - Gets the overflow button.
     * @returns {void}
     * @hidden
     */
    RibbonDropDown.prototype.addOverFlowEvents = function (item, itemEle, overflowButton) {
        var _this = this;
        var dropdownElement = itemEle.querySelector('#' + item.id);
        dropdownElement.setAttribute('data-control', item.type.toString());
        var dropdown = getComponent(dropdownElement, DropDownButton);
        dropdown.cssClass = dropdown.cssClass + SPACE + RIBBON_POPUP_CONTROL;
        dropdown.dataBind();
        var target;
        dropdown.beforeClose = function (e) {
            if (item.dropDownSettings.beforeClose) {
                item.dropDownSettings.beforeClose.call(_this, e);
            }
            target = e.event ? e.event.target : null;
        };
        dropdown.close = function (e) {
            if (item.dropDownSettings.close) {
                item.dropDownSettings.close.call(_this, e);
            }
            if (target && !target.closest('.e-ribbon-group-overflow-ddb')) {
                if (overflowButton.element.classList.contains('e-active')) {
                    overflowButton.toggle();
                }
            }
        };
    };
    /**
     * Removes the additional event handlers as the item moved from overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonDropDown.prototype.removeOverFlowEvents = function (item, itemEle) {
        var _this = this;
        var dropdownElement = itemEle.querySelector('#' + item.id);
        var dropdown = getComponent(dropdownElement, DropDownButton);
        var cssClass = dropdown.cssClass.split(SPACE);
        cssClass = cssClass.filter(function (value) { return value !== RIBBON_POPUP_CONTROL; });
        dropdown.cssClass = cssClass.join(SPACE);
        dropdown.dataBind();
        dropdown.close = function (e) {
            if (item.dropDownSettings.close) {
                item.dropDownSettings.close.call(_this, e);
            }
        };
        dropdown.beforeClose = function (e) {
            if (item.dropDownSettings.beforeClose) {
                item.dropDownSettings.beforeClose.call(_this, e);
            }
        };
    };
    /**
     * Creates Overflow DropDown.
     *
     * @param {string} id - Gets the ID of the dropdown item.
     * @param {string} name - Gets the name of the dropdown item.
     * @param {string} iconCss - Gets the icon of the dropdown item.
     * @param {HTMLElement} groupEle - Gets the overflow group element.
     * @param {HTMLElement} overflowEle - Gets the overflow element.
     * @returns {void}
     * @hidden
     */
    RibbonDropDown.prototype.createOverFlowDropDown = function (id, name, iconCss, groupEle, overflowEle, enableRtl) {
        var _this = this;
        this.enableRtl = enableRtl;
        var buttonEle = this.parent.createElement('button', {
            id: id + OVERFLOW_ID + DROPDOWN_ID
        });
        groupEle.setAttribute('tabindex', '0');
        overflowEle.appendChild(buttonEle);
        var dropdown = new DropDownButton({
            iconCss: iconCss,
            target: groupEle,
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            cssClass: VERTICAL_DDB + SPACE + RIBBON_GROUP_OVERFLOW_DDB,
            iconPosition: 'Top',
            content: name,
            beforeOpen: function () {
                var target = _this.parent.getAppendToElement();
                if (dropdown && dropdown.dropDown && !target.contains(dropdown.dropDown.element)) {
                    target.appendChild(dropdown.dropDown.element);
                }
            },
            beforeClose: function (args) {
                args.cancel = !isNullOrUndefined(args.event && closest(args.event.target, '.' + RIBBON_POPUP_CONTROL));
            }
        }, buttonEle);
        createTooltip(groupEle, this.parent);
        buttonEle.onclick = buttonEle.onkeydown = function () { _this.itemIndex = 0; };
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        groupEle.onkeydown = function (e) { _this.keyActionHandler(e, groupEle), _this; };
        return dropdown;
    };
    RibbonDropDown.prototype.keyActionHandler = function (e, target) {
        var controlElements = Array.prototype.slice.call(target.querySelectorAll('.e-control'));
        var templateElements = Array.prototype.slice.call(target.querySelectorAll('.e-ribbon-template'));
        var items = controlElements.concat(templateElements);
        var comboBoxElements = target.querySelectorAll('.e-combobox');
        var comboBoxEle;
        if (comboBoxElements) {
            for (var i = 0; i < comboBoxElements.length; i++) {
                if (comboBoxElements[parseInt(i.toString(), 10)].closest('.e-input-focus')) {
                    comboBoxEle = comboBoxElements[parseInt(i.toString(), 10)];
                }
            }
        }
        if (comboBoxEle) {
            for (var i = 0; i < items.length; i++) {
                if (items[parseInt(i.toString(), 10)].classList.contains('e-combobox')) {
                    if (items[parseInt(i.toString(), 10)].closest('.e-input-focus')) {
                        this.itemIndex = i;
                    }
                }
            }
        }
        if (e.target.classList.contains('e-control') || e.target.classList.contains('e-ribbon-template') || e.target.classList.contains('e-ribbon-launcher-icon') ||
            e.target.classList.contains('e-ribbon-last-item') || e.target.classList.contains('e-ribbon-first-item')) {
            if (e.key === 'ArrowRight' || (!e.shiftKey && e.key === 'Tab')) {
                this.handleNavigation(e, !this.enableRtl, items);
            }
            if (e.key === 'ArrowLeft' || (e.shiftKey && e.key === 'Tab')) {
                this.handleNavigation(e, this.enableRtl, items);
            }
        }
    };
    RibbonDropDown.prototype.handleNavigation = function (e, enableRtl, items) {
        if (!(items[0].classList.contains('e-ribbon-first-item'))) {
            items[0].classList.add('e-ribbon-first-item');
        }
        if (!(items[items.length - 1].classList.contains('e-ribbon-last-item'))) {
            items[items.length - 1].classList.add('e-ribbon-last-item');
        }
        if (enableRtl) {
            if (this.itemIndex === 0 && items[parseInt(this.itemIndex.toString(), 10)].classList.contains('e-ribbon-first-item')) {
                this.updateItemIndex(e, items, true);
            }
            if (!e.target.classList.contains('e-combobox') && !e.target.classList.contains('e-ribbon-last-item') &&
                !e.target.classList.contains('e-ribbon-group-container') && (e.target.classList.contains('e-ribbon-first-item')
                || this.itemIndex !== 0) && (e.target.classList.contains('e-control') || e.target.classList.contains('e-ribbon-template'))) {
                this.itemIndex++;
                this.updateItemIndex(e, items, true);
            }
            if (e.target.classList.contains('e-ribbon-last-item')) {
                var launcherIcon = false;
                launcherIcon = this.focusLauncherIcon(e, items);
                if (!launcherIcon) {
                    this.itemIndex = 0;
                    this.updateItemIndex(e, items, true);
                }
            }
            if (e.target.classList.contains('e-ribbon-launcher-icon')) {
                this.itemIndex = 0;
                this.updateItemIndex(e, items, true);
            }
        }
        else {
            if (!e.target.classList.contains('e-combobox') && this.itemIndex !== 0) {
                this.itemIndex--;
                this.updateItemIndex(e, items, false);
            }
            if (e.target.classList.contains('e-ribbon-first-item')) {
                var launcherIcon = false;
                launcherIcon = this.focusLauncherIcon(e, items);
                if (!launcherIcon) {
                    this.itemIndex = items.length - 1;
                    this.updateItemIndex(e, items, false);
                }
            }
            if (e.target.classList.contains('e-ribbon-launcher-icon')) {
                this.itemIndex = items.length - 1;
                this.updateItemIndex(e, items, false);
            }
        }
        if (e.target.classList.contains('e-combobox') && (e.key === 'Tab')) {
            if (enableRtl) {
                if (this.itemIndex < items.length - 1) {
                    this.itemIndex++;
                }
            }
            else {
                if (this.itemIndex > 0) {
                    this.itemIndex--;
                }
            }
        }
    };
    RibbonDropDown.prototype.focusLauncherIcon = function (e, items) {
        var groupContainer = items[parseInt(this.itemIndex.toString(), 10)].closest('.e-ribbon-group-container');
        var launcherIconEle;
        if (groupContainer) {
            launcherIconEle = groupContainer.querySelector('.e-ribbon-launcher-icon');
        }
        if (launcherIconEle) {
            if (e.key === 'Tab') {
                e.preventDefault();
            }
            groupContainer.querySelector('.e-ribbon-launcher-icon').focus();
            return true;
        }
        else {
            return false;
        }
    };
    RibbonDropDown.prototype.updateItemIndex = function (e, items, enableRtl) {
        var ribbonItem = items[this.itemIndex].closest('.e-ribbon-item');
        while (ribbonItem && ribbonItem.classList.contains('e-disabled')) {
            if (enableRtl) {
                if (this.itemIndex < items.length - 1) {
                    this.itemIndex++;
                }
                else {
                    var launcherIcon = false;
                    launcherIcon = this.focusLauncherIcon(e, items);
                    if (launcherIcon) {
                        break;
                    }
                    this.itemIndex = 0;
                }
            }
            else {
                if (this.itemIndex > 0) {
                    this.itemIndex--;
                }
                else {
                    var launcherIcon = false;
                    launcherIcon = this.focusLauncherIcon(e, items);
                    if (launcherIcon) {
                        break;
                    }
                    this.itemIndex = items.length - 1;
                }
            }
            ribbonItem = items[this.itemIndex].closest('.e-ribbon-item');
        }
        if (e.key === 'Tab') {
            e.preventDefault();
        }
        items[parseInt(this.itemIndex.toString(), 10)].focus();
    };
    /**
     * Removes Overflow DropDown.
     *
     * @param {HTMLElement} dropdownElement - Gets the ribbon DropDown element.
     * @returns {void}
     * @hidden
     */
    RibbonDropDown.prototype.removeOverFlowDropDown = function (dropdownElement) {
        var dropdown = getComponent(dropdownElement, DropDownButton);
        var tooltip = getComponent(dropdown.target, Tooltip);
        tooltip.destroy();
        dropdownElement.parentElement.parentElement.insertBefore(dropdown.target, dropdownElement.parentElement);
        dropdown.destroy();
        remove(dropdownElement);
    };
    /**
     * Gets DropDown item element.
     *
     * @param {HTMLElement} dropdownElement - Gets the ribbon DropDown element.
     * @param {string} id - Gets the ID of ribbon DropDown element.
     * @returns {HTMLElement} - Returns the DropDown item element.
     * @hidden
     */
    RibbonDropDown.prototype.getDDBItemElement = function (dropdownElement, id) {
        var dropdown = getComponent(dropdownElement, DropDownButton);
        var dropDownPopup = dropdown.dropDown.element;
        return dropDownPopup.querySelector('#' + id);
    };
    /**
     * Gets Overflow DropDown Popup.
     *
     * @param {itemProps} itemProp - Gets the property of ribbon item.
     * @param {HTMLElement} contentEle - Gets the content element.
     * @returns {HTMLElement} - Returns the Overflow DropDown Popup.
     * @hidden
     */
    RibbonDropDown.prototype.getOverflowDropDownPopup = function (itemProp, contentEle) {
        var dropdownElement = contentEle.querySelector('#' + this.parent.tabs[itemProp.tabIndex].groups[itemProp.groupIndex].id + OVERFLOW_ID + DROPDOWN_ID);
        var dropdown = getComponent(dropdownElement, DropDownButton);
        return dropdown.dropDown.element;
    };
    RibbonDropDown.prototype.getDropDownObj = function (controlId) {
        var dropDownEle = getItemElement(this.parent, controlId);
        return dropDownEle ? getComponent(dropDownEle, DropDownButton) : null;
    };
    /**
     * Adds a new item to the menu. By default, new item appends to
     * the list as the last item, but you can insert based on the text parameter.
     *
     * @param {string} controlId - Gets the control ID.
     * @param {ItemModel[]} Items - Gets the DropDown items.
     * @param {string} text - Gets the text of the dropdown item where the new item needs to be inserted.
     * @returns {void}
     */
    RibbonDropDown.prototype.addItems = function (controlId, Items, text) {
        this.getDropDownObj(controlId).addItems(Items, text);
    };
    /**
     * Removes the items from the menu.
     *
     * @param {string} controlId - Gets the control ID.
     * @param {string[]} Items -
     * @param {string} isUniqueId -
     * @returns {void}
     */
    RibbonDropDown.prototype.removeItems = function (controlId, Items, isUniqueId) {
        this.getDropDownObj(controlId).removeItems(Items, isUniqueId);
    };
    /**
     * To open/close DropDownButton popup based on current state of the DropDownButton.
     *
     * @param {string} controlId - Gets the control ID.
     * @returns {void}
     */
    RibbonDropDown.prototype.toggle = function (controlId) {
        var dropdownObj = this.getDropDownObj(controlId);
        if (!dropdownObj) {
            return;
        }
        if (!dropdownObj.disabled) {
            dropdownObj.toggle();
        }
    };
    /**
     * Updates the dropdown.
     *
     * @param {RibbonDropDownSettingsModel} prop - Gets the dropdown property.
     * @param {string} id - Gets the ID of dropdown.
     * @returns {void}
     */
    RibbonDropDown.prototype.updateDropDown = function (prop, id) {
        var itemProp = getItem(this.parent.tabs, id);
        if (!itemProp) {
            return;
        }
        merge(itemProp.item.dropDownSettings, prop);
        var btnEle = getItemElement(this.parent, id, itemProp);
        if (!btnEle) {
            return;
        }
        var control = getComponent(btnEle, DropDownButton);
        if (prop.cssClass) {
            prop.cssClass = (RIBBON_CONTROL + SPACE + ITEM_VERTICAL_CENTER + SPACE + prop.cssClass).trim();
            prop.cssClass = itemProp.item.activeSize === RibbonItemSize.Large ?
                (VERTICAL_DDB + SPACE + prop.cssClass).trim() : prop.cssClass;
            control.cssClass = prop.cssClass;
        }
        delete prop.close;
        delete prop.beforeClose;
        if (prop.content) {
            prop.content = itemProp.item.activeSize === RibbonItemSize.Small ? '' : prop.content;
        }
        control.setProperties(prop);
    };
    /**
     * Updated DropDown size
     *
     * @param {HTMLElement} element - Gets the dropdown element.
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @returns {void}
     * @hidden
     */
    RibbonDropDown.prototype.updateDropDownSize = function (element, item) {
        var control = getComponent(element, DropDownButton);
        var cssClass = control.cssClass.split(SPACE);
        if (item.activeSize === RibbonItemSize.Large) {
            cssClass.push(VERTICAL_DDB);
        }
        else {
            cssClass = cssClass.filter(function (value) { return value !== VERTICAL_DDB; });
        }
        control.cssClass = cssClass.join(SPACE);
        control.setProperties({ iconPosition: item.activeSize === RibbonItemSize.Large ? 'Top' : 'Left' });
        control.setProperties({ content: item.activeSize === RibbonItemSize.Small ? '' : item.dropDownSettings.content });
    };
    return RibbonDropDown;
}());
export { RibbonDropDown };
