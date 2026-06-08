import { getComponent, merge } from '@syncfusion/ej2-base';
import { Button } from '@syncfusion/ej2-buttons';
import { getItem, getItemElement, RibbonItemSize, setCustomAttributes } from '../base/index';
import { ITEM_VERTICAL_CENTER, RIBBON_CONTROL, RIBBON_POPUP_CONTROL, SPACE } from '../base/constant';
/**
 * Defines the items of Ribbon.
 */
var RibbonButton = /** @class */ (function () {
    function RibbonButton(parent) {
        this.parent = parent;
    }
    RibbonButton.prototype.getModuleName = function () {
        return 'ribbonButton';
    };
    RibbonButton.prototype.destroy = function () {
        this.parent = null;
    };
    /**
     * Creates button.
     *
     * @param {RibbonItemModel} item - Gets the ribbon item model.
     * @param {HTMLElement} itemEle - Gets the ribbon item element.
     * @returns {void}
     * @hidden
     */
    RibbonButton.prototype.createButton = function (item, itemEle) {
        var _this = this;
        var buttonEle = this.parent.createElement('button', {
            id: item.id
        });
        itemEle.appendChild(buttonEle);
        var btnSettings = item.buttonSettings;
        new Button({
            locale: this.parent.locale,
            enableRtl: this.parent.enableRtl,
            enablePersistence: this.parent.enablePersistence,
            iconPosition: item.activeSize === RibbonItemSize.Large ? 'Top' : 'Left',
            iconCss: btnSettings.iconCss,
            disabled: item.disabled,
            cssClass: (ITEM_VERTICAL_CENTER + SPACE + RIBBON_CONTROL + SPACE + (btnSettings.cssClass ? btnSettings.cssClass : '')).trim(),
            content: item.activeSize === RibbonItemSize.Small ? '' : btnSettings.content,
            isPrimary: btnSettings.isPrimary,
            isToggle: btnSettings.isToggle,
            created: btnSettings.created
        }, buttonEle);
        if (btnSettings.htmlAttributes) {
            if (btnSettings.htmlAttributes.id) {
                delete btnSettings.htmlAttributes.id;
            }
            setCustomAttributes(buttonEle, btnSettings.htmlAttributes);
        }
        buttonEle.onclick = function (e) {
            if (btnSettings.clicked) {
                btnSettings.clicked.call(_this, e);
            }
        };
        if (btnSettings.content) {
            buttonEle.setAttribute('aria-label', btnSettings.content);
        }
        else {
            buttonEle.setAttribute('aria-label', 'button');
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
    RibbonButton.prototype.addOverFlowEvents = function (item, itemEle, overflowButton) {
        var _this = this;
        var buttonEle = itemEle.querySelector('#' + item.id);
        buttonEle.setAttribute('data-control', item.type.toString());
        var buttonObj = getComponent(buttonEle, Button);
        buttonObj.setProperties({ cssClass: buttonObj.cssClass + SPACE + RIBBON_POPUP_CONTROL });
        buttonEle.onclick = function (e) {
            if (item.buttonSettings.clicked) {
                item.buttonSettings.clicked.call(_this, e);
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
    RibbonButton.prototype.removeOverFlowEvents = function (item, itemEle) {
        var _this = this;
        var buttonEle = itemEle.querySelector('#' + item.id);
        var buttonObj = getComponent(buttonEle, Button);
        var cssClass = buttonObj.cssClass.split(SPACE);
        cssClass = cssClass.filter(function (value) { return value !== RIBBON_POPUP_CONTROL; });
        buttonObj.setProperties({ cssClass: cssClass.join(SPACE) });
        buttonEle.onclick = function (e) {
            if (item.buttonSettings.clicked) {
                item.buttonSettings.clicked.call(_this, e);
            }
        };
    };
    /**
     * Triggers the click action on the button.
     *
     * @param {string} controlId - Gets the control ID.
     * @returns {void}
     */
    RibbonButton.prototype.click = function (controlId) {
        var buttonEle = getItemElement(this.parent, controlId);
        if (!buttonEle) {
            return;
        }
        var buttonObj = getComponent(buttonEle, Button);
        if (!buttonObj.disabled) {
            buttonObj.click();
        }
    };
    /**
     * Updates the button properties.
     *
     * @param {RibbonButtonSettingsModel} prop - Gets the button property.
     * @param {string} id - Gets the ID of button item.
     * @returns {void}
     */
    RibbonButton.prototype.updateButton = function (prop, id) {
        var itemProp = getItem(this.parent.tabs, id);
        if (!itemProp) {
            return;
        }
        merge(itemProp.item.buttonSettings, prop);
        var buttonEle = getItemElement(this.parent, id, itemProp);
        if (!buttonEle) {
            return;
        }
        var buttonObj = getComponent(buttonEle, Button);
        if (prop.isToggle) {
            buttonEle.classList.add('e-active');
        }
        if (prop.cssClass) {
            prop.cssClass = (ITEM_VERTICAL_CENTER + SPACE + RIBBON_CONTROL + SPACE + prop.cssClass).trim();
        }
        if (prop.content) {
            prop.content = itemProp.item.activeSize === RibbonItemSize.Small ? '' : prop.content;
            buttonEle.setAttribute('aria-label', prop.content);
        }
        delete prop.clicked;
        buttonObj.setProperties(prop);
    };
    /**
     * Updates the button size.
     *
     * @param {HTMLElement} element - Gets the button element.
     * @param {RibbonItemModel} item - Gets the ribbon item.
     * @returns {void}
     * @hidden
     */
    RibbonButton.prototype.updateButtonSize = function (element, item) {
        var buttonObj = getComponent(element, Button);
        buttonObj.setProperties({
            iconPosition: item.activeSize === RibbonItemSize.Large ? 'Top' : 'Left',
            content: item.activeSize === RibbonItemSize.Small ? '' : item.buttonSettings.content
        });
    };
    return RibbonButton;
}());
export { RibbonButton };
