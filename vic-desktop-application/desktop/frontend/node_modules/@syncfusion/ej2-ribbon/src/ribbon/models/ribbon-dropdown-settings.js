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
import { ChildProperty, Collection, Event, Property } from '@syncfusion/ej2-base';
import { Item } from '@syncfusion/ej2-splitbuttons';
/**
 * Defines the ribbon DropDownButton item.
 */
var RibbonDropDownSettings = /** @class */ (function (_super) {
    __extends(RibbonDropDownSettings, _super);
    function RibbonDropDownSettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of DropDown.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonDropDownSettings.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property('')
    ], RibbonDropDownSettings.prototype, "closeActionEvents", void 0);
    __decorate([
        Property('')
    ], RibbonDropDownSettings.prototype, "content", void 0);
    __decorate([
        Property('')
    ], RibbonDropDownSettings.prototype, "cssClass", void 0);
    __decorate([
        Property('')
    ], RibbonDropDownSettings.prototype, "iconCss", void 0);
    __decorate([
        Collection([], Item)
    ], RibbonDropDownSettings.prototype, "items", void 0);
    __decorate([
        Property('')
    ], RibbonDropDownSettings.prototype, "target", void 0);
    __decorate([
        Property(false)
    ], RibbonDropDownSettings.prototype, "createPopupOnClick", void 0);
    __decorate([
        Property({})
    ], RibbonDropDownSettings.prototype, "htmlAttributes", void 0);
    __decorate([
        Event()
    ], RibbonDropDownSettings.prototype, "beforeClose", void 0);
    __decorate([
        Event()
    ], RibbonDropDownSettings.prototype, "beforeItemRender", void 0);
    __decorate([
        Event()
    ], RibbonDropDownSettings.prototype, "beforeOpen", void 0);
    __decorate([
        Event()
    ], RibbonDropDownSettings.prototype, "close", void 0);
    __decorate([
        Event()
    ], RibbonDropDownSettings.prototype, "created", void 0);
    __decorate([
        Event()
    ], RibbonDropDownSettings.prototype, "open", void 0);
    __decorate([
        Event()
    ], RibbonDropDownSettings.prototype, "select", void 0);
    return RibbonDropDownSettings;
}(ChildProperty));
export { RibbonDropDownSettings };
