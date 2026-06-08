import { getComponent, merge } from '@syncfusion/ej2-base';
import { CheckBox } from '@syncfusion/ej2-buttons';
import { getItem, getItemElement, RIBBON_CONTROL, SPACE, RIBBON_POPUP_CONTROL } from '../base/index';
/**
 * Defines the items of Ribbon.
 */
var RibbonCheckBox = /** @class */ (function () {
    function RibbonCheckBox(parent) {
        this.parent = parent;
    }
    RibbonCheckBox.prototype.getModuleName = function () {
        return 'ribbonCheckBox';
    };
    RibbonCheckBox.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates the check box.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonCheckBox.prototype.createCheckBox = function (item, itemEle) {
        var _this = this;
        var inputEle = this.parent.createElement('input', {
            id: item.id
        });
        itemEle.appendChild(inputEle);
        var checkBoxSettings = item.checkBoxSettings;
        if (checkBoxSettings.htmlAttributes) {
            if (checkBoxSettings.htmlAttributes.id) {
                delete checkBoxSettings.htmlAttributes.id;
            }
        }
        new CheckBox({
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            checked: checkBoxSettings.checked,
            cssClass: (RIBBON_CONTROL + SPACE + (checkBoxSettings.cssClass ? checkBoxSettings.cssClass : '')).trim(),
            label: checkBoxSettings.label,
            labelPosition: checkBoxSettings.labelPosition,
            disabled: item.disabled,
            created: checkBoxSettings.created,
            htmlAttributes: checkBoxSettings.htmlAttributes,
            change: function (e) {
                if (checkBoxSettings.change) {
                    checkBoxSettings.change.call(_this, e);
                }
            }
        }, inputEle);
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
    RibbonCheckBox.prototype.addOverFlowEvents = function (item, itemEle, overflowButton) {
        var _this = this;
        var inputEle = itemEle.querySelector('#' + item.id);
        inputEle.setAttribute('data-control', item.type.toString());
        var checkBoxObj = getComponent(inputEle, CheckBox);
        checkBoxObj.cssClass = checkBoxObj.cssClass + SPACE + RIBBON_POPUP_CONTROL;
        checkBoxObj.dataBind();
        checkBoxObj.change = function (e) {
            if (item.checkBoxSettings.change) {
                item.checkBoxSettings.change.call(_this, e);
            }
            if (overflowButton.element.classList.contains('e-active')) {
                overflowButton.toggle();
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
    RibbonCheckBox.prototype.removeOverFlowEvents = function (item, itemEle) {
        var _this = this;
        var inputEle = itemEle.querySelector('#' + item.id);
        var checkBoxObj = getComponent(inputEle, CheckBox);
        var cssClass = checkBoxObj.cssClass.split(SPACE);
        cssClass = cssClass.filter(function (value) { return value !== RIBBON_POPUP_CONTROL; });
        checkBoxObj.cssClass = cssClass.join(SPACE);
        checkBoxObj.dataBind();
        checkBoxObj.change = function (e) {
            if (item.checkBoxSettings.change) {
                item.checkBoxSettings.change.call(_this, e);
            }
        };
    };
    /**
     * Triggers the click action on the Checkbox.
     *
     * @param {string} controlId - Gets the control ID.
     * @returns {void}
     */
    RibbonCheckBox.prototype.click = function (controlId) {
        var inputEle = getItemElement(this.parent, controlId);
        if (!inputEle) {
            return;
        }
        var checkBoxObj = getComponent(inputEle, CheckBox);
        if (!checkBoxObj.disabled) {
            checkBoxObj.click();
        }
    };
    /**
     * Updates the checkbox.
     *
     * @param {RibbonCheckBoxSettingsModel} prop - Gets the checkbox property.
     * @param {string} id - Gets the ID of checkbox.
     * @returns {void}
     */
    RibbonCheckBox.prototype.updateCheckBox = function (prop, id) {
        var itemProp = getItem(this.parent.tabs, id);
        if (!itemProp) {
            return;
        }
        merge(itemProp.item.checkBoxSettings, prop);
        var inputEle = getItemElement(this.parent, id, itemProp);
        if (!inputEle) {
            return;
        }
        if (prop.cssClass) {
            prop.cssClass = (RIBBON_CONTROL + SPACE + prop.cssClass).trim();
        }
        delete prop.change;
        var checkBoxObj = getComponent(inputEle, CheckBox);
        checkBoxObj.setProperties(prop);
    };
    return RibbonCheckBox;
}());
export { RibbonCheckBox };
