import { EventHandler, getComponent, merge } from '@syncfusion/ej2-base';
import { ColorPicker } from '@syncfusion/ej2-inputs';
import { getItem, getItemElement, setCustomAttributes } from '../base/index';
import { RIBBON_CONTROL, RIBBON_HOVER, RIBBON_POPUP_CONTROL, RIBBON_POPUP_OPEN, SPACE } from '../base/constant';
/**
 * Defines the items of Ribbon.
 */
var RibbonColorPicker = /** @class */ (function () {
    function RibbonColorPicker(parent) {
        this.parent = parent;
    }
    RibbonColorPicker.prototype.getModuleName = function () {
        return 'ribbonColorPicker';
    };
    RibbonColorPicker.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates the colorpicker.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonColorPicker.prototype.createColorPicker = function (item, itemEle) {
        var _this = this;
        var inputEle = this.parent.createElement('input', {
            id: item.id
        });
        itemEle.appendChild(inputEle);
        var colorPickerSettings = item.colorPickerSettings;
        var colorPicker = new ColorPicker({
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            columns: colorPickerSettings.columns,
            cssClass: (RIBBON_CONTROL + SPACE + (colorPickerSettings.cssClass ? colorPickerSettings.cssClass : '')).trim(),
            disabled: item.disabled,
            enableOpacity: colorPickerSettings.enableOpacity,
            mode: colorPickerSettings.mode,
            modeSwitcher: colorPickerSettings.modeSwitcher,
            noColor: colorPickerSettings.noColor,
            presetColors: colorPickerSettings.presetColors,
            showButtons: colorPickerSettings.showButtons,
            value: colorPickerSettings.value,
            beforeClose: function () {
                colorPicker.element.parentElement.classList.remove(RIBBON_POPUP_OPEN);
                if (colorPickerSettings.beforeClose) {
                    colorPickerSettings.beforeClose.call(_this);
                }
            },
            beforeOpen: colorPickerSettings.beforeOpen,
            beforeTileRender: colorPickerSettings.beforeTileRender,
            created: colorPickerSettings.created,
            change: function (e) {
                colorPickerSettings.value = e.value.toString();
                if (colorPickerSettings.change) {
                    colorPickerSettings.change.call(_this, e);
                }
            },
            open: function () {
                colorPicker.element.parentElement.classList.add(RIBBON_POPUP_OPEN);
                if (colorPickerSettings.open) {
                    colorPickerSettings.open.call(_this);
                }
            },
            select: colorPickerSettings.select
        }, inputEle);
        if (colorPickerSettings.htmlAttributes) {
            if (colorPickerSettings.htmlAttributes.id) {
                delete colorPickerSettings.htmlAttributes.id;
            }
            setCustomAttributes(inputEle, colorPickerSettings.htmlAttributes);
        }
        var wrapper = colorPicker.element.parentElement;
        EventHandler.add(wrapper, 'mouseenter', this.toggleWrapperHover.bind(this, wrapper, true), this);
        EventHandler.add(wrapper, 'mouseleave', this.toggleWrapperHover.bind(this, wrapper, false), this);
    };
    RibbonColorPicker.prototype.toggleWrapperHover = function (wrapper, isAdd) {
        if (isAdd) {
            wrapper.classList.add(RIBBON_HOVER);
        }
        else {
            wrapper.classList.remove(RIBBON_HOVER);
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
    RibbonColorPicker.prototype.addOverFlowEvents = function (item, itemEle, overflowButton) {
        var _this = this;
        var colorPickerSettings = item.colorPickerSettings;
        if (colorPickerSettings.label && this.parent.activeLayout === 'Simplified') {
            var label = this.parent.createElement('div', {
                className: 'e-ribbon-colorpicker-label',
                id: item.id + '_label',
                innerHTML: colorPickerSettings.label
            });
            itemEle.insertBefore(label, itemEle.firstChild);
        }
        var colorPickerEle = itemEle.querySelector('#' + item.id);
        colorPickerEle.setAttribute('data-control', item.type.toString());
        var colorPickerObj = getComponent(colorPickerEle, ColorPicker);
        colorPickerObj.setProperties({ cssClass: colorPickerObj.cssClass + SPACE + RIBBON_POPUP_CONTROL });
        //Accessing the private property 'splitBtn' of ColorPicker component to get the colorpicker instance as there is no close event in colorpicker.
        var splitBtn = colorPickerObj['splitBtn'];
        var target;
        colorPickerObj.beforeClose = function (e) {
            target = e.event ? e.event.target : null;
            colorPickerObj.element.parentElement.classList.remove(RIBBON_POPUP_OPEN);
            if (item.colorPickerSettings.beforeClose) {
                item.colorPickerSettings.beforeClose.call(_this);
            }
        };
        splitBtn.close = function () {
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
    RibbonColorPicker.prototype.removeOverFlowEvents = function (item, itemEle) {
        var _this = this;
        var colorPickerSettings = item.colorPickerSettings;
        if (colorPickerSettings.label) {
            var label = itemEle.querySelector('#' + item.id + '_label');
            if (label) {
                label.remove();
            }
        }
        var colorPickerEle = itemEle.querySelector('#' + item.id);
        var colorPickerObj = getComponent(colorPickerEle, ColorPicker);
        var cssClass = colorPickerObj.cssClass.split(SPACE);
        cssClass = cssClass.filter(function (value) { return value !== RIBBON_POPUP_CONTROL; });
        colorPickerObj.setProperties({ cssClass: cssClass.join(SPACE) });
        var splitBtn = colorPickerObj['splitBtn'];
        //Accessing the private property 'splitBtn' of ColorPicker component to get the colorpicker instance as there is no close event in colorpicker.
        splitBtn.close = null;
        colorPickerObj.beforeClose = function () {
            colorPickerObj.element.parentElement.classList.remove(RIBBON_POPUP_OPEN);
            if (item.colorPickerSettings.beforeClose) {
                item.colorPickerSettings.beforeClose.call(_this);
            }
        };
    };
    RibbonColorPicker.prototype.getColorPickerObj = function (controlId) {
        var inputEle = getItemElement(this.parent, controlId);
        return inputEle ? getComponent(inputEle, ColorPicker) : null;
    };
    /**
     * Gets color value in specified type.
     *
     * @param {string} controlId -Gets the control ID.
     * @param {string} value - Specify the color value.
     * @param {string} type - Specify the type to which the specified color needs to be converted.
     * @returns {string} - Returns string.
     */
    RibbonColorPicker.prototype.getValue = function (controlId, value, type) {
        var colorPickerObj = this.getColorPickerObj(controlId);
        return colorPickerObj ? colorPickerObj.getValue(value, type) : '';
    };
    /**
     * To show/hide ColorPicker popup based on current state of the SplitButton.
     *
     * @param {string} controlId - set the id of the control.
     * @returns {void} - Returns void.
     */
    RibbonColorPicker.prototype.toggle = function (controlId) {
        var colorPickerObj = this.getColorPickerObj(controlId);
        if (!colorPickerObj) {
            return;
        }
        if (!colorPickerObj.disabled) {
            colorPickerObj.toggle();
        }
    };
    /**
     * Updates the colorpicker properties.
     *
     * @param {RibbonColorPickerSettingsModel} prop - Gets the colorpicker property.
     * @param {string} id - Gets the ID of colorpicker.
     * @returns {void}
     */
    RibbonColorPicker.prototype.updateColorPicker = function (prop, id) {
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
        delete prop.beforeClose;
        delete prop.open;
        var colorPickerObj = getComponent(inputEle, ColorPicker);
        colorPickerObj.setProperties(prop);
    };
    /**
     * @param {HTMLElement} element - Gets the colorpicker element to be destroyed.
     * @returns {void}
     * @hidden
     */
    RibbonColorPicker.prototype.unwireColorPickerEvents = function (element) {
        var colorPickerObj = getComponent(element, ColorPicker);
        var wrapper = colorPickerObj.element.parentElement;
        EventHandler.remove(wrapper, 'mouseenter', this.toggleWrapperHover);
        EventHandler.remove(wrapper, 'mouseleave', this.toggleWrapperHover);
    };
    return RibbonColorPicker;
}());
export { RibbonColorPicker };
