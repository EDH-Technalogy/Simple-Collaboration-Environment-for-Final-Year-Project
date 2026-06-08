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
import { ChildProperty, Event, Property } from '@syncfusion/ej2-base';
/**
 * Defines the ribbon color picker.
 */
var RibbonColorPickerSettings = /** @class */ (function (_super) {
    __extends(RibbonColorPickerSettings, _super);
    function RibbonColorPickerSettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of colorpicker.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonColorPickerSettings.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property(10)
    ], RibbonColorPickerSettings.prototype, "columns", void 0);
    __decorate([
        Property('')
    ], RibbonColorPickerSettings.prototype, "cssClass", void 0);
    __decorate([
        Property('')
    ], RibbonColorPickerSettings.prototype, "label", void 0);
    __decorate([
        Property(true)
    ], RibbonColorPickerSettings.prototype, "enableOpacity", void 0);
    __decorate([
        Property('Palette')
    ], RibbonColorPickerSettings.prototype, "mode", void 0);
    __decorate([
        Property(true)
    ], RibbonColorPickerSettings.prototype, "modeSwitcher", void 0);
    __decorate([
        Property(false)
    ], RibbonColorPickerSettings.prototype, "noColor", void 0);
    __decorate([
        Property(null)
    ], RibbonColorPickerSettings.prototype, "presetColors", void 0);
    __decorate([
        Property(true)
    ], RibbonColorPickerSettings.prototype, "showButtons", void 0);
    __decorate([
        Property('#008000ff')
    ], RibbonColorPickerSettings.prototype, "value", void 0);
    __decorate([
        Property({})
    ], RibbonColorPickerSettings.prototype, "htmlAttributes", void 0);
    __decorate([
        Event()
    ], RibbonColorPickerSettings.prototype, "beforeClose", void 0);
    __decorate([
        Event()
    ], RibbonColorPickerSettings.prototype, "beforeOpen", void 0);
    __decorate([
        Event()
    ], RibbonColorPickerSettings.prototype, "beforeTileRender", void 0);
    __decorate([
        Event()
    ], RibbonColorPickerSettings.prototype, "created", void 0);
    __decorate([
        Event()
    ], RibbonColorPickerSettings.prototype, "change", void 0);
    __decorate([
        Event()
    ], RibbonColorPickerSettings.prototype, "open", void 0);
    __decorate([
        Event()
    ], RibbonColorPickerSettings.prototype, "select", void 0);
    return RibbonColorPickerSettings;
}(ChildProperty));
export { RibbonColorPickerSettings };
