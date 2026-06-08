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
import { ChildProperty, Collection, Property } from '@syncfusion/ej2-base';
import { RibbonGroup } from './ribbon-group';
/**
 * Defines the ribbon tab.
 */
var RibbonTab = /** @class */ (function (_super) {
    __extends(RibbonTab, _super);
    function RibbonTab() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of tab.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    RibbonTab.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property('')
    ], RibbonTab.prototype, "keyTip", void 0);
    __decorate([
        Property('')
    ], RibbonTab.prototype, "id", void 0);
    __decorate([
        Property('')
    ], RibbonTab.prototype, "cssClass", void 0);
    __decorate([
        Collection([], RibbonGroup)
    ], RibbonTab.prototype, "groups", void 0);
    __decorate([
        Property('')
    ], RibbonTab.prototype, "header", void 0);
    return RibbonTab;
}(ChildProperty));
export { RibbonTab };
