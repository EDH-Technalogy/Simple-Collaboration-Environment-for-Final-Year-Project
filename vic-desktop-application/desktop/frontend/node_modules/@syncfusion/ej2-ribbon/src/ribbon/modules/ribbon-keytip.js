import { getGroup, getItem } from '../base/utils';
import { getIndex } from '../base/index';
import * as constants from '../base/constant';
import { Popup } from '@syncfusion/ej2-popups';
import { getInstance, remove } from '@syncfusion/ej2-base';
import { DropDownButton } from '@syncfusion/ej2-splitbuttons';
/**
 * Defines the keytip of Ribbon.
 */
var RibbonKeyTip = /** @class */ (function () {
    function RibbonKeyTip(parent) {
        this.isKeytipPopupOpen = false;
        this.parent = parent;
    }
    RibbonKeyTip.prototype.getModuleName = function () {
        return 'ribbonKeyTip';
    };
    RibbonKeyTip.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates the keytips.
     *
     * @param {string} key - get's the keytip type.
     * @returns {void}
     * @hidden
     */
    RibbonKeyTip.prototype.createKeytip = function (key) {
        if (this.parent.keyTipElements) {
            var keytipData = void 0;
            if (key === 'tab') {
                for (var i = 0; i < this.parent.tabs.length; i++) {
                    if (this.parent.keyTipElements[parseInt(i.toString(), 10)]) {
                        keytipData = this.parent.keyTipElements[parseInt(i.toString(), 10)]["" + key];
                        this.createKeyTipElement((keytipData[0].id), keytipData[0].keyTip, 'tab', 'center', 'bottom', true);
                    }
                }
                if (this.parent.keyTipElements['filemenu']) {
                    keytipData = this.parent.keyTipElements['filemenu'];
                    this.createKeyTipElement((keytipData[0].id), keytipData[0].keyTip, 'filemenu');
                }
                if (this.parent.keyTipElements['backstage']) {
                    keytipData = this.parent.keyTipElements['backstage'];
                    this.createKeyTipElement((keytipData[0].id), keytipData[0].keyTip, 'backstage');
                }
                if (this.parent.keyTipElements['collapse']) {
                    keytipData = this.parent.keyTipElements['collapse'];
                    this.createKeyTipElement((keytipData[0].id), keytipData[0].keyTip, 'collapse');
                }
                if (this.parent.keyTipElements['taboverflow']) {
                    keytipData = this.parent.keyTipElements['taboverflow'];
                    this.createKeyTipElement((keytipData[0].id), keytipData[0].keyTip, 'taboverflow');
                }
            }
            else if (key === 'popupitem') {
                if (this.parent.keyTipElements[this.parent.selectedTab]['popupitem']) {
                    var popupKeyTipData = this.parent.keyTipElements[this.parent.selectedTab]['popupitem'];
                    for (var i = 0; i < Object.keys(this.parent.keyTipElements[this.parent.selectedTab]['popupitem']).length; i++) {
                        this.createKeyTipElement((popupKeyTipData[parseInt(i.toString(), 10)].id), popupKeyTipData[parseInt(i.toString(), 10)].keyTip, 'popupitem', 'left', 'top', false, true);
                    }
                }
            }
            else if (key === 'backstageMenu') {
                if (this.parent.keyTipElements['backstageMenu']) {
                    var backstageKeyTipData = this.parent.keyTipElements['backstageMenu'];
                    for (var i = 0; i < Object.keys(this.parent.keyTipElements['backstageMenu']).length; i++) {
                        this.createKeyTipElement((backstageKeyTipData[parseInt(i.toString(), 10)].id), backstageKeyTipData[parseInt(i.toString(), 10)].keyTip, 'backstageMenu', 'left', 'center');
                    }
                }
            }
            else if (key === 'grpoverflowpopup' && this.parent.activeLayout === 'Classic') {
                if (this.parent.keyTipElements[this.parent.selectedTab]['grpoverflowpopup']) {
                    this.calculateItemPosition(key);
                }
                if (this.parent.keyTipElements[this.parent.selectedTab]['launcher']) {
                    for (var i = 0; i < Object.keys(this.parent.keyTipElements[this.parent.selectedTab]['launcher']).length; i++) {
                        keytipData = this.parent.keyTipElements[this.parent.selectedTab]['launcher'];
                        this.createKeyTipElement((keytipData[parseInt(i.toString(), 10)].id), keytipData[parseInt(i.toString(), 10)].keyTip, 'launcher', 'center', 'bottom', false, true);
                    }
                }
            }
            else {
                this.calculateItemPosition(key);
                if (this.parent.activeLayout === 'Classic') {
                    if (this.parent.keyTipElements[this.parent.selectedTab]['launcher']) {
                        for (var i = 0; i < Object.keys(this.parent.keyTipElements[this.parent.selectedTab]['launcher']).length; i++) {
                            keytipData = this.parent.keyTipElements[this.parent.selectedTab]['launcher'];
                            this.createKeyTipElement((keytipData[parseInt(i.toString(), 10)].id), keytipData[parseInt(i.toString(), 10)].keyTip, 'launcher');
                        }
                    }
                    if (this.parent.keyTipElements[this.parent.selectedTab]['grpoverflow']) {
                        for (var i = 0; i < Object.keys(this.parent.keyTipElements[this.parent.selectedTab]['grpoverflow']).length; i++) {
                            keytipData = this.parent.keyTipElements[this.parent.selectedTab]['grpoverflow'];
                            this.createKeyTipElement((keytipData[parseInt(i.toString(), 10)].id), keytipData[parseInt(i.toString(), 10)].keyTip, 'grpoverflow');
                        }
                    }
                }
                if (this.parent.activeLayout === 'Simplified') {
                    if (this.parent.keyTipElements['overflowbtn']) {
                        keytipData = this.parent.keyTipElements['overflowbtn'];
                        this.createKeyTipElement((keytipData[0].id), keytipData[0].keyTip, 'overflowbtn');
                    }
                    if (this.parent.keyTipElements[this.parent.selectedTab]['grpofbtn']) {
                        for (var i = 0; i < Object.keys(this.parent.keyTipElements[this.parent.selectedTab]['grpofbtn']).length; i++) {
                            keytipData = this.parent.keyTipElements[this.parent.selectedTab]['grpofbtn'];
                            this.createKeyTipElement((keytipData[parseInt(i.toString(), 10)].id), keytipData[parseInt(i.toString(), 10)].keyTip, 'grpofbtn');
                        }
                    }
                }
            }
        }
    };
    RibbonKeyTip.prototype.calculateItemPosition = function (key, isMethod, keyTip) {
        if (isMethod === void 0) { isMethod = false; }
        var xOffset;
        var yOffset;
        var keytipData = this.parent.keyTipElements[parseInt(this.parent.selectedTab.toString(), 10)]["" + key];
        if (keytipData) {
            for (var i = 0; i < Object.keys(this.parent.keyTipElements[parseInt(this.parent.selectedTab.toString(), 10)]["" + key]).length; i++) {
                if ((isMethod && (keytipData[parseInt(i.toString(), 10)].keyTip === keyTip)) || !isMethod) {
                    var itemID = keytipData[parseInt(i.toString(), 10)].id;
                    if (keytipData[parseInt(i.toString(), 10)].id.indexOf('_grpbtn') !== -1) {
                        itemID = keytipData[parseInt(i.toString(), 10)].id.replace(/_grpbtn\d+/, '');
                    }
                    var itemProp = getItem(this.parent.tabs, itemID);
                    if (itemProp && itemProp.group.orientation === 'Column' && itemProp.collection.items.length > 1 && this.parent.activeLayout !== 'Simplified') {
                        if (itemProp.itemIndex === 0) {
                            xOffset = 'center';
                            yOffset = 'top';
                        }
                        else if (itemProp.itemIndex === 1) {
                            xOffset = 'center';
                            yOffset = 'center';
                        }
                        else {
                            xOffset = 'center';
                            yOffset = 'bottom';
                        }
                    }
                    else if (itemProp && itemProp.group.orientation === 'Row' && itemProp.group.collections.length > 1 && this.parent.activeLayout !== 'Simplified') {
                        if (itemProp.collectionIndex === 0) {
                            xOffset = 'center';
                            yOffset = 'top';
                        }
                        else {
                            xOffset = 'center';
                            yOffset = 'bottom';
                        }
                    }
                    if (key === 'item') {
                        this.createKeyTipElement((keytipData[parseInt(i.toString(), 10)].id), keytipData[parseInt(i.toString(), 10)].keyTip, key, xOffset, yOffset);
                    }
                    else {
                        this.createKeyTipElement((keytipData[parseInt(i.toString(), 10)].id), keytipData[parseInt(i.toString(), 10)].keyTip, key, xOffset, yOffset, false, true);
                    }
                }
            }
        }
    };
    RibbonKeyTip.prototype.createKeyTipElement = function (id, keyTip, type, xOffset, yOffset, isTab, isPopUpItem) {
        if (xOffset === void 0) { xOffset = 'center'; }
        if (yOffset === void 0) { yOffset = 'bottom'; }
        if (isTab === void 0) { isTab = false; }
        if (isPopUpItem === void 0) { isPopUpItem = false; }
        var keyEle = document.querySelector('#' + id);
        var isPopUpPresent = false;
        var splitBtnID;
        if (isTab) {
            keyEle = document.querySelector('#' + id + constants.HEADER_ID);
        }
        if (keyEle) {
            if (keyEle.closest('.e-ribbon-group-overflow-ddb')) {
                isPopUpPresent = true;
            }
            if ((isTab && isPopUpItem) && keyEle.closest('.e-toolbar-pop')) {
                isPopUpPresent = true;
            }
            if (keyEle.closest('.e-split-btn-wrapper')) {
                var splitBtn = keyEle.closest('.e-split-btn-wrapper');
                splitBtnID = splitBtn.closest('.e-ribbon-item').id;
            }
            else {
                if (keyEle.closest('.e-colorpicker-wrapper')) {
                    keyEle = keyEle.closest('.e-colorpicker-wrapper');
                    splitBtnID = keyEle.closest('.e-ribbon-item').id;
                }
            }
        }
        if ((keyEle && keyEle.offsetParent) || (isTab && isPopUpItem)) {
            if ((isPopUpItem && isPopUpPresent) || !isPopUpItem) {
                var keytipElement = this.parent.createElement('div', {
                    className: constants.RIBBON_KEYTIP,
                    id: id + constants.RIBBON_KEYTIP_ID,
                    attrs: { role: 'dialog', 'aria-label': 'ribbon-keytip' }
                });
                document.body.append(keytipElement);
                var keytipPopup = new Popup(keytipElement, {
                    relateTo: '#' + (isTab ? id + constants.HEADER_ID : splitBtnID ? splitBtnID : id),
                    content: keyTip,
                    collision: { X: 'fit', Y: 'flip' },
                    targetType: 'relative',
                    position: { X: xOffset, Y: yOffset },
                    enableRtl: this.parent.enableRtl,
                    actionOnScroll: 'hide'
                });
                keytipPopup.show();
                this.calculateKeyTipPosition(keyEle, keytipElement, type, yOffset);
                this.parent.isKeytipOpen = true;
            }
        }
    };
    RibbonKeyTip.prototype.calculateKeyTipPosition = function (itemEle, keytipElement, type, yOffset) {
        var position = itemEle.getBoundingClientRect();
        if (type === 'backstageMenu') {
            keytipElement.style.top = position.top + ((keytipElement.offsetHeight) / 2) + 'px';
            keytipElement.style.left = position.left + (itemEle.offsetWidth / 5) + 'px';
        }
        else {
            if (type !== 'popupitem') {
                keytipElement.style.left = position.left + (position.width - keytipElement.offsetWidth) / 2 + 'px';
            }
        }
        if (type === 'filemenu' || type === 'backstage') {
            keytipElement.style.top = position.top + ((itemEle.offsetHeight - (itemEle.offsetHeight / 3)) + (keytipElement.offsetHeight / 6)) + 'px';
        }
        else if ((type === 'item' && yOffset === 'top')) {
            keytipElement.style.top = (position.top - (itemEle.offsetHeight) / 2) + 'px';
        }
    };
    /**
     * Performs keytip action.
     *
     * @param {string} keyPress - Gets the keytip text.
     * @param {boolean} isMethod - Gets the isMethod.
     * @returns {void}
     * @hidden
     */
    RibbonKeyTip.prototype.keytipPress = function (keyPress, isMethod) {
        var _this = this;
        if (isMethod === void 0) { isMethod = false; }
        this.isKeytipPresent = false;
        for (var i = 0; ((i < Object.keys(this.parent.keyTipElements).length) && !this.isKeytipPresent); i++) {
            if (this.parent.keyTipElements[parseInt(i.toString(), 10)]) {
                for (var j = 0; ((j < Object.keys(this.parent.keyTipElements[parseInt(i.toString(), 10)]).length) &&
                    !this.isKeytipPresent); j++) {
                    var keytipData = this.parent.keyTipElements[parseInt(i.toString(), 10)][Object.
                        keys(this.parent.keyTipElements[parseInt(i.toString(), 10)])[parseInt(j.toString(), 10)]];
                    for (var k = 0; ((k < Object.keys(keytipData).length) && !this.isKeytipPresent); k++) {
                        if (keyPress.toUpperCase() === keytipData[parseInt(k.toString(), 10)].keyTip) {
                            var keyTipElement = document.querySelector('#' + keytipData[parseInt(k.toString(), 10)].id + constants.RIBBON_KEYTIP_ID);
                            if (keyTipElement || isMethod) {
                                this.isKeytipPresent = true;
                                this.removeKeytip();
                                if (keytipData[parseInt(k.toString(), 10)].type === 'tab') {
                                    if (i !== this.parent.selectedTab) {
                                        this.parent.tabObj.select(i);
                                        setTimeout(function () {
                                            var tabOverflow = _this.parent.tabObj.element.querySelector('.e-nav-active');
                                            if (tabOverflow) {
                                                tabOverflow.click();
                                            }
                                            _this.createKeytip('item');
                                        }, 600);
                                    }
                                    else {
                                        this.createKeytip('item');
                                    }
                                }
                                else {
                                    if (keytipData[parseInt(k.toString(), 10)].type === 'item' || keytipData[parseInt(k.toString(), 10)].type === 'grpoverflowpopup' || keytipData[parseInt(k.toString(), 10)].type === 'popupitem') {
                                        if (document.getElementById(keytipData[parseInt(k.toString(), 10)].id) && document.getElementById(keytipData[parseInt(k.toString(), 10)].id).classList.contains('e-ribbon-group-button')) {
                                            document.getElementById(keytipData[parseInt(k.toString(), 10)].id).click();
                                        }
                                        else {
                                            var itemProp = void 0;
                                            if ((keytipData[parseInt(k.toString(), 10)].id).indexOf('_popupButton') !== -1) {
                                                var galleryID = keytipData[parseInt(k.toString(), 10)].id.replace(/_popupButton/g, '');
                                                itemProp = getItem(this.parent.tabs, galleryID);
                                            }
                                            else {
                                                itemProp = getItem(this.parent.tabs, keytipData[parseInt(k.toString(), 10)].id);
                                            }
                                            if (!isMethod || (isMethod && itemProp.tabIndex === this.parent.selectedTab)) {
                                                this.clickItems(itemProp, keytipData, k, false, isMethod);
                                            }
                                        }
                                    }
                                    else if (keytipData[parseInt(k.toString(), 10)].type === 'grpoverflow' || keytipData[parseInt(k.toString(), 10)].type === 'grpofbtn' || keytipData[parseInt(k.toString(), 10)].type === 'launcher') {
                                        var keyEle = document.querySelector('#' + keytipData[parseInt(k.toString(), 10)].id);
                                        this.removeKeytip();
                                        if (keyEle) {
                                            var groupID = keytipData[parseInt(k.toString(), 10)].id;
                                            if (isMethod) {
                                                if (keytipData[parseInt(k.toString(), 10)].id.indexOf('_launcher') !== -1 || keytipData[parseInt(k.toString(), 10)].id.indexOf('_sim_grp_overflow') !== -1 || keytipData[parseInt(k.toString(), 10)].id.indexOf('_overflow_dropdown') !== -1) {
                                                    groupID = keytipData[parseInt(k.toString(), 10)].id.replace(/_launcher|_sim_grp_overflow|_overflow_dropdown/g, '');
                                                    var itemProp = getGroup(this.parent.tabs, groupID);
                                                    if (itemProp.tabIndex === this.parent.selectedTab) {
                                                        this.clickItems(itemProp, keytipData, k, true, isMethod, keyEle);
                                                    }
                                                }
                                            }
                                            else {
                                                this.clickItems(null, keytipData, k, true, isMethod, keyEle);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (this.parent.keyTipElements) {
                    this.commonItemsKeyTipPress(keyPress, Object.keys(this.parent.keyTipElements)[parseInt(i.toString(), 10)], isMethod);
                }
            }
        }
    };
    RibbonKeyTip.prototype.clickItems = function (itemProp, keytipData, k, isGroupItems, isMethod, keyEle) {
        if (isGroupItems) {
            keyEle.click();
            if (!(keytipData[parseInt(k.toString(), 10)].type === 'launcher')) {
                this.isKeytipPopupOpen = true;
                if (keytipData[parseInt(k.toString(), 10)].type === 'grpoverflow') {
                    this.createKeytip('grpoverflowpopup');
                }
                else {
                    this.createKeytip('popupitem');
                }
            }
        }
        else {
            var itemID = keytipData[parseInt(k.toString(), 10)].id;
            if (document.querySelector('#' + itemID) && isMethod) {
                if (this.parent.activeLayout === 'Simplified') {
                    if (document.querySelector('#' + itemID).closest('#' + itemProp.group.id + '_sim_grp_overflow-popup') && document.querySelector('#' + itemID).closest('#' + itemProp.group.id + '_sim_grp_overflow-popup').classList.contains('e-popup-close')) {
                        document.querySelector('#' + itemProp.group.id + '_sim_grp_overflow').click();
                    }
                    else if (document.querySelector('#' + itemID).closest('#' + this.parent.tabObj.element.id + constants.OVRLOF_BUTTON_ID + '-popup') && document.querySelector('#' + itemID).closest('#' + this.parent.tabObj.element.id + constants.OVRLOF_BUTTON_ID + '-popup').classList.contains('e-popup-close')) {
                        document.querySelector('#' + this.parent.tabObj.element.id + constants.OVRLOF_BUTTON_ID).click();
                    }
                }
                else {
                    if (document.querySelector('#' + itemID).closest('#' + itemProp.group.id + constants.OVERFLOW_ID + constants.DROPDOWN_ID + '-popup') && document.querySelector('#' + itemID).closest('#' + itemProp.group.id + constants.OVERFLOW_ID + constants.DROPDOWN_ID + '-popup').classList.contains('e-popup-close')) {
                        document.querySelector('#' + itemProp.group.id + constants.OVERFLOW_ID + constants.DROPDOWN_ID).click();
                    }
                }
            }
            var itemType = this.parent.getItemModuleName(itemProp.item);
            switch (itemType) {
                case 'btn':
                    this.parent.ribbonButtonModule.click(itemID);
                    break;
                case 'dropdown-btn':
                    this.parent.ribbonDropDownModule.toggle(itemID);
                    break;
                case 'split-btn':
                    this.parent.ribbonSplitButtonModule.toggle(itemID);
                    break;
                case 'checkbox':
                    this.parent.ribbonCheckBoxModule.click(itemID);
                    break;
                case 'colorpicker':
                    this.parent.ribbonColorPickerModule.toggle(itemID);
                    break;
                case 'combobox': {
                    var itemEle_1 = document.querySelector('#' + itemID);
                    if (this.isInteractableElement(itemEle_1)) {
                        setTimeout(function () {
                            itemEle_1.focus();
                        }, 100);
                    }
                    break;
                }
                case 'gallery': {
                    var galleryEle = document.querySelector('#' + itemID);
                    if (this.isInteractableElement(galleryEle)) {
                        galleryEle.click();
                    }
                    break;
                }
                case 'template': {
                    var templateEle = document.querySelector('#' + itemID);
                    if (this.isInteractableElement(templateEle)) {
                        templateEle.focus();
                    }
                    break;
                }
                case 'group-btn': {
                    var itemElement = document.querySelector('#' + itemID);
                    if (this.isInteractableElement(itemElement)) {
                        var item = getInstance(itemElement, DropDownButton);
                        item.toggle();
                        for (var i = 0; i < itemProp.item.groupButtonSettings.items.length; i++) {
                            if (itemProp.item.groupButtonSettings.items[parseInt(i.toString(), 10)].keyTip) {
                                this.createKeyTipElement(itemID + (constants.RIBBON_GROUP_BUTTON_ID + i), itemProp.item.groupButtonSettings.items[parseInt(i.toString(), 10)].keyTip, 'item');
                            }
                        }
                    }
                    break;
                }
            }
        }
    };
    RibbonKeyTip.prototype.isInteractableElement = function (element) {
        return element && !element.closest('.e-ribbon-item').classList.contains('e-disabled');
    };
    RibbonKeyTip.prototype.commonItemsKeyTipPress = function (keyPress, key, isMethod) {
        var _this = this;
        if (this.parent.keyTipElements["" + key]) {
            var isKeyPressed = false;
            var keytipData = this.parent.keyTipElements["" + key];
            var keyEle = void 0;
            var keytipElement = void 0;
            if (keytipData) {
                if (key === 'backstageMenu') {
                    for (var i = 0; i < Object.keys(this.parent.keyTipElements["" + key]).length; i++) {
                        if (keytipData[parseInt(i.toString(), 10)].keyTip === keyPress.toUpperCase()) {
                            keyEle = document.querySelector('#' + keytipData[parseInt(i.toString(), 10)].id);
                            keytipElement = document.querySelector('#' + keyEle.id + constants.RIBBON_KEYTIP_ID);
                            if (keytipElement || isMethod) {
                                isKeyPressed = true;
                                if (isMethod && document.querySelector('.e-ribbon-backstage-popup').classList.contains('e-popup-close')) {
                                    this.parent.tabObj.element.querySelector('.e-ribbon-backstage').click();
                                }
                                break;
                            }
                        }
                    }
                }
                else {
                    if (keytipData[0] && keytipData[0].keyTip === keyPress.toUpperCase()) {
                        keyEle = document.querySelector('#' + keytipData[0].id);
                        keytipElement = document.querySelector('#' + keytipData[0].id + constants.RIBBON_KEYTIP_ID);
                        if (keytipElement || isMethod) {
                            isKeyPressed = true;
                        }
                    }
                }
            }
            if (isKeyPressed) {
                this.removeKeytip();
                this.isKeytipPresent = true;
                if (keyEle) {
                    keyEle.click();
                    if (key === 'backstage') {
                        this.createKeytip('backstageMenu');
                    }
                    else if (key === 'overflowbtn') {
                        this.isKeytipPopupOpen = true;
                        this.createKeytip('popupitem');
                    }
                    else if (key === 'taboverflow') {
                        setTimeout(function () {
                            for (var i = 0; i < Object.keys(_this.parent.keyTipElements).length; i++) {
                                if (_this.parent.keyTipElements[parseInt(i.toString(), 10)]) {
                                    var keytipData_1 = _this.parent.keyTipElements[parseInt(i.toString(), 10)]['tab'];
                                    _this.createKeyTipElement((keytipData_1[0].id), keytipData_1[0].keyTip, 'tab', 'center', 'bottom', true, true);
                                }
                            }
                        }, 600);
                    }
                }
            }
        }
    };
    /**
     * Removes the keytip.
     *
     * @param {string} key - Gets the keyboard key element.
     * @returns {void}
     * @hidden
     */
    RibbonKeyTip.prototype.removeKeytip = function (key) {
        var _this = this;
        var keyTipItems = document.querySelectorAll('.e-ribbon-keytip');
        var isKeyTipExist = false;
        this.parent.keysPress = '';
        var _loop_1 = function (i) {
            var keyTipItem = keyTipItems[parseInt(i.toString(), 10)];
            if (key === 'Escape' && this_1.parent.keyTipElements && this_1.parent.keyTipElements[this_1.parent.selectedTab]) {
                for (var j = 0; j < Object.keys(this_1.parent.keyTipElements[this_1.parent.selectedTab]).length; j++) {
                    var keyText = (Object.keys(this_1.parent.keyTipElements[parseInt(this_1.parent.selectedTab.toString(), 10)]))[parseInt(j.toString(), 10)];
                    var keyTipElement = this_1.parent.keyTipElements[parseInt(this_1.parent.selectedTab.toString(), 10)];
                    var index = getIndex(keyTipElement["" + keyText], function (e) {
                        return e.id +
                            constants.RIBBON_KEYTIP_ID === keyTipItems[parseInt(i.toString(), 10)].id;
                    });
                    if (index !== -1) {
                        if ((keyText === 'item' && !(this_1.isKeytipPopupOpen)) || (keyText === 'grpoverflow' && this_1.parent.activeLayout === 'Classic')) {
                            this_1.createKeytip('tab');
                            key = '';
                            isKeyTipExist = true;
                            break;
                        }
                        else if (this_1.isKeytipPopupOpen) {
                            if ((keyText === 'popupitem' && this_1.parent.activeLayout === 'Simplified') || (keyText === 'grpoverflowpopup' && this_1.parent.activeLayout === 'Classic')) {
                                this_1.createKeytip('item');
                                key = '';
                                isKeyTipExist = true;
                                break;
                            }
                        }
                    }
                }
                for (var n = 0; n < Object.keys(this_1.parent.keyTipElements).length; n++) {
                    if (this_1.parent.keyTipElements[parseInt(n.toString(), 10)]) {
                        var keytipData = this_1.parent.keyTipElements[parseInt(n.toString(), 10)]['tab'];
                        for (var j = 0; j < Object.keys(keytipData).length; j++) {
                            if (keyTipItem.id === keytipData[0].id + constants.RIBBON_KEYTIP_ID) {
                                if (document.querySelector('#' + keytipData[0].id + constants.HEADER_ID).closest('.e-toolbar-pop')) {
                                    var tabOverflow = this_1.parent.tabObj.element.querySelector('.e-nav-active');
                                    tabOverflow.click();
                                    setTimeout(function () {
                                        _this.createKeytip('tab');
                                    }, 600);
                                    key = '';
                                    isKeyTipExist = true;
                                    break;
                                }
                            }
                        }
                        if (isKeyTipExist) {
                            break;
                        }
                    }
                }
                if (!isKeyTipExist && this_1.parent.keyTipElements['backstageMenu']) {
                    var index = getIndex(this_1.parent.keyTipElements['backstageMenu'], function (e) { return e.id + constants.RIBBON_KEYTIP_ID === keyTipItems[parseInt(i.toString(), 10)].id; });
                    if (index !== -1) {
                        this_1.createKeytip('tab');
                        key = '';
                        isKeyTipExist = true;
                    }
                }
            }
            if (keyTipItem) {
                remove(keyTipItem);
            }
        };
        var this_1 = this;
        for (var i = 0; i < keyTipItems.length; i++) {
            _loop_1(i);
        }
        this.isKeytipPopupOpen = false;
        if (!isKeyTipExist) {
            this.parent.isKeytipOpen = false;
        }
    };
    /**
     * Shows the Keytip dynamically.
     *
     * @param  {string} keyAction - Item for which the tooltip is to be shown.
     * @returns {void}
     */
    RibbonKeyTip.prototype.showKeyTips = function (keyAction) {
        if (this.parent.enableKeyTips) {
            if (keyAction) {
                this.keytipPress(keyAction, true);
            }
            else {
                this.createKeytip('tab');
            }
        }
    };
    /**
     * Hides the Keytip dynamically.
     *
     * @returns {void}
     */
    RibbonKeyTip.prototype.hideKeyTips = function () {
        this.removeKeytip();
    };
    return RibbonKeyTip;
}());
export { RibbonKeyTip };
