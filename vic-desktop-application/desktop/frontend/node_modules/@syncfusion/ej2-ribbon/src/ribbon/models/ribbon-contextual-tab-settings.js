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
import { ChildProperty, Property, Collection } from '@syncfusion/ej2-base';
import { RibbonTab } from './ribbon-tab';
/**
 * Defines the ribbon contextual tab.
 */
var RibbonContextualTabSettings = /** @class */ (function (_super) {
    __extends(RibbonContextualTabSettings, _super);
    function RibbonContextualTabSettings() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of contextual tab.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonContextualTabSettings.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property(false)
    ], RibbonContextualTabSettings.prototype, "visible", void 0);
    __decorate([
        Property(false)
    ], RibbonContextualTabSettings.prototype, "isSelected", void 0);
    __decorate([
        Collection([], RibbonTab)
    ], RibbonContextualTabSettings.prototype, "tabs", void 0);
    return RibbonContextualTabSettings;
}(ChildProperty));
export { RibbonContextualTabSettings };
