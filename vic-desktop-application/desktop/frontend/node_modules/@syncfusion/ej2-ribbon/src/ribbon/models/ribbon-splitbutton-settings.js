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
 * Defines the ribbon SplitButton item.
 */
var RibbonSplitButtonSettings = /** @class */ (function (_super) {
    __extends(RibbonSplitButtonSettings, _super);
    function RibbonSplitButtonSettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of DropDown.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonSplitButtonSettings.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property('')
    ], RibbonSplitButtonSettings.prototype, "closeActionEvents", void 0);
    __decorate([
        Property('')
    ], RibbonSplitButtonSettings.prototype, "content", void 0);
    __decorate([
        Property('')
    ], RibbonSplitButtonSettings.prototype, "cssClass", void 0);
    __decorate([
        Property('')
    ], RibbonSplitButtonSettings.prototype, "iconCss", void 0);
    __decorate([
        Collection([], Item)
    ], RibbonSplitButtonSettings.prototype, "items", void 0);
    __decorate([
        Property('')
    ], RibbonSplitButtonSettings.prototype, "target", void 0);
    __decorate([
        Property({})
    ], RibbonSplitButtonSettings.prototype, "htmlAttributes", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "beforeClose", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "beforeItemRender", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "beforeOpen", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "close", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "click", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "created", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "open", void 0);
    __decorate([
        Event()
    ], RibbonSplitButtonSettings.prototype, "select", void 0);
    return RibbonSplitButtonSettings;
}(ChildProperty));
export { RibbonSplitButtonSettings };
