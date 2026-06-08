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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChildProperty, Complex, Property } from '@syncfusion/ej2-base';
import { RibbonItemSize, DisplayMode } from '../base/interface';
import { RibbonButtonSettings } from './ribbon-button-settings';
import { RibbonCheckBoxSettings } from './ribbon-checkbox-settings';
import { RibbonColorPickerSettings } from './ribbon-colorpicker-settings';
import { RibbonComboBoxSettings } from './ribbon-combobox-settings';
import { RibbonDropDownSettings } from './ribbon-dropdown-settings';
import { RibbonSplitButtonSettings } from './ribbon-splitbutton-settings';
import { RibbonTooltip } from './ribbon-tooltip';
import { RibbonGroupButtonSettings } from './ribbon-group-button-settings';
import { RibbonGallerySettings } from './ribbon-gallery-settings';
/**
 * Defines the ribbon item.
 */
var RibbonItem = /** @class */ (function (_super) {
    __extends(RibbonItem, _super);
    function RibbonItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of item.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonItem.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property('')
    ], RibbonItem.prototype, "keyTip", void 0);
    __decorate([
        Property(RibbonItemSize.Medium)
    ], RibbonItem.prototype, "activeSize", void 0);
    __decorate([
        Property(RibbonItemSize.Small | RibbonItemSize.Medium | RibbonItemSize.Large)
    ], RibbonItem.prototype, "allowedSizes", void 0);
    __decorate([
        Property('')
    ], RibbonItem.prototype, "id", void 0);
    __decorate([
        Property('')
    ], RibbonItem.prototype, "cssClass", void 0);
    __decorate([
        Property(false)
    ], RibbonItem.prototype, "disabled", void 0);
    __decorate([
        Property('')
    ], RibbonItem.prototype, "itemTemplate", void 0);
    __decorate([
        Property('Button')
    ], RibbonItem.prototype, "type", void 0);
    __decorate([
        Property(DisplayMode.Auto)
    ], RibbonItem.prototype, "displayOptions", void 0);
    __decorate([
        Complex({}, RibbonTooltip)
    ], RibbonItem.prototype, "ribbonTooltipSettings", void 0);
    __decorate([
        Complex({}, RibbonButtonSettings)
    ], RibbonItem.prototype, "buttonSettings", void 0);
    __decorate([
        Complex({}, RibbonDropDownSettings)
    ], RibbonItem.prototype, "dropDownSettings", void 0);
    __decorate([
        Complex({}, RibbonCheckBoxSettings)
    ], RibbonItem.prototype, "checkBoxSettings", void 0);
    __decorate([
        Complex({}, RibbonColorPickerSettings)
    ], RibbonItem.prototype, "colorPickerSettings", void 0);
    __decorate([
        Complex({}, RibbonComboBoxSettings)
    ], RibbonItem.prototype, "comboBoxSettings", void 0);
    __decorate([
        Complex({}, RibbonSplitButtonSettings)
    ], RibbonItem.prototype, "splitButtonSettings", void 0);
    __decorate([
        Complex({}, RibbonGroupButtonSettings)
    ], RibbonItem.prototype, "groupButtonSettings", void 0);
    __decorate([
        Complex({}, RibbonGallerySettings)
    ], RibbonItem.prototype, "gallerySettings", void 0);
    return RibbonItem;
}(ChildProperty));
export { RibbonItem };
