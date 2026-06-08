import { getComponent, merge } from '@syncfusion/ej2-base';
import { ComboBox } from '@syncfusion/ej2-dropdowns';
import { getItem, getItemElement, RIBBON_CONTROL, SPACE, RIBBON_POPUP_CONTROL } from '../base/index';
/**
 * Defines the items of Ribbon.
 */
var RibbonComboBox = /** @class */ (function () {
    function RibbonComboBox(parent) {
        this.parent = parent;
    }
    RibbonComboBox.prototype.getModuleName = function () {
        return 'ribbonComboBox';
    };
    RibbonComboBox.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates the combobox.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonComboBox.prototype.createComboBox = function (item, itemEle) {
        var _this = this;
        var inputEle = this.parent.createElement('input', {
            id: item.id
        });
        itemEle.appendChild(inputEle);
        var comboBoxSettings = item.comboBoxSettings;
        if (comboBoxSettings.htmlAttributes) {
            if (comboBoxSettings.htmlAttributes.id) {
                delete comboBoxSettings.htmlAttributes.id;
            }
        }
        new ComboBox({
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            allowCustom: false,
            floatLabelType: 'Never',
            ignoreAccent: true,
            ignoreCase: true,
            allowFiltering: comboBoxSettings.allowFiltering,
            autofill: comboBoxSettings.autofill,
            cssClass: (RIBBON_CONTROL + SPACE + (comboBoxSettings.cssClass ? comboBoxSettings.cssClass : '')).trim(),
            dataSource: comboBoxSettings.dataSource,
            enabled: !item.disabled,
            fields: comboBoxSettings.fields,
            filterType: comboBoxSettings.filterType,
            footerTemplate: comboBoxSettings.footerTemplate,
            groupTemplate: comboBoxSettings.groupTemplate,
            headerTemplate: comboBoxSettings.headerTemplate,
            index: comboBoxSettings.index,
            itemTemplate: comboBoxSettings.itemTemplate,
            noRecordsTemplate: comboBoxSettings.noRecordsTemplate,
            placeholder: comboBoxSettings.placeholder,
            popupHeight: comboBoxSettings.popupHeight,
            popupWidth: comboBoxSettings.popupWidth,
            showClearButton: comboBoxSettings.showClearButton,
            sortOrder: comboBoxSettings.sortOrder,
            text: comboBoxSettings.text,
            value: comboBoxSettings.value,
            width: comboBoxSettings.width,
            beforeOpen: comboBoxSettings.beforeOpen,
            open: comboBoxSettings.open,
            htmlAttributes: comboBoxSettings.htmlAttributes,
            close: function (e) {
                if (comboBoxSettings.close) {
                    comboBoxSettings.close.call(_this, e);
                }
            },
            filtering: comboBoxSettings.filtering,
            change: comboBoxSettings.change,
            select: comboBoxSettings.select,
            created: comboBoxSettings.created
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
    RibbonComboBox.prototype.addOverFlowEvents = function (item, itemEle, overflowButton) {
        var _this = this;
        var comboBoxSettings = item.comboBoxSettings;
        if (comboBoxSettings.label && this.parent.activeLayout === 'Simplified') {
            var label = this.parent.createElement('div', {
                className: 'e-ribbon-combobox-label',
                id: item.id + '_label',
                innerHTML: comboBoxSettings.label
            });
            itemEle.insertBefore(label, itemEle.firstChild);
        }
        var inputEle = itemEle.querySelector('#' + item.id);
        inputEle.setAttribute('data-control', item.type.toString());
        var comboBoxObj = getComponent(inputEle, ComboBox);
        comboBoxObj.setProperties({ cssClass: comboBoxObj.cssClass + SPACE + RIBBON_POPUP_CONTROL });
        comboBoxObj.close = function (e) {
            var target = e.event ? e.event.target : null;
            if (item.comboBoxSettings.close) {
                item.comboBoxSettings.close.call(_this, e);
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
    RibbonComboBox.prototype.removeOverFlowEvents = function (item, itemEle) {
        var _this = this;
        var comboBoxSettings = item.comboBoxSettings;
        if (comboBoxSettings.label) {
            var label = itemEle.querySelector('#' + item.id + '_label');
            if (label) {
                label.remove();
            }
        }
        var inputEle = itemEle.querySelector('#' + item.id);
        var comboBoxObj = getComponent(inputEle, ComboBox);
        var cssClass = comboBoxObj.cssClass.split(SPACE);
        cssClass = cssClass.filter(function (value) { return value !== RIBBON_POPUP_CONTROL; });
        comboBoxObj.setProperties({ cssClass: cssClass.join(SPACE) });
        comboBoxObj.close = function (e) {
            if (item.comboBoxSettings.close) {
                item.comboBoxSettings.close.call(_this, e);
            }
        };
    };
    RibbonComboBox.prototype.getComboBoxObj = function (controlId) {
        var inputEle = getItemElement(this.parent, controlId);
        return inputEle ? getComponent(inputEle, ComboBox) : null;
    };
    /**
     * To filter the data from given data source by using query
     *
     * @param  {string } controlId - set the id of the control in which methods needs to be called.
     * @param  {Object[] } dataSource - Set the data source to filter.
     * @param  {Query} query - Specify the query to filter the data.
     * @param  {FieldSettingsModel} fields - Specify the fields to map the column in the data table.
     * @returns {void}
     */
    RibbonComboBox.prototype.filter = function (controlId, dataSource, query, fields) {
        this.getComboBoxObj(controlId).filter(dataSource, query, fields);
    };
    /**
     * To open/close DropDownButton popup based on current state of the combobox.
     *
     * @param {string} controlId - Gets the id of the control.
     * @returns {void}
     */
    RibbonComboBox.prototype.hidePopup = function (controlId) {
        var comboBoxObj = this.getComboBoxObj(controlId);
        if (!comboBoxObj) {
            return;
        }
        comboBoxObj.hidePopup();
    };
    /**
     * To open/close DropDownButton popup based on current state of the combobox.
     *
     * @param {string} controlId - Gets the id of the control.
     * @returns {void}
     */
    RibbonComboBox.prototype.showPopup = function (controlId) {
        var comboBoxObj = this.getComboBoxObj(controlId);
        if (!comboBoxObj) {
            return;
        }
        comboBoxObj.showPopup();
    };
    /**
     * Updates the combobox properties.
     *
     * @param {RibbonComboBoxSettingsModel} prop - Gets the combobox property.
     * @param {string} id - Gets the ID of combobox.
     * @returns {void}
     */
    RibbonComboBox.prototype.updateComboBox = function (prop, id) {
        var itemProp = getItem(this.parent.tabs, id);
        if (!itemProp) {
            return;
        }
        merge(itemProp.item.comboBoxSettings, prop);
        var inputEle = getItemElement(this.parent, id, itemProp);
        if (!inputEle) {
            return;
        }
        if (prop.cssClass) {
            prop.cssClass = (RIBBON_CONTROL + SPACE + prop.cssClass).trim();
        }
        delete prop.close;
        var comboBoxObj = getComponent(inputEle, ComboBox);
        comboBoxObj.setProperties(prop);
    };
    return RibbonComboBox;
}());
export { RibbonComboBox };
