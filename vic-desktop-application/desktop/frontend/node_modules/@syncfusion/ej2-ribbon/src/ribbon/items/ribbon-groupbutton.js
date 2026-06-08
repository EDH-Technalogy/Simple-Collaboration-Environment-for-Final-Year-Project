import { EventHandler, getComponent, remove } from '@syncfusion/ej2-base';
import * as constants from '../base/constant';
import { Button } from '@syncfusion/ej2-buttons';
import { RibbonGroupButtonSelection, RibbonItemSize } from '../base/interface';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
import { createTooltip, isTooltipPresent, setCustomAttributes } from '../base/utils';
import { Tooltip } from '@syncfusion/ej2-popups';
/**
 * Defines the items of Ribbon.
 */
var RibbonGroupButton = /** @class */ (function () {
    function RibbonGroupButton(parent) {
        this.grpBtnIndex = 0;
        this.parent = parent;
        this.isSelected = false;
    }
    RibbonGroupButton.prototype.getModuleName = function () {
        return 'ribbonGroupButton';
    };
    RibbonGroupButton.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates Group Button
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemElement - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonGroupButton.prototype.createGroupButton = function (item, itemElement) {
        var _this = this;
        var groupBtnSettings = item.groupButtonSettings;
        this.count = 0;
        var btnContainerEle = this.parent.createElement('div', {
            id: item.id + constants.RIBBON_GROUP_BUTTON_ID,
            className: 'e-btn-group'
        });
        itemElement.appendChild(btnContainerEle);
        for (var i = 0; i < groupBtnSettings.items.length; i++) {
            if ((groupBtnSettings.items[parseInt(i.toString(), 10)].iconCss)) {
                var groupButtonEle = this.parent.createElement('button', {
                    id: item.id + constants.RIBBON_GROUP_BUTTON_ID + i,
                    className: constants.RIBBON_GROUP_BUTTON
                });
                btnContainerEle.appendChild(groupButtonEle);
                new Button({
                    iconCss: groupBtnSettings.items[parseInt(i.toString(), 10)].iconCss,
                    disabled: item.disabled,
                    enableRtl: this.parent.enableRtl,
                    content: item.activeSize === RibbonItemSize.Small ? '' : groupBtnSettings.items[parseInt(i.toString(), 10)].content,
                    iconPosition: item.activeSize === RibbonItemSize.Large ? 'Top' : 'Left'
                }, groupButtonEle);
                if (groupBtnSettings.items[parseInt(i.toString(), 10)].htmlAttributes) {
                    setCustomAttributes(groupButtonEle, groupBtnSettings.items[parseInt(i.toString(), 10)].htmlAttributes);
                }
                if (groupBtnSettings.items[parseInt(i.toString(), 10)].content) {
                    groupButtonEle.classList.add(constants.RIBBON_GROUP_BUTTON_CONTENT);
                    groupButtonEle.setAttribute('aria-label', groupBtnSettings.items[parseInt(i.toString(), 10)].content);
                }
                else {
                    groupButtonEle.setAttribute('aria-label', 'groupbuttonitem');
                }
                var buttonEle = itemElement.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + i);
                if (groupBtnSettings.selection === RibbonGroupButtonSelection.Single) {
                    btnContainerEle.classList.add(constants.RIBBON_SINGLE_BUTTON_SELECTION);
                }
                else {
                    btnContainerEle.classList.add(constants.RIBBON_MULTIPLE_BUTTON_SELECTION);
                }
                if (groupBtnSettings.items[parseInt(i.toString(), 10)].selected) {
                    if (groupBtnSettings.selection === RibbonGroupButtonSelection.Multiple) {
                        buttonEle.classList.add('e-active');
                    }
                    else {
                        if (this.count < 1) {
                            buttonEle.classList.add('e-active');
                            this.count++;
                        }
                    }
                    this.grpBtnIndex = i;
                }
                if (groupBtnSettings.items[parseInt(i.toString(), 10)].ribbonTooltipSettings &&
                    isTooltipPresent(groupBtnSettings.items[parseInt(i.toString(), 10)].ribbonTooltipSettings)) {
                    groupButtonEle.classList.add(constants.RIBBON_TOOLTIP_TARGET);
                    this.parent.tooltipData.push({
                        id: groupButtonEle.id, data: groupBtnSettings.items[parseInt(i.toString(), 10)].ribbonTooltipSettings
                    });
                }
                EventHandler.add(buttonEle, 'click', this.groupButtonClicked.bind(this, i, item, groupBtnSettings), this);
            }
        }
        if (this.parent.activeLayout === 'Simplified') {
            var dropdownIcon = void 0;
            var activeEleCount = 0;
            var count = 0;
            var buttonEle = this.parent.createElement('button', {
                id: item.id
            });
            itemElement.appendChild(buttonEle);
            for (var i = 0; i < groupBtnSettings.items.length; i++) {
                if (item.groupButtonSettings.items[parseInt(i.toString(), 10)].selected &&
                    !this.isSelected && groupBtnSettings.selection === RibbonGroupButtonSelection.Single) {
                    dropdownIcon = item.groupButtonSettings.items[parseInt(i.toString(), 10)].iconCss;
                    this.isSelected = true;
                }
                else if (item.groupButtonSettings.items[parseInt(i.toString(), 10)].selected &&
                    groupBtnSettings.selection === RibbonGroupButtonSelection.Multiple) {
                    activeEleCount++;
                    if (activeEleCount === 1) {
                        dropdownIcon = item.groupButtonSettings.items[parseInt(i.toString(), 10)].iconCss;
                    }
                    else {
                        dropdownIcon = null;
                    }
                }
            }
            while (count < item.groupButtonSettings.items.length && !this.isSelected && !dropdownIcon) {
                if (item.groupButtonSettings.items[parseInt(count.toString(), 10)].iconCss) {
                    dropdownIcon = item.groupButtonSettings.items[parseInt(count.toString(), 10)].iconCss;
                    this.isSelected = true;
                }
                count++;
            }
            var dropdown = new DropDownButton({
                iconCss: dropdownIcon,
                target: btnContainerEle,
                enableRtl: this.parent.enableRtl,
                cssClass: 'e-ribbon-dropdown-group-button',
                disabled: item.disabled
            }, buttonEle);
            if (groupBtnSettings.header) {
                var dropDownPopup = dropdown.dropDown;
                this.addGroupButtonHeader(item.id, groupBtnSettings, dropDownPopup.element);
            }
            buttonEle.onclick = buttonEle.onkeydown = function () {
                _this.handleFocusState(item, itemElement);
            };
            btnContainerEle.onkeydown = function (e) {
                if (_this.parent.activeLayout === 'Simplified') {
                    _this.handleGroupButtonNavigation(e, item);
                }
            };
            createTooltip(btnContainerEle, this.parent);
            this.isSelected = false;
        }
    };
    RibbonGroupButton.prototype.groupButtonClicked = function (itemIndex, item, grpBtnSettings) {
        var previousItems = [];
        var selectingItems = [];
        var selectedItems = [];
        var groupButtonEle = document.querySelector('#' + item.id);
        var dropdown;
        for (var j = 0; j < grpBtnSettings.items.length; j++) {
            if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + j)) {
                if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + j).classList.contains('e-active')) {
                    previousItems.push(grpBtnSettings.items[parseInt(j.toString(), 10)]);
                }
            }
        }
        if (!(document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.contains('e-active'))) {
            selectingItems.push(grpBtnSettings.items[parseInt(itemIndex.toString(), 10)]);
        }
        var eventArgs = {
            cancel: false, previousItems: previousItems, selectingItems: selectingItems
        };
        if (grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].beforeClick) {
            grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].beforeClick.call(this, eventArgs);
        }
        if (eventArgs.cancel) {
            return;
        }
        else {
            if (grpBtnSettings.selection === RibbonGroupButtonSelection.Single) {
                if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID).classList.contains(constants.RIBBON_MULTIPLE_BUTTON_SELECTION)) {
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID).classList.remove(constants.RIBBON_MULTIPLE_BUTTON_SELECTION);
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID).classList.add(constants.RIBBON_SINGLE_BUTTON_SELECTION);
                }
                for (var j = 0; j < grpBtnSettings.items.length; j++) {
                    if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + j) && document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + j).classList.contains('e-active')) {
                        document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + j).classList.remove('e-active');
                        grpBtnSettings.items[parseInt(j.toString(), 10)].
                            setProperties({ selected: false }, true);
                    }
                }
                document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.toggle('e-active');
                grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].setProperties({ selected: true }, true);
                if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.contains('e-active') && this.parent.activeLayout === 'Simplified') {
                    this.grpBtnIndex = itemIndex;
                    dropdown = getComponent(groupButtonEle, DropDownButton);
                    dropdown.setProperties({
                        iconCss: grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].iconCss
                    });
                }
            }
            else {
                if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID).classList.contains(constants.RIBBON_SINGLE_BUTTON_SELECTION)) {
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID).classList.remove(constants.RIBBON_SINGLE_BUTTON_SELECTION);
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID).classList.add(constants.RIBBON_MULTIPLE_BUTTON_SELECTION);
                }
                document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.toggle('e-active');
                if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.contains('e-active')) {
                    grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].
                        setProperties({ selected: true }, true);
                }
                else {
                    grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].
                        setProperties({ selected: false }, true);
                }
                var activeEleCount = 0;
                for (var n = 0; n < grpBtnSettings.items.length; n++) {
                    if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + n) && document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + n).classList.contains('e-active') && this.parent.activeLayout === 'Simplified' && n !== itemIndex) {
                        this.isSelected = true;
                        activeEleCount++;
                    }
                }
                if (this.parent.activeLayout === 'Simplified') {
                    var dropdownIcon = null;
                    var itemsCount = 0;
                    dropdown = getComponent(groupButtonEle, DropDownButton);
                    if (!this.isSelected) {
                        if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.contains('e-active')) {
                            dropdownIcon = grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].iconCss;
                        }
                    }
                    else {
                        if (activeEleCount === 1 && !(document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.contains('e-active'))) {
                            for (var n = 0; n < grpBtnSettings.items.length; n++) {
                                if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + n) && document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + n).classList.contains('e-active')) {
                                    dropdownIcon = grpBtnSettings.items[parseInt(n.toString(), 10)].iconCss;
                                }
                            }
                        }
                    }
                    while (itemsCount < grpBtnSettings.items.length && !dropdownIcon) {
                        if (grpBtnSettings.items[parseInt(itemsCount.toString(), 10)].iconCss) {
                            dropdownIcon = grpBtnSettings.items[parseInt(itemsCount.toString(), 10)].iconCss;
                        }
                        itemsCount++;
                    }
                    dropdown.setProperties({ iconCss: dropdownIcon });
                    this.grpBtnIndex = itemIndex;
                }
                this.isSelected = false;
            }
            if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + itemIndex).classList.contains('e-active')) {
                selectedItems.push(grpBtnSettings.items[parseInt(itemIndex.toString(), 10)]);
            }
            var eventArgs_1 = { previousItems: previousItems, selectedItems: selectedItems };
            if (grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].click) {
                grpBtnSettings.items[parseInt(itemIndex.toString(), 10)].click.call(this, eventArgs_1);
            }
            if (this.parent.activeLayout === 'Simplified' && groupButtonEle) {
                dropdown = getComponent(groupButtonEle, DropDownButton);
                dropdown.toggle();
            }
        }
    };
    /**
     * updates group button in mode switching
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemElement - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonGroupButton.prototype.switchGroupButton = function (item, itemElement) {
        var _this = this;
        var groupBtnSettings = item.groupButtonSettings;
        var dropdownIcon = null;
        var activeEleCount = 0;
        var itemsCount = 0;
        if (this.parent.activeLayout === 'Simplified') {
            var containerEle = itemElement.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID);
            var buttonEle = this.parent.createElement('button', {
                id: item.id
            });
            itemElement.appendChild(buttonEle);
            for (var i = 0; i < groupBtnSettings.items.length; i++) {
                if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + i)) {
                    if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + i).classList.contains('e-active') && groupBtnSettings.selection === RibbonGroupButtonSelection.Single) {
                        dropdownIcon = groupBtnSettings.items[parseInt(i.toString(), 10)].iconCss;
                    }
                    else if (document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + i).classList.contains('e-active') && groupBtnSettings.selection === RibbonGroupButtonSelection.Multiple) {
                        activeEleCount++;
                        if (activeEleCount === 1) {
                            dropdownIcon = groupBtnSettings.items[parseInt(i.toString(), 10)].iconCss;
                        }
                        else if (activeEleCount > 1) {
                            dropdownIcon = null;
                        }
                    }
                }
            }
            while (itemsCount < groupBtnSettings.items.length && !dropdownIcon) {
                if (groupBtnSettings.items[parseInt(itemsCount.toString(), 10)].iconCss) {
                    dropdownIcon = groupBtnSettings.items[parseInt(itemsCount.toString(), 10)].iconCss;
                }
                itemsCount++;
            }
            var dropdown = new DropDownButton({
                iconCss: dropdownIcon,
                target: containerEle,
                enableRtl: this.parent.enableRtl,
                cssClass: 'e-ribbon-dropdown-group-button',
                disabled: item.disabled
            }, buttonEle);
            if (groupBtnSettings.header) {
                var dropDownPopup = dropdown.dropDown;
                this.addGroupButtonHeader(item.id, groupBtnSettings, dropDownPopup.element);
            }
            buttonEle.onclick = buttonEle.onkeydown = function () {
                _this.handleFocusState(item, itemElement);
            };
            containerEle.onkeydown = function (e) {
                if (_this.parent.activeLayout === 'Simplified') {
                    _this.handleGroupButtonNavigation(e, item);
                }
            };
            createTooltip(containerEle, this.parent);
        }
        else {
            var groupButtonEle = itemElement.querySelector('#' + item.id);
            var dropdown = getComponent(groupButtonEle, DropDownButton);
            itemElement.appendChild(dropdown.target);
            if (groupButtonEle) {
                dropdown.destroy();
                remove(groupButtonEle);
            }
        }
    };
    RibbonGroupButton.prototype.handleFocusState = function (item, itemElement) {
        if (itemElement.querySelector('#' + item.id).classList.contains('e-active')) {
            var defaultSelectedBtn = document.querySelector('#' + item.id + '_grpbtn').querySelector('.' + constants.RIBBON_GROUP_BUTTON + '.e-active');
            if (defaultSelectedBtn) {
                defaultSelectedBtn.focus();
            }
            else {
                document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + 0).focus();
            }
        }
    };
    RibbonGroupButton.prototype.addGroupButtonHeader = function (itemID, groupBtnSettings, popupEle) {
        var groupButtonHeader = this.parent.createElement('div', {
            className: 'e-ribbon-groupbutton-header',
            id: itemID + constants.HEADER_ID,
            innerHTML: groupBtnSettings.header
        });
        popupEle.insertBefore(groupButtonHeader, popupEle.firstChild);
    };
    RibbonGroupButton.prototype.handleGroupButtonNavigation = function (e, item) {
        var groupButtonEle = document.querySelector('#' + item.id);
        var dropdown = getComponent(groupButtonEle, DropDownButton);
        var targetEle = dropdown.target;
        var isOverflowPopup = false;
        if (this.parent.activeLayout === 'Simplified' && targetEle.closest('.e-ribbon-dropdown-group-button').classList.contains(constants.RIBBON_GROUP_BUTTON_OVERFLOW_POPUP)) {
            isOverflowPopup = true;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
        }
        var groupBtnSettings = item.groupButtonSettings;
        if ((e.key === 'ArrowRight' && !isOverflowPopup) || (e.key === 'ArrowDown' && isOverflowPopup)) {
            if (!this.parent.enableRtl || (e.key === 'ArrowDown' && isOverflowPopup)) {
                this.grpBtnIndex++;
                if (this.grpBtnIndex < groupBtnSettings.items.length) {
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
                else {
                    this.grpBtnIndex = 0;
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
            }
            else {
                if (this.grpBtnIndex === 0) {
                    this.grpBtnIndex = groupBtnSettings.items.length - 1;
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
                else {
                    this.grpBtnIndex--;
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
            }
        }
        else if ((e.key === 'ArrowLeft' && !isOverflowPopup) || (e.key === 'ArrowUp' && isOverflowPopup)) {
            if (!this.parent.enableRtl || (e.key === 'ArrowUp' && isOverflowPopup)) {
                if (this.grpBtnIndex === 0) {
                    this.grpBtnIndex = groupBtnSettings.items.length - 1;
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
                else {
                    this.grpBtnIndex--;
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
            }
            else {
                this.grpBtnIndex++;
                if (this.grpBtnIndex < groupBtnSettings.items.length) {
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
                else {
                    this.grpBtnIndex = 0;
                    document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + (this.grpBtnIndex)).focus();
                }
            }
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
    RibbonGroupButton.prototype.addOverFlowEvents = function (item, itemEle, overflowButton) {
        var _this = this;
        var groupBtnSettings = item.groupButtonSettings;
        var isIconOnly = true;
        var groupButtonEle = itemEle.querySelector('#' + item.id);
        if (groupButtonEle) {
            var dropdown = getComponent(groupButtonEle, DropDownButton);
            dropdown.setProperties({ cssClass: dropdown.cssClass + constants.SPACE + constants.RIBBON_GROUP_BUTTON_OVERFLOW_POPUP, content: groupBtnSettings.header ? groupBtnSettings.header : '' });
            var targetEle_1 = dropdown.target;
            if (targetEle_1.children.length) {
                for (var i = 0; i < targetEle_1.children.length; i++) {
                    if (groupBtnSettings.items[parseInt(i.toString(), 10)].content) {
                        isIconOnly = false;
                        break;
                    }
                }
                if (isIconOnly) {
                    targetEle_1.classList.add('e-icon-btn');
                }
            }
            targetEle_1.onclick = function () {
                if (_this.parent.activeLayout === 'Simplified' && targetEle_1.closest('.e-ribbon-dropdown-group-button').classList.contains(constants.RIBBON_GROUP_BUTTON_OVERFLOW_POPUP)) {
                    if (overflowButton.element.classList.contains('e-active')) {
                        overflowButton.toggle();
                    }
                }
            };
        }
        var overflowGroupButtonEle = itemEle.querySelector('#' + item.id + '_grpbtn');
        if (this.parent.activeLayout === 'Classic' && overflowGroupButtonEle) {
            overflowGroupButtonEle.onclick = function () {
                if (overflowButton.element.classList.contains('e-active')) {
                    overflowButton.toggle();
                }
            };
        }
    };
    /**
     * Removes the additional event handlers as the item moved into overflow popup.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonGroupButton.prototype.removeOverFlowEvents = function (item, itemEle) {
        var groupButtonEle = itemEle.querySelector('#' + item.id);
        if (groupButtonEle) {
            var dropdown = getComponent(groupButtonEle, DropDownButton);
            var targetEle = dropdown.target;
            if (targetEle.classList.contains('e-icon-btn')) {
                targetEle.classList.remove('e-icon-btn');
            }
            var cssClass = dropdown.cssClass.split(constants.SPACE);
            cssClass = cssClass.filter(function (value) { return value !== constants.RIBBON_GROUP_BUTTON_OVERFLOW_POPUP; });
            dropdown.setProperties({ cssClass: cssClass.join(constants.SPACE), content: '' });
        }
    };
    /**
     * Removes DropDown.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item.
     * @returns {void}
     * @hidden
     */
    RibbonGroupButton.prototype.destroyDropDown = function (item) {
        var groupButtonEle = document.querySelector('#' + item.id);
        if (groupButtonEle) {
            var dropdown = getComponent(groupButtonEle, DropDownButton);
            var tooltip = getComponent(dropdown.target, Tooltip);
            tooltip.destroy();
            dropdown.destroy();
            remove(groupButtonEle);
        }
    };
    /**
     * Updates the group button size.
     *
     * @param {HTMLElement} itemElement - Gets the group button container element.
     * @param {RibbonItemModel} item - Gets the ribbon item.
     * @returns {void}
     * @hidden
     */
    RibbonGroupButton.prototype.updateGroupButtonSize = function (itemElement, item) {
        var groupBtnSettings = item.groupButtonSettings;
        var buttonEle;
        for (var i = 0; i < groupBtnSettings.items.length; i++) {
            if (this.parent.activeLayout === 'Classic') {
                buttonEle = itemElement.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + i);
            }
            else {
                buttonEle = document.querySelector('#' + item.id + constants.RIBBON_GROUP_BUTTON_ID + i);
            }
            if (buttonEle) {
                var buttonObj = getComponent(buttonEle, Button);
                buttonObj.setProperties({
                    iconPosition: item.activeSize === RibbonItemSize.Large ? 'Top' : 'Left',
                    content: item.activeSize === RibbonItemSize.Small ? '' : groupBtnSettings.items[parseInt(i.toString(), 10)].content
                });
            }
        }
    };
    return RibbonGroupButton;
}());
export { RibbonGroupButton };
