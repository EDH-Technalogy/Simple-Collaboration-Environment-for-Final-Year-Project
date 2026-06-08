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
 * Defines the ribbon button item.
 */
var RibbonButtonSettings = /** @class */ (function (_super) {
    __extends(RibbonButtonSettings, _super);
    function RibbonButtonSettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of button.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonButtonSettings.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property('')
    ], RibbonButtonSettings.prototype, "content", void 0);
    __decorate([
        Property('')
    ], RibbonButtonSettings.prototype, "cssClass", void 0);
    __decorate([
        Property('')
    ], RibbonButtonSettings.prototype, "iconCss", void 0);
    __decorate([
        Property(false)
    ], RibbonButtonSettings.prototype, "isToggle", void 0);
    __decorate([
        Property(false)
    ], RibbonButtonSettings.prototype, "isPrimary", void 0);
    __decorate([
        Property({})
    ], RibbonButtonSettings.prototype, "htmlAttributes", void 0);
    __decorate([
        Event()
    ], RibbonButtonSettings.prototype, "created", void 0);
    __decorate([
        Event()
    ], RibbonButtonSettings.prototype, "clicked", void 0);
    return RibbonButtonSettings;
}(ChildProperty));
export { RibbonButtonSettings };
