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
import { ChildProperty, Property, Complex, Collection } from '@syncfusion/ej2-base';
import { BackstageBackButton } from './ribbon-back-button';
import { BackstageItem } from './ribbon-backstage-item';
import { RibbonTooltip } from './ribbon-tooltip';
/**
 * Defines the ribbon file menu settings.
 */
var BackStageMenu = /** @class */ (function (_super) {
    __extends(BackStageMenu, _super);
    function BackStageMenu() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @param {Object} prop - Gets the property of Backstage Menu.
     * @param {boolean} muteOnChange - Gets the boolean value of muteOnChange.
     * @returns {void}
     * @private
     */
    BackStageMenu.prototype.setProperties = function (prop, muteOnChange) {
        _super.prototype.setProperties.call(this, prop, muteOnChange);
    };
    __decorate([
        Property('File')
    ], BackStageMenu.prototype, "text", void 0);
    __decorate([
        Property('')
    ], BackStageMenu.prototype, "keyTip", void 0);
    __decorate([
        Property(false)
    ], BackStageMenu.prototype, "visible", void 0);
    __decorate([
        Property('auto')
    ], BackStageMenu.prototype, "height", void 0);
    __decorate([
        Property('auto')
    ], BackStageMenu.prototype, "width", void 0);
    __decorate([
        Property(null)
    ], BackStageMenu.prototype, "target", void 0);
    __decorate([
        Complex({}, BackstageBackButton)
    ], BackStageMenu.prototype, "backButton", void 0);
    __decorate([
        Collection([], BackstageItem)
    ], BackStageMenu.prototype, "items", void 0);
    __decorate([
        Property('')
    ], BackStageMenu.prototype, "template", void 0);
    __decorate([
        Complex({}, RibbonTooltip)
    ], BackStageMenu.prototype, "ribbonTooltipSettings", void 0);
    return BackStageMenu;
}(ChildProperty));
export { BackStageMenu };
